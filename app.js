const STORAGE_KEY = "jangho_records_v1";

const ADDRESS_DATA = {
  "장호1리": ["장호항길", "장호길", "장호1길", "장호2길", "장호안길", "삼척로"],
  "장호2리": ["장호항길", "장호길", "장호1길", "장호2길", "장호안길", "삼척로"],
  "용화1리": ["용화길", "용화안길", "용화해변길", "용화해변1길", "용화해변2길","삼척로"],
  "용화2리": ["용화길", "용화안길", "용화해변길", "용화해변1길", "용화해변2길","삼척로"]
};

const cameraBtn = document.getElementById("cameraBtn");
const photoInput = document.getElementById("photoInput");
const preview = document.getElementById("preview");

const nameInput = document.getElementById("nameInput");
const roadSelect = document.getElementById("roadSelect");
const detailInput = document.getElementById("detailInput");

const saveBtn = document.getElementById("saveBtn");
const excelBtn = document.getElementById("excelBtn");

const searchInput = document.getElementById("searchInput");
const list = document.getElementById("list");
const count = document.getElementById("count");

let records =
JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

let currentVillage = "";
let editingId = null;
let currentPhoto = "";

render();

cameraBtn.onclick = () => photoInput.click();

photoInput.onchange = e => {

    const file = e.target.files[0];

    if(!file) return;

    const reader = new FileReader();

    reader.onload = ev => {

        currentPhoto = ev.target.result;

        preview.src = currentPhoto;

        preview.classList.remove("hidden");

    };

    reader.readAsDataURL(file);

};

document
.querySelectorAll(".villages button")
.forEach(btn=>{

    btn.onclick=()=>{

        document
        .querySelectorAll(".villages button")
        .forEach(b=>b.classList.remove("active"));

        btn.classList.add("active");

        currentVillage=btn.dataset.village;

        renderRoads();

    }

});

function renderRoads(){

    roadSelect.innerHTML="";

    ADDRESS_DATA[currentVillage].forEach(road=>{

        const option=document.createElement("option");

        option.value=road;

        option.textContent=road;

        roadSelect.appendChild(option);

    });

}

saveBtn.onclick=()=>{

    if(!currentPhoto){

        alert("사진을 먼저 촬영하세요.");

        return;

    }

    if(!nameInput.value.trim()){

        alert("성함을 입력하세요.");

        return;

    }

    if(!currentVillage){

        alert("마을을 선택하세요.");

        return;

    }

    const data={

        id:editingId || Date.now(),

        photo:currentPhoto,

        name:nameInput.value.trim(),

        village:currentVillage,

        road:roadSelect.value,

        detail:detailInput.value.trim(),

        created:new Date().toLocaleString()

    };

    if(editingId){

        const index=records.findIndex(r=>r.id===editingId);

        records[index]=data;

        editingId=null;

        saveBtn.textContent="저장";

    }else{

        records.unshift(data);

    }

    saveStorage();

    clearForm();

    render();

};

function saveStorage(){

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(records)

    );

}

function clearForm(){

    nameInput.value="";

    detailInput.value="";

    photoInput.value="";

    preview.src="";

    preview.classList.add("hidden");

    currentPhoto="";

    currentVillage="";

    roadSelect.innerHTML="<option>도로명 선택</option>";

    document
    .querySelectorAll(".villages button")
    .forEach(b=>b.classList.remove("active"));

}

searchInput.oninput=render;

function render(){

    const keyword=
    searchInput.value.trim();

    const filtered=

    records.filter(r=>{

        if(!keyword) return true;

        return(

            r.name.includes(keyword)||

            r.village.includes(keyword)||

            r.road.includes(keyword)||

            r.detail.includes(keyword)

        );

    });

    count.textContent=

    `${filtered.length}명 저장됨`;

    list.innerHTML="";

    filtered.forEach(addCard);

}

function addCard(data){

    const div=document.createElement("div");

    div.className="item";

    div.innerHTML=`

    <h3>${data.name}</h3>

    <p>${data.village}</p>

    <p>${data.road} ${data.detail}</p>

    <p>${data.created}</p>

    <img src="${data.photo}">

    <div class="itemButtons">

        <button class="editBtn">

        수정

        </button>

        <button class="deleteBtn">

        삭제

        </button>

    </div>

    `;
    const editBtn = div.querySelector(".editBtn");
    const deleteBtn = div.querySelector(".deleteBtn");

    editBtn.onclick = () => {

        editingId = data.id;

        currentPhoto = data.photo;

        preview.src = data.photo;
        preview.classList.remove("hidden");

        nameInput.value = data.name;
        detailInput.value = data.detail;

        currentVillage = data.village;

        document
            .querySelectorAll(".villages button")
            .forEach(btn => {
                btn.classList.toggle(
                    "active",
                    btn.dataset.village === currentVillage
                );
            });

        renderRoads();

        roadSelect.value = data.road;

        saveBtn.textContent = "수정 저장";

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    };

    deleteBtn.onclick = () => {

        if (!confirm(`${data.name} 님 정보를 삭제하시겠습니까?`))
            return;

        records = records.filter(r => r.id !== data.id);

        saveStorage();

        render();

    };

    list.appendChild(div);

}

/* ===========================
   엑셀 저장
=========================== */

excelBtn.onclick = async () => {

    if (records.length === 0) {
        alert("저장된 데이터가 없습니다.");
        return;
    }

    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet("장호");

    sheet.columns = [
        { header: "사진", key: "photo", width: 18 },
        { header: "성함", key: "name", width: 15 },
        { header: "마을", key: "village", width: 12 },
        { header: "도로명", key: "road", width: 18 },
        { header: "상세주소", key: "detail", width: 18 },
        { header: "저장시간", key: "created", width: 24 }
    ];

    sheet.getRow(1).font = {
        bold: true
    };

    let rowIndex = 2;

    for (const r of records) {

        sheet.getRow(rowIndex).height = 90;

        sheet.getCell(`B${rowIndex}`).value = r.name;
        sheet.getCell(`C${rowIndex}`).value = r.village;
        sheet.getCell(`D${rowIndex}`).value = r.road;
        sheet.getCell(`E${rowIndex}`).value = r.detail;
        sheet.getCell(`F${rowIndex}`).value = r.created;

        if (r.photo) {

            const imageId = workbook.addImage({
                base64: r.photo,
                extension: "jpeg"
            });

            sheet.addImage(imageId, {
                tl: {
                    col: 0.15,
                    row: rowIndex - 0.85
                },
                ext: {
                    width: 90,
                    height: 90
                }
            });

        }

        rowIndex++;

    }

    const buffer = await workbook.xlsx.writeBuffer();

    saveAs(
        new Blob([
            buffer
        ]),
        `장호사진_${new Date().toISOString().slice(0,10)}.xlsx`
    );

    alert("엑셀 저장 완료!");

};

/* ===========================
   페이지 종료 경고
=========================== */

window.addEventListener("beforeunload", e => {

    if (records.length === 0)
        return;

    e.preventDefault();

    e.returnValue = "";

});