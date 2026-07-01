const STORAGE_KEY = "jangho_records_v2";

const ADDRESS_DATA = {
  "장호1리": [
    "장호항길",
    "장호1길",
    "장호안길",
    "삼척로"
  ],
  "장호2리": [
    "장호길",
    "장호2길",
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
    "용화해변길",
    "삼척로"
  ]
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

let records =
JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

let currentVillage = "";

let currentPhoto = "";

let editingId = null;

render();

cameraBtn.onclick = () => {

    photoInput.click();

};

photoInput.onchange = e => {

    const file = e.target.files[0];

    if(!file) return;

    compressImage(file,1000,0.75).then(base64=>{

        currentPhoto = base64;

        preview.src = base64;

        preview.classList.remove("hidden");

    });

};

document
.querySelectorAll(".villages button")
.forEach(btn=>{

    btn.onclick=()=>{

        document
        .querySelectorAll(".villages button")
        .forEach(b=>b.classList.remove("active"));

        btn.classList.add("active");

        currentVillage = btn.dataset.village;

        renderRoads();

    };

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

    if(currentPhoto===""){

        alert("사진을 먼저 찍어주세요.");

        return;

    }

    if(nameInput.value.trim()===""){

        alert("성함을 입력하세요.");

        return;

    }

    if(currentVillage===""){

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

        const index=
        records.findIndex(r=>r.id===editingId);

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

    currentPhoto="";

    currentVillage="";

    editingId=null;

    nameInput.value="";

    detailInput.value="";

    roadSelect.innerHTML="<option>도로명 선택</option>";

    preview.src="";

    preview.classList.add("hidden");

    photoInput.value="";

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

        if(keyword==="") return true;

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

    <h3>${escapeHtml(data.name)}</h3>

    <p><b>${data.village}</b></p>

    <p>${data.road} ${data.detail}</p>

    <p style="color:#888;font-size:14px;">
    ${data.created}
    </p>

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

    const img=div.querySelector("img");

    img.onclick=()=>{

        window.open(data.photo);

    };

    div
    .querySelector(".editBtn")
    .onclick=()=>{

        editingId=data.id;

        currentPhoto=data.photo;

        preview.src=data.photo;

        preview.classList.remove("hidden");

        nameInput.value=data.name;

        detailInput.value=data.detail;

        currentVillage=data.village;

        document
        .querySelectorAll(".villages button")
        .forEach(btn=>{

            btn.classList.toggle(
                "active",
                btn.dataset.village===currentVillage
            );

        });

        renderRoads();

        roadSelect.value=data.road;

        saveBtn.textContent="수정 저장";

        window.scrollTo({

            top:0,

            behavior:"smooth"

        });

    };

    div
    .querySelector(".deleteBtn")
    .onclick=()=>{

        if(!confirm(
            `${data.name}님 정보를 삭제할까요?`
        )) return;

        records=
        records.filter(r=>r.id!==data.id);

        saveStorage();

        render();

    };

    list.appendChild(div);

}

function escapeHtml(text){

    return String(text)

    .replaceAll("&","&amp;")

    .replaceAll("<","&lt;")

    .replaceAll(">","&gt;")

    .replaceAll('"',"&quot;")

    .replaceAll("'","&#039;");

}

function compressImage(

    file,

    maxWidth,

    quality

){

    return new Promise(resolve=>{

        const reader=new FileReader();

        reader.onload=e=>{

            const img=new Image();

            img.onload=()=>{

                const scale=

                Math.min(

                    1,

                    maxWidth/img.width

                );

                const canvas=

                document.createElement("canvas");

                canvas.width=

                img.width*scale;

                canvas.height=

                img.height*scale;

                const ctx=

                canvas.getContext("2d");

                ctx.drawImage(

                    img,

                    0,

                    0,

                    canvas.width,

                    canvas.height

                );

                resolve(

                    canvas.toDataURL(

                        "image/jpeg",

                        quality

                    )

                );

            };

            img.src=e.target.result;

        };

        reader.readAsDataURL(file);

    });

}

/* ===========================
   Excel 저장
=========================== */

excelBtn.onclick = async () => {

    if(records.length===0){

        alert("저장된 데이터가 없습니다.");

        return;

    }

    const workbook=new ExcelJS.Workbook();

    const sheet=workbook.addWorksheet("장호");

    sheet.columns=[

        {header:"사진",width:18},

        {header:"성함",width:15},

        {header:"마을",width:12},

        {header:"도로명",width:18},

        {header:"상세주소",width:18},

        {header:"저장시간",width:25}

    ];

    sheet.getRow(1).font={

        bold:true,

        size:13

    };

    let row=2;

    for(const item of records){

        sheet.getRow(row).height=90;

        sheet.getCell(`B${row}`).value=item.name;

        sheet.getCell(`C${row}`).value=item.village;

        sheet.getCell(`D${row}`).value=item.road;

        sheet.getCell(`E${row}`).value=item.detail;

        sheet.getCell(`F${row}`).value=item.created;

        if(item.photo){

            const imageId=

            workbook.addImage({

                base64:item.photo,

                extension:"jpeg"

            });

            sheet.addImage(

                imageId,

                {

                    tl:{

                        col:0.15,

                        row:row-0.85

                    },

                    ext:{

                        width:90,

                        height:90

                    }

                }

            );

        }

        row++;

    }

    const buffer=

    await workbook.xlsx.writeBuffer();

    saveAs(

        new Blob([buffer]),

        `장호사진_${todayString()}.xlsx`

    );

    alert("엑셀 저장 완료!");

};


/* ===========================
   날짜
=========================== */

function todayString(){

    const d=new Date();

    const y=d.getFullYear();

    const m=String(

        d.getMonth()+1

    ).padStart(2,"0");

    const day=String(

        d.getDate()

    ).padStart(2,"0");

    return `${y}-${m}-${day}`;

}


/* ===========================
   종료 경고
=========================== */

window.addEventListener(

    "beforeunload",

    e=>{

        if(records.length===0)

        return;

        e.preventDefault();

        e.returnValue="";

    }

);