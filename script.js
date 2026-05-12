const LIB_URL = "https://script.google.com/macros/s/AKfycbyijPTnQTlQXY4PuDdn6Ij8w0KSyTZB12iyybY0cRqZDF2mO-iRNPUQLfHPy0--f_I3Jg/exec";
const HELPER_URL = "https://script.google.com/macros/s/AKfycbyKDmQeViTbhVTu9PZX5XuaIvCbAv5lzurD2GWJOBvazwbCeWbhgQZauZh7yaCOyniE/exec";
const RANK_URL = "https://script.google.com/macros/s/AKfycbxIMWqxX8U9yrgB-YPYToonzsL1e-lW_j51ypP1l_VLEc-wCRqOehCGXUlSrQ5LxcuV/exec";
const USER_URL = "https://script.google.com/macros/s/AKfycbzq-gyy4pSAWRQKbuEjEoocfROTTrEHVE2fD-E4AHiyAHoSgEUkoB5Do3onDPIMYn54/exec";

let masterLib = [], masterHelper = [], masterRank = [];
let currentRankCat = 'totalUnit';
let isShowScore = false;

// --- MODIFIKASI DISINI: Tambahkan variabel untuk menyimpan tanggal ---
window.lastUpdateDate = ""; 

async function initData() {
    try {
        const [l, h, r] = await Promise.all([
            fetch(LIB_URL).then(res => res.json()),
            fetch(HELPER_URL).then(res => res.json()),
            fetch(RANK_URL).then(res => res.json())
        ]);
        
        masterLib = l; 
        masterHelper = h; 
        
        // --- MODIFIKASI DISINI: Menyesuaikan struktur data baru (ranks & lastUpdate) ---
        masterRank = r.ranks || []; 
        window.lastUpdateDate = r.lastUpdate || "";
        
        updatePodium(); 
        renderRankList();
    } catch (e) { console.error("Sync Error", e); }
}
initData();

setInterval(() => {
    isShowScore = !isShowScore;
    updatePodium();
}, 3000);

function updatePodium() {
    if (masterRank.length === 0) return;
    const sorted = [...masterRank].sort((a, b) => b[currentRankCat] - a[currentRankCat]);
    [0, 1, 2].forEach(index => {
        const data = sorted[index];
        const card = document.getElementById(`rank${index + 1}`);
        if(card && data) {
            const idSpan = card.querySelector('.rank-id');
            const scoreSpan = card.querySelector('.rank-score');
            idSpan.innerText = "ID: " + data.id;
            scoreSpan.innerText = data[currentRankCat] + " Unit";
            idSpan.style.display = isShowScore ? 'none' : 'block';
            scoreSpan.style.display = isShowScore ? 'block' : 'none';
        }
    });
}

function setRankCategory(cat, btn) {
    currentRankCat = cat;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updatePodium(); renderRankList();
}

function renderRankList() {
    const container = document.getElementById('rankList');
    if (!container) return;

    // --- MODIFIKASI DISINI: Menampilkan tanggal update di elemen update-info ---
    const updateLabel = document.getElementById('update-info');
    if (updateLabel && window.lastUpdateDate) {
        updateLabel.innerText = "Periode: " + window.lastUpdateDate;
    }

    const sorted = [...masterRank].sort((a, b) => b[currentRankCat] - a[currentRankCat]).slice(0, 20);
    container.innerHTML = sorted.map((item, i) => `
        <div class="rank-row" onclick="toggleDetail('det-${i}')">
            <div class="rank-number">#${i + 1}</div>
            <div style="flex:1; margin-left:10px;">
                <strong>ID: ${item.id}</strong>
                <div id="det-${i}" class="detail-box">
                    AC: ${item.ac} | TV: ${item.tv} | Kulkas: ${item.kulkas} | MC: ${item.mesinCuci} | Lain: ${item.lainLain}
                </div>
            </div>
            <div style="font-weight:bold;">${item[currentRankCat]} Unit</div>
        </div>
    `).join('');
}

function toggleDetail(id) {
    const el = document.getElementById(id);
    el.style.display = (el.style.display === 'block') ? 'none' : 'block';
}

// ==========================================
// UPGRADE FUNGSI HELPER (TETAP SAMA)
// ==========================================
function cariError() {
    const keyword = document.getElementById("helperSN").value.toLowerCase().trim();
    const errInput = document.getElementById("helperError").value.toLowerCase().trim();
    const container = document.getElementById("helperResult");

    const filtered = masterHelper.filter(item => {
        const combinedString = (item.kategori + " " + item.merk + " " + item.serialNumber).toLowerCase();
        const matchKeyword = keyword === "" || combinedString.includes(keyword);
        const matchErr = errInput === "" || item.kodeError.toLowerCase().includes(errInput);
        return matchKeyword && matchErr;
    });

    if (filtered.length === 0) {
        container.innerHTML = "<p style='text-align:center; padding:20px;'>❌ Data tidak ditemukan.</p>";
        return;
    }

    container.innerHTML = filtered.map(item => `
        <div class="result-item" style="border-left: 6px solid #d32f2f;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="background:#0d47a1; color:#fff; padding:2px 8px; border-radius:4px; font-size:0.7rem; font-weight:bold; text-transform:uppercase;">${item.kategori}</span>
                <span style="font-weight:bold; color:#0d47a1; font-size:0.85rem;">${item.merk}</span>
            </div>
            <div style="font-size:0.8rem; color:#666; margin-bottom:5px;">Nomor Seri: ${item.serialNumber.toUpperCase()}</div>
            <strong style="color:#d32f2f; font-size:1.1rem;">Error: ${item.kodeError.toUpperCase()}</strong><br>
            <p style="font-weight:bold; margin-top:5px; color:#333;">Arti: ${item.artiKode}</p>
            <div style="background:#fff9f9; padding:10px; border-radius:8px; margin-top:8px; border:1px solid #ffdada;">
                <small style="color:#666; font-weight:bold;">SOLUSI:</small><br>
                <p style="font-size:0.9rem; line-height:1.4;">${item.solusi}</p>
            </div>
        </div>
    `).join('');
}

function bukaTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabcontent.length; i++) { tabcontent[i].style.display = "none"; }
    const tablinks = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tablinks.length; i++) { tablinks[i].classList.remove("active"); }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
}

function cariLibrary() {
    const kat = document.getElementById("libCategory").value;
    const cari = document.getElementById("libSearch").value.toLowerCase().trim();
    const filtered = masterLib.filter(item => {
        const matchKat = kat === "" || item.kategori.toUpperCase() === kat.toUpperCase();
        const matchCari = item.kataKunci.includes(cari) || item.merk.toLowerCase().includes(cari) || item.seri.toLowerCase().includes(cari);
        return matchKat && matchCari;
    });

    document.getElementById("libResult").innerHTML = filtered.map(item => {
        // Cek apakah link ada dan bukan tanda "-"
        const hasPPT = item.linkPPT && item.linkPPT !== "-";
        const hasBook = item.linkBook && item.linkBook !== "-";

        // Jika ada link, tampilkan tombol. Jika tidak (berisi "-"), tampilkan kotak kosong (visibility:hidden) 
        // agar posisi tombol lainnya tetap konsisten di tempatnya.
        const btnPPT = hasPPT 
            ? `<a href="${item.linkPPT}" style="background:#0d47a1; width:48%; color:white; padding:10px; border-radius:8px; text-align:center; text-decoration:none;" target="_blank">PPT</a>` 
            : `<div style="width:48%; visibility:hidden;"></div>`;

        const btnBook = hasBook 
            ? `<a href="${item.linkBook}" style="background:#e65100; width:48%; color:white; padding:10px; border-radius:8px; text-align:center; text-decoration:none;" target="_blank">BOOK</a>` 
            : `<div style="width:48%; visibility:hidden;"></div>`;

        return `
            <div class="result-item">
                <strong style="color:#0d47a1;">${item.merk} - ${item.seri}</strong><br>
                <div style="display:flex; gap:8px; margin-top:10px; justify-content: space-between;">
                    ${btnPPT}
                    ${btnBook}
                </div>
            </div>
        `;
    }).join('');
}

function toggleCard(id) {
    const x = document.getElementById(id);
    x.style.display = (x.style.display === "none") ? "block" : "none";
}

function showK3Modal(t, d, i) {
    document.getElementById('k3Modal').style.display = 'flex';
    document.getElementById('modalTitle').innerText = t;
    document.getElementById('modalDesc').innerText = d;
    document.getElementById('modalImg').src = i;
}

function tutupK3Modal() { document.getElementById('k3Modal').style.display = 'none'; }

function toggleAuthMode(mode) {
    document.getElementById('loginView').style.display = mode === 'login' ? 'block' : 'none';
    document.getElementById('signupView').style.display = mode === 'signup' ? 'block' : 'none';
}

async function handleSignup() {
    const idS = document.getElementById('regIdStaff').value.trim();
    const idE = document.getElementById('regIdErajaya').value.trim();
    const pass = document.getElementById('regPass').value.trim();
    if(!idS || !idE || !pass) return alert("Semua kolom harus diisi!");
    const res = await fetch(USER_URL, {
        method: "POST",
        body: JSON.stringify({ action: "signup", idStaff: idS, idErajaya: idE, password: pass })
    }).then(r => r.json());
    if(res.status === "success") { alert(res.message); toggleAuthMode('login'); } else { alert(res.message); }
}

async function handleLogin() {
    const user = document.getElementById('loginId').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    if(!user || !pass) return alert("Isi ID dan Password!");
    const res = await fetch(USER_URL, {
        method: "POST",
        body: JSON.stringify({ action: "login", userId: user, password: pass })
    }).then(r => r.json());
    if(res.status === "success") { showProfile(res.data); } else { alert(res.message); }
}

function showProfile(data) {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('signupView').style.display = 'none';
    document.getElementById('profileView').style.display = 'block';
    document.getElementById('profName').innerText = data.name;
    document.getElementById('profIdStaff').innerText = data.idStaff;
    document.getElementById('profIdEra').innerText = data.idErajaya;
    document.getElementById('profGudang').innerText = data.gudang;
    const certBox = document.getElementById('certList');
    certBox.innerHTML = "";
    data.certs.forEach((link, i) => {
        if(link && link.includes("http")) {
            certBox.innerHTML += `<a href="${link}" class="cert-link" target="_blank">Sertifikat ${i+1} <i class="fa-solid fa-circle-check" style="float:right;"></i></a>`;
        }
    });
}

function logout() {
    document.getElementById('profileView').style.display = 'none';
    document.getElementById('loginView').style.display = 'block';
}