// URL Library (Tetap Menggunakan URL yang Lama)
const LIB_URL = "https://script.google.com/macros/s/AKfycbyijPTnQTlQXY4PuDdn6Ij8w0KSyTZB12iyybY0cRqZDF2mO-iRNPUQLfHPy0--f_I3Jg/exec";

// URL Helper/Troubleshooting (Menggunakan URL yang Baru Saja Anda Kirim)
const HELPER_URL = "https://script.google.com/macros/s/AKfycbyKDmQeViTbhVTu9PZX5XuaIvCbAv5lzurD2GWJOBvazwbCeWbhgQZauZh7yaCOyniE/exec";

let masterLib = [];
let masterHelper = [];

// Fetch data saat web dibuka
async function initData() {
    try {
        const [libRes, helpRes] = await Promise.all([
            fetch(LIB_URL).then(r => r.json()),
            fetch(HELPER_URL).then(r => r.json())
        ]);
        masterLib = libRes;
        masterHelper = helpRes;
        console.log("Data Berhasil Sinkron");
    } catch (e) {
        console.error("Gagal Sinkron:", e);
    }
}
initData();

function bukaTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabcontent.length; i++) { tabcontent[i].style.display = "none"; }
    const tablinks = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tablinks.length; i++) { tablinks[i].classList.remove("active"); }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
    window.scrollTo(0, 0);
}

// FUNGSI CARI LIBRARY (SMART LIBRARY)
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
                <a href="${item.linkPPT}" class="link-btn" style="background:#0d47a1; flex:1;" target="_blank">PPT MATERI</a>
                <a href="${item.linkBook}" class="link-btn" style="background:#e65100; flex:1;" target="_blank">MANUAL BOOK</a>
            </div>
        </div>
    `).join('');
}

// FUNGSI CARI ERROR (TROUBLESHOOTING)
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
        // Mencocokkan Serial Number DAN Kode Error
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