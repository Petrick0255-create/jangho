const STORAGE_KEY = "jangho_records_v3";

const ADDRESS_DATA = {
  "장호1리": ["장호항길", "장호1길", "장호안길", "삼척로", "지번"],
  "장호2리": ["장호길", "장호2길", "삼척로", "지번"],
  "용화1리": ["용화길", "용화안길", "용화해변길", "삼척로", "지번"],
  "용화2리": ["용화해변1길", "용화해변2길", "용화해변길", "삼척로", "지번"]
};

const cameraBtn = document.getElementById("cameraBtn");
const photoInput = document.getElementById("photoInput");
const preview = document.getElementById("preview");
const nameInput = document.getElementById("nameInput");
const detailInput = document.getElementById("detailInput");
const roadSelect = document.getElementById("roadSelect");
const saveBtn = document.getElementById("saveBtn");
const excelBtn = document.getElementById("excelBtn");
const searchInput = document.getElementById("searchInput");
const list = document.getElementById("list");
const count = document.getElementById("count");

let records = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let currentVillage = "";
let currentPhoto = "";
let editingId = null;

render();

cameraBtn.onclick = () => photoInput.click();

photoInput.onchange = async e => {
  const file = e.target.files[0];
  if (!file) return;

  currentPhoto = await compressImage(file, 900, 0.7);
  preview.src = currentPhoto;
  preview.classList.remove("hidden");
};

document.querySelectorAll(".villages button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".villages button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    currentVillage = btn.dataset.village;
    renderRoads();
  };
});

function renderRoads() {
  roadSelect.innerHTML = "";
  ADDRESS_DATA[currentVillage].forEach(road => {
    const option = document.createElement("option");
    option.value = road;
    option.textContent = road;
    roadSelect.appendChild(option);
  });
}

saveBtn.onclick = () => {
  if (!currentPhoto) return alert("사진을 먼저 찍어주세요.");
  if (!nameInput.value.trim()) return alert("성함을 입력하세요.");
  if (!currentVillage) return alert("마을을 선택하세요.");

  const data = {
    id: editingId || Date.now(),
    photo: currentPhoto,
    name: nameInput.value.trim(),
    village: currentVillage,
    road: roadSelect.value,
    detail: detailInput.value.trim(),
    created: new Date().toLocaleString("ko-KR")
  };

  if (editingId) {
    const index = records.findIndex(r => r.id === editingId);
    records[index] = data;
  } else {
    records.unshift(data);
  }

  saveStorage();
  clearForm();
  render();
};

function saveStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    alert("저장 공간이 부족합니다. 엑셀을 저장한 뒤 일부 기록을 삭제하세요.");
  }
}

function clearForm() {
  currentPhoto = "";
  currentVillage = "";
  editingId = null;

  nameInput.value = "";
  detailInput.value = "";
  roadSelect.innerHTML = `<option value="">도로명 선택</option>`;

  preview.src = "";
  preview.classList.add("hidden");
  photoInput.value = "";

  saveBtn.textContent = "저장";

  document.querySelectorAll(".villages button").forEach(b => b.classList.remove("active"));
}

searchInput.oninput = render;

function render() {
  const keyword = searchInput.value.trim();

  const filtered = records.filter(r => {
    if (!keyword) return true;
    return (
      r.name.includes(keyword) ||
      r.village.includes(keyword) ||
      r.road.includes(keyword) ||
      r.detail.includes(keyword)
    );
  });

  count.textContent = `${filtered.length}명 저장됨`;
  list.innerHTML = "";

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty">저장된 기록이 없습니다.</div>`;
    return;
  }

  filtered.forEach(addCard);
}

function addCard(data) {
  const div = document.createElement("div");
  div.className = "item";

  div.innerHTML = `
    <h3>${escapeHtml(data.name)}</h3>
    <p><b>${escapeHtml(data.village)}</b></p>
    <p>${escapeHtml(data.road)} ${escapeHtml(data.detail)}</p>
    <p style="color:#888;font-size:14px;">${escapeHtml(data.created)}</p>
    <img src="${data.photo}">
    <div class="itemButtons">
      <button class="editBtn">수정</button>
      <button class="deleteBtn">삭제</button>
    </div>
  `;

  div.querySelector("img").onclick = () => {
    const w = window.open();
    if (w) w.document.write(`<img src="${data.photo}" style="width:100%">`);
  };

  div.querySelector(".editBtn").onclick = () => {
    editingId = data.id;
    currentPhoto = data.photo;
    currentVillage = data.village;

    preview.src = data.photo;
    preview.classList.remove("hidden");

    nameInput.value = data.name;
    detailInput.value = data.detail;

    document.querySelectorAll(".villages button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.village === currentVillage);
    });

    renderRoads();
    roadSelect.value = data.road;

    saveBtn.textContent = "수정 저장";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  div.querySelector(".deleteBtn").onclick = () => {
    if (!confirm(`${data.name}님 정보를 삭제할까요?`)) return;
    records = records.filter(r => r.id !== data.id);
    saveStorage();
    render();
  };

  list.appendChild(div);
}

excelBtn.onclick = async () => {
  if (records.length === 0) {
    alert("저장된 데이터가 없습니다.");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("장호");

  sheet.columns = [
    { header: "사진", width: 22 },
    { header: "성함", width: 15 },
    { header: "마을", width: 12 },
    { header: "도로명", width: 18 },
    { header: "상세주소", width: 18 },
    { header: "저장시간", width: 25 }
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).height = 24;

  let row = 2;

  for (const item of records) {
    sheet.getRow(row).height = 110;

    sheet.getCell(`B${row}`).value = item.name;
    sheet.getCell(`C${row}`).value = item.village;
    sheet.getCell(`D${row}`).value = item.road;
    sheet.getCell(`E${row}`).value = item.detail;
    sheet.getCell(`F${row}`).value = item.created;

    if (item.photo) {
      const imageId = workbook.addImage({
        base64: item.photo,
        extension: "jpeg"
      });

      sheet.addImage(imageId, {
        tl: { col: 0, row: row - 1 },
        ext: { width: 105, height: 105 }
      });
    }

    row++;
  }

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  saveAs(blob, `장호사진_${todayString()}.xlsx`);
};

function compressImage(file, maxWidth, quality) {
  return new Promise(resolve => {
    const reader = new FileReader();

    reader.onload = e => {
      const img = new Image();

      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.addEventListener("beforeunload", e => {
  if (records.length === 0) return;
  e.preventDefault();
  e.returnValue = "";
});