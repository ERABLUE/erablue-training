// URL Library & Helper (Tetap dari code Anda)
const LIB_URL = "https://script.google.com/macros/s/AKfycbyijPTnQTlQXY4PuDdn6Ij8w0KSyTZB12iyybY0cRqZDF2mO-iRNPUQLfHPy0--f_I3Jg/exec";
const HELPER_URL = "https://script.google.com/macros/s/AKfycbyKDmQeViTbhVTu9PZX5XuaIvCbAv5lzurD2GWJOBvazwbCeWbhgQZauZh7yaCOyniE/exec";
// URL Rank (Menggunakan yang baru)
const RANK_URL = "https://script.google.com/macros/s/AKfycbxIMWqxX8U9yrgB-YPYToonzsL1e-lW_j51ypP1l_VLEc-wCRqOehCGXUlSrQ5LxcuV/exec";

let masterLib = [];
let masterHelper = [];
let masterRank = [];
let currentRankCat = 'totalUnit';
let isShowScore = false;

// Fetch data saat web dibuka
async function initData() {
    try {
        const [libRes, helpRes, rankRes] = await Promise.all([
            fetch(LIB_URL).then(r => r.json()),
            fetch(HELPER_URL).then(r => r.json()),
            fetch(RANK_URL).then(r => r.json())
        ]);
        masterLib = libRes;
        masterHelper = helpRes;
        masterRank = rankRes;
        console.log("Data Berhasil Sinkron");
        
        // Inisialisasi Rank
        updatePodium();
        renderRankList();
    } catch (e) {
        console.error("Gagal Sinkron:", e);
    }
}
initData();

// ANIMASI IDLE PODIUM (Setiap 3 detik berubah ID <-> SKOR)
setInterval(() => {
    isShowScore = !isShowScore;
    updatePodium();
}, 3000);

function updatePodium() {
    if (masterRank.length === 0) return;
    const sorted = [...masterRank].sort((a, b) => b[currentRankCat] - a[currentRankCat]);
    
    // Ambil Top 3
    const top3 = [sorted[0], sorted[1], sorted[2]];
    
    top3.forEach((data, index) => {
        const card = document.getElementById(`rank${index + 1}`);
        if(card && data) {
            const idSpan = card.querySelector('.rank-id');
            const scoreSpan = card.querySelector('.rank-score');
            
            if (isShowScore) {
                idSpan.style.display = 'none';
                scoreSpan.style.display = 'block';
                scoreSpan.innerText = data[currentRankCat] + " Unit";
            } else {
                idSpan.style.display = 'block';
                scoreSpan.style.display = 'none';
                idSpan.innerText = "ID: " + data.id;
            }
        }
    });
}

function setRankCategory(cat, btn) {
    currentRankCat = cat;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updatePodium();
    renderRankList();
}

function renderRankList() {
    const listContainer = document.getElementById('rankList');
    if (masterRank.length === 0) {
        listContainer.innerHTML = "<p style='text-align:center;'>Memuat data...</p>";
        return;
    }

    const sorted = [...masterRank].sort((a, b) => b[currentRankCat] - a[currentRankCat]).slice(0, 20);

    listContainer.innerHTML = sorted.map((item, i) => `
        <div class="rank-row" onclick="toggleDetail('det-${i}')">
            <div class="rank-number">#${i + 1}</div>
            <div class="rank-info">
                <strong>ID: ${item.id}</strong>
                <div id="det-${i}" class="detail-box">
                    <strong>Rincian Pemasangan:</strong><br>
                    ❄️ AC: ${item.ac} Unit<br>
                    📺 TV: ${item.tv} Unit<br>
                    📦 Kulkas: ${item.kulkas} Unit<br>
                    🧺 Mesin Cuci: ${item.mesinCuci} Unit<br>
                    🛠️ Lain-lain: ${item.lainLain} Unit
                </div>
            </div>
            <div class="rank-val">${item[currentRankCat]} Unit</div>
        </div>
    `).join('');
}

function toggleDetail(id) {
    const el = document.getElementById(id);
    const allDetail = document.querySelectorAll('.detail-box');
    const isShowing = el.style.display === 'block';
    
    allDetail.forEach(d => d.style.display = 'none');
    if (!isShowing) el.style.display = 'block';
}

