import {
  saveRecord,
  loadRecords,
  uploadImage,
  updateRecord,
  deleteRecord
} from "./firebase.js";

const ADDRESS_DATA = {
  "장호1리": [
    "삼척로",
    "장호길",
    "장호1길",
    "장호2길",
    "장호항길",
    "장호안1길",
    "장호안2길"
  ],
  "장호2리": [
    "삼척로",
    "장호길",
    "장호1길",
    "장호2길",
    "장호항길",
    "장호안1길",
    "장호안2길"
  ],
  "용화1리": [
    "삼척로",
    "용화길",
    "용화해변길",
    "용화해변1길",
    "용화안길"
  ],
  "용화2리": [
    "삼척로",
    "용화길",
    "용화해변길",
    "용화해변1길",
    "용화안길"
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
let editingId = null;
let editingImageUrl = "";

init();

function init() {
  bindPhoto();
  bindVillageButtons();
  bindSave();
  bindCSV();
  bindSearch();
  bindListActions();
  refreshRecords();
}

function bindPhoto() {
  photoBtn.addEventListener("click", () => photoInput.click());

  photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];
    if (!file) return;

    selectedFile = file;
    preview.src = URL.createObjectURL(file);
    preview.classList.remove("hidden");
    formCard.classList.remove("disabled");

    setTimeout(() => {
      nameInput.focus();
      formCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  });
}

function bindVillageButtons() {
  document.querySelectorAll(".village-grid button").forEach(btn => {
    btn.addEventListener("click", () => {
      selectVillage(btn.dataset.village);
    });
  });
}

function selectVillage(village) {
  selectedVillage = village;

  document.querySelectorAll(".village-grid button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.village === village);
  });

  renderRoads();
}

function renderRoads() {
  roadSelect.innerHTML = "";

  if (!selectedVillage || !ADDRESS_DATA[selectedVillage]) {
    roadSelect.innerHTML = `<option value="">마을을 먼저 선택하세요</option>`;
    return;
  }

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

    if (!name) return alert("성함을 입력하세요.");
    if (!selectedVillage) return alert("마을을 선택하세요.");
    if (!road) return alert("도로명을 선택하세요.");

    if (!editingId && !selectedFile) {
      return alert("사진을 먼저 촬영하세요.");
    }

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = editingId ? "수정 중..." : "저장 중...";

      let imageUrl = editingImageUrl;

      if (selectedFile) {
        statusEl.textContent = "사진 업로드 중...";
        imageUrl = await uploadImage(selectedFile);
      }

      statusEl.textContent = editingId ? "수정 저장 중..." : "정보 저장 중...";

      const data = {
        name,
        village: selectedVillage,
        road,
        detail,
        imageUrl
      };

      if (editingId) {
        await updateRecord(editingId, data);
        statusEl.textContent = "수정 완료";
      } else {
        await saveRecord(data);
        statusEl.textContent = "저장 완료";
      }

      resetForm();
      await refreshRecords();

      window.scrollTo({ top: 0, behavior: "smooth" });

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

function bindListActions() {
  list.addEventListener("click", async e => {
    const editBtn = e.target.closest(".edit-btn");
    const deleteBtn = e.target.closest(".delete-btn");

    if (editBtn) {
      startEdit(editBtn.dataset.id);
    }

    if (deleteBtn) {
      await removeItem(deleteBtn.dataset.id);
    }
  });
}

function startEdit(id) {
  const record = records.find(r => r.id === id);
  if (!record) return;

  editingId = record.id;
  editingImageUrl = record.imageUrl || "";
  selectedFile = null;

  nameInput.value = record.name || "";
  detailInput.value = record.detail || "";

  selectVillage(record.village || "");
  roadSelect.value = record.road || "";

  if (editingImageUrl) {
    preview.src = editingImageUrl;
    preview.classList.remove("hidden");
  }

  formCard.classList.remove("disabled");
  saveBtn.textContent = "수정 저장";
  photoBtn.textContent = "📷 사진 변경";

  formCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function removeItem(id) {
  const record = records.find(r => r.id === id);
  if (!record) return;

  if (!confirm(`${record.name} 님 기록을 삭제할까요?`)) return;

  try {
    statusEl.textContent = "삭제 중...";
    await deleteRecord(id);
    statusEl.textContent = "삭제 완료";
    await refreshRecords();
  } catch (err) {
    console.error(err);
    alert("삭제 실패");
    statusEl.textContent = "삭제 실패";
  }
}

function resetForm() {
  selectedFile = null;
  selectedVillage = "";
  editingId = null;
  editingImageUrl = "";

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

  saveBtn.textContent = "저장";
  photoBtn.textContent = "📷 사진 찍기";
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

    item.innerHTML = `
      <strong>${escapeHTML(record.name)}</strong>
      <p>${escapeHTML(record.village)} ${escapeHTML(record.road)} ${escapeHTML(record.detail || "")}</p>
      <p>${formatTime(record.createdAt)}</p>
      ${record.imageUrl ? `<img src="${record.imageUrl}" alt="사진">` : ""}
      <div class="item-actions">
        <button class="edit-btn" data-id="${record.id}">수정</button>
        <button class="delete-btn" data-id="${record.id}">삭제</button>
      </div>
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
    if (timestamp.toDate) return timestamp.toDate().toLocaleString("ko-KR");
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