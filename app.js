const ADDRESS_DATA = {
  "장호1리": ["장호항길", "장호1길", "장호안길", "삼척로"],
  "장호2리": ["장호길", "장호2길", "삼척로"],
  "용화1리": ["용화길", "용화안길", "용화해변길", "삼척로"],
  "용화2리": ["용화해변1길", "용화해변2길", "삼척로"]
};

const STORAGE_KEY = "jangho_photo_records_v1";

const nameInput = document.getElementById("nameInput");
const roadSelect = document.getElementById("roadSelect");
const detailInput = document.getElementById("detailInput");
const photoInput = document.getElementById("photoInput");
const preview = document.getElementById("preview");
const saveBtn = document.getElementById("saveBtn");
const csvBtn = document.getElementById("csvBtn");
const list = document.getElementById("list");

let selectedVillage = "";
let photoData = "";
let records = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

renderList();

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

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = e => {
    photoData = e.target.result;
    preview.src = photoData;
    preview.classList.remove("hidden");
  };

  reader.readAsDataURL(file);
});

saveBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const road = roadSelect.value;
  const detail = detailInput.value.trim();

  if (!name) return alert("성함을 입력하세요.");
  if (!selectedVillage) return alert("마을을 선택하세요.");
  if (!road) return alert("도로명을 선택하세요.");

  const record = {
    id: Date.now(),
    name,
    village: selectedVillage,
    road,
    detail,
    photo: photoData,
    createdAt: new Date().toLocaleString("ko-KR")
  };

  records.unshift(record);
  saveRecords();

  nameInput.value = "";
  detailInput.value = "";
  photoInput.value = "";
  photoData = "";
  preview.classList.add("hidden");

  renderList();
});

csvBtn.addEventListener("click", downloadCSV);

function renderRoads() {
  roadSelect.innerHTML = "";

  ADDRESS_DATA[selectedVillage].forEach(road => {
    const option = document.createElement("option");
    option.value = road;
    option.textContent = road;
    roadSelect.appendChild(option);
  });
}

function renderList() {
  list.innerHTML = "";

  records.forEach(record => {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <strong>${record.name}</strong>
      <p>${record.village} ${record.road} ${record.detail}</p>
      <p>${record.createdAt}</p>
      ${record.photo ? `<img src="${record.photo}">` : ""}
    `;

    list.appendChild(div);
  });
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function downloadCSV() {
  const rows = [
    ["성함", "마을", "도로명", "상세주소", "저장시간"],
    ...records.map(r => [r.name, r.village, r.road, r.detail, r.createdAt])
  ];

  const csv = rows
    .map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "jangho_records.csv";
  a.click();

  URL.revokeObjectURL(url);
}