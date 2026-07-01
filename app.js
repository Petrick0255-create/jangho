import {
  saveRecord,
  loadRecords,
  uploadImage
} from "./firebase.js";

const ADDRESS_DATA = {
  "장호1리": [
    "갈남길",
    "장호1길",
    "장호안1길",
    "장호안2길",
    "장호안3길",
    "장호항길",
    "삼척로"
  ],

  "장호2리": [
    "장호길",
    "장호2길",
    "장호안길",
    "장호항길",
    "삼척로"
  ],

  "용화1리": [
    "용화길",
    "용화안길",
    "용화해변길",
    "삼척로"
  ],

  "용화2리": [
    "용화해변1길",
    "용화해변2길",
    "용화길",
    "삼척로"
  ]
};

const photoBtn = document.getElementById("photoBtn");
const photoInput = document.getElementById("photoInput");
const preview = document.getElementById("preview");
const formCard = document.getElementById("formCard");

const nameInput = document.getElementById("nameInput");
const roadSelect = document.getElementById("roadSelect");
const detailInput = document.getElementById("detailInput");
const saveBtn = document.getElementById("saveBtn");
const csvBtn = document.getElementById("csvBtn");
const list = document.getElementById("list");
const statusEl = document.getElementById("status");
const searchInput = document.getElementById("searchInput");

let selectedVillage = "";
let selectedFile = null;
let records = [];

init();

function init() {
  bindPhoto();
  bindVillageButtons();
  bindSave();
  bindCSV();
  bindSearch();
  refreshRecords();
}

function bindPhoto() {
  photoBtn.addEventListener("click", () => {
    photoInput.click();
  });

  photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];

    if (!file) return;

    selectedFile = file;

    preview.src = URL.createObjectURL(file);
    preview.classList.remove("hidden");

    formCard.classList.remove("disabled");

    setTimeout(() => {
      nameInput.focus();
      formCard.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 200);
  });
}

function bindVillageButtons() {
  document.querySelectorAll(".village-grid button").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedVillage = btn.dataset.village;

      document.querySelectorAll(".village-grid button").forEach(b => {
        b.classList.remove("active");
      });

      btn.classList.add("active");
      renderRoads();
    });
  });
}

function renderRoads() {
  roadSelect.innerHTML = "";

  ADDRESS_DATA[selectedVillage].forEach(road => {
    const option = document.createElement("option");
    option.value = road;
    option.textContent = road;
    roadSelect.appendChild(option);
  });
}

function bindSave() {
  saveBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    const road = roadSelect.value;
    const detail = detailInput.value.trim();

    if (!selectedFile) return alert("사진을 먼저 촬영하세요.");
    if (!name) return alert("성함을 입력하세요.");
    if (!selectedVillage) return alert("마을을 선택하세요.");
    if (!road) return alert("도로명을 선택하세요.");

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = "저장 중...";
      statusEl.textContent = "사진 업로드 중...";

      const imageUrl = await uploadImage(selectedFile);

      statusEl.textContent = "정보 저장 중...";

      await saveRecord({
        name,
        village: selectedVillage,
        road,
        detail,
        imageUrl
      });

      statusEl.textContent = "저장 완료";

      resetForm();
      await refreshRecords();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    } catch (err) {
      console.error(err);
      alert("저장 실패: Firebase 설정이나 규칙을 확인하세요.");
      statusEl.textContent = "저장 실패";
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "저장";
    }
  });
}

function resetForm() {
  selectedFile = null;
  selectedVillage = "";

  photoInput.value = "";
  preview.src = "";
  preview.classList.add("hidden");

  nameInput.value = "";
  detailInput.value = "";

  roadSelect.innerHTML = `<option value="">마을을 먼저 선택하세요</option>`;

  document.querySelectorAll(".village-grid button").forEach(btn => {
    btn.classList.remove("active");
  });

  formCard.classList.add("disabled");
}

async function refreshRecords() {
  try {
    records = await loadRecords();
    renderList(records);
  } catch (err) {
    console.error(err);
    statusEl.textContent = "목록 불러오기 실패";
  }
}

function renderList(data) {
  list.innerHTML = "";

  if (data.length === 0) {
    list.innerHTML = `<p class="empty">저장된 기록이 없습니다.</p>`;
    return;
  }

  data.forEach(record => {
    const item = document.createElement("div");
    item.className = "item";

    const time = formatTime(record.createdAt);

    item.innerHTML = `
      <strong>${escapeHTML(record.name)}</strong>
      <p>${escapeHTML(record.village)} ${escapeHTML(record.road)} ${escapeHTML(record.detail || "")}</p>
      <p>${time}</p>
      ${record.imageUrl ? `<img src="${record.imageUrl}" alt="사진">` : ""}
    `;

    list.appendChild(item);
  });
}

function bindSearch() {
  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.trim();

    if (!keyword) {
      renderList(records);
      return;
    }

    const filtered = records.filter(r =>
      String(r.name || "").includes(keyword) ||
      String(r.village || "").includes(keyword) ||
      String(r.road || "").includes(keyword) ||
      String(r.detail || "").includes(keyword)
    );

    renderList(filtered);
  });
}

function bindCSV() {
  csvBtn.addEventListener("click", () => {
    const rows = [
      ["성함", "마을", "도로명", "상세주소", "사진URL", "저장시간"],
      ...records.map(r => [
        r.name || "",
        r.village || "",
        r.road || "",
        r.detail || "",
        r.imageUrl || "",
        formatTime(r.createdAt)
      ])
    ];

    const csv = rows
      .map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "jangho_records.csv";
    a.click();

    URL.revokeObjectURL(url);
  });
}

function formatTime(timestamp) {
  if (!timestamp) return "";

  try {
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString("ko-KR");
    }

    return new Date(timestamp).toLocaleString("ko-KR");
  } catch {
    return "";
  }
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}