// FUNGSI NAVIGASI & TAB (Tetap dari code Anda)
function bukaTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabcontent.length; i++) { tabcontent[i].style.display = "none"; }
    const tablinks = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tablinks.length; i++) { tablinks[i].classList.remove("active"); }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
    window.scrollTo(0, 0);
}

function cariLibrary() {
    const kat = document.getElementById("libCategory").value;
    const cari = document.getElementById("libSearch").value.toLowerCase().trim();
    const resContainer = document.getElementById("libResult");
    const filtered = masterLib.filter(item => {
        const matchKat = kat === "" || item.kategori.toUpperCase() === kat.toUpperCase();
        const matchCari = item.kataKunci.includes(cari) || item.merk.toLowerCase().includes(cari) || item.seri.toLowerCase().includes(cari);
        return matchKat && matchCari;
    });
    if (filtered.length === 0) {
        resContainer.innerHTML = "<p style='text-align:center; padding:20px;'>❌ Data tidak ditemukan.</p>";
        return;
    }
    resContainer.innerHTML = filtered.map(item => `
        <div class="result-item">
            <strong style="color:#0d47a1;">${item.merk} - ${item.seri}</strong><br>
            <small>Kategori: ${item.kategori}</small>
            <div style="display:flex; gap:8px; margin-top:10px;">
                <a href="${item.linkPPT}" class="link-btn" style="background:#0d47a1; flex:1; text-align:center; color:white; text-decoration:none; padding:10px; border-radius:8px; font-size:0.8rem; font-weight:bold;" target="_blank">PPT MATERI</a>
                <a href="${item.linkBook}" class="link-btn" style="background:#e65100; flex:1; text-align:center; color:white; text-decoration:none; padding:10px; border-radius:8px; font-size:0.8rem; font-weight:bold;" target="_blank">MANUAL BOOK</a>
            </div>
        </div>
    `).join('');
}

function cariError() {
    const snInput = document.getElementById("helperSN").value.toLowerCase().trim();
    const errInput = document.getElementById("helperError").value.toLowerCase().trim();
    const resContainer = document.getElementById("helperResult");
    if (masterHelper.length === 0) {
        resContainer.innerHTML = "Menyinkronkan data...";
        initData();
        return;
    }
    const filtered = masterHelper.filter(item => {
        const matchSN = snInput === "" || item.serialNumber.includes(snInput);
        const matchErr = errInput === "" || item.kodeError.includes(errInput);
        return matchSN && matchErr;
    });
    if (filtered.length === 0) {
        resContainer.innerHTML = "<p style='text-align:center; padding:20px;'>❌ Solusi tidak ditemukan.</p>";
        return;
    }
    resContainer.innerHTML = filtered.map(item => `
        <div class="result-item" style="border-left: 6px solid #d32f2f;">
            <div style="margin-bottom:8px;">
                <span style="background:#d32f2f; color:#fff; padding:2px 8px; border-radius:4px; font-size:0.7rem; font-weight:bold;">${item.merk}</span>
                <span style="background:#eee; padding:2px 8px; border-radius:4px; font-size:0.7rem; margin-left:5px;">SN: ${item.serialNumber.toUpperCase()}</span>
            </div>
            <strong style="color:#d32f2f; font-size:1.1rem;">Error: ${item.kodeError.toUpperCase()}</strong><br>
            <p style="font-weight:bold; margin-top:5px; color:#333;">Arti: ${item.artiKode}</p>
            <div style="background:#fff9f9; padding:10px; border-radius:8px; margin-top:8px; border:1px solid #ffdada;">
                <small style="color:#666; font-weight:bold;">SOLUSI:</small><br>
                <p style="font-size:0.9rem; line-height:1.4;">${item.solusi}</p>
            </div>
        </div>
    `).join('');
}

function toggleCard(id) {
    const x = document.getElementById(id);
    x.style.display = (x.style.display === "none") ? "block" : "none";
}

function showK3Modal(title, desc, imgSrc) {
    document.getElementById('k3Modal').style.display = 'flex';
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalDesc').innerText = desc;
    document.getElementById('modalImg').src = imgSrc;
}

function tutupK3Modal() {
    document.getElementById('k3Modal').style.display = 'none';
}