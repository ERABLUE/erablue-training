// ============================================================
// KONFIGURASI URL GAS
// Ganti URL di bawah setelah deploy GAS masing-masing
// ============================================================
const WEB_URL   = "https://script.google.com/macros/s/AKfycbzHtf338-9TYyWkxOjqD_EQYS4VvuEN3yh907mDA6ac38-WQPbu4PtIVSZ89kNDsf9IPQ/exec";   // GAS_WebErablue.js
const RANK_URL  = "https://script.google.com/macros/s/AKfycbxAxx43d3hFtUMS7LwiqzGDmoZI_GvQfir9oPsUJbY-ouJB12VuI2rld0Z_x5dbDLdd/exec";          // GAS_RekapPengirimanStaff.js

// ============================================================
// STATE GLOBAL
// ============================================================
let masterLib      = [];
let masterHelper   = [];
let masterVideos   = [];
let masterComments = [];
let masterRank     = [];

let currentRankCat   = 'totalUnit';
let currentBoardMode = 'leaderboard'; // 'leaderboard' | 'bottomboard'
let isShowScore      = false;
let loginFailCount   = 0;

let loggedInUserStaffId = "";
let currentActiveVideoId = "";
window.lastUpdateDate = "";

// ============================================================
// INISIALISASI: jalankan semua fetch data di awal
// ============================================================
async function initData() {
    try {
        const [libRes, helperRes] = await Promise.all([
            fetch(`${WEB_URL}?action=readLibrary`).then(r => r.json()),
            fetch(`${WEB_URL}?action=readHelper`).then(r => r.json()),
        ]);

        // Library
        if (libRes.status === "success") {
            masterLib = libRes.data;
            populateLibraryDropdown(libRes.kataKunciList || []);
        }

        // Helper
        if (helperRes.status === "success") {
            masterHelper = helperRes.data;
        }

        // Video
        await muatDataVideoDanKomentar();

        // Rank: muat daftar sheet dulu
        await muatDaftarSheetRank();

    } catch (e) {
        console.error("initData Error:", e);
    }
}
initData();

// Toggle podium antara tampilkan ID dan skor setiap 3 detik
setInterval(() => {
    isShowScore = !isShowScore;
    updatePodium();
}, 3000);

// ============================================================
// NAVIGASI TAB
// ============================================================
function bukaTab(evt, tabName) {
    document.querySelectorAll(".tab-content").forEach(t => t.style.display = "none");
    document.querySelectorAll(".tab-link").forEach(b => b.classList.remove("active"));
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
    // Tutup board dropdown jika buka tab lain
    closeBoardMenu();
}

// ============================================================
// LIBRARY: Populasi dropdown kategori secara dinamis
// ============================================================
function populateLibraryDropdown(kataKunciList) {
    const sel = document.getElementById("libCategory");
    // Ambil semua kategori unik dari masterLib (UNIT → kategori produk)
    const unitKategori = [...new Set(
        masterLib.filter(item => item.kataKunci.toUpperCase() === "UNIT")
                 .map(item => item.kategori)
                 .filter(k => k)
    )];

    // Reset & isi ulang
    sel.innerHTML = `<option value="">Semua Kategori</option>`;
    unitKategori.forEach(k => {
        sel.innerHTML += `<option value="${k}">${k}</option>`;
    });
    kataKunciList.forEach(k => {
        sel.innerHTML += `<option value="__KK__${k}">${k}</option>`;
    });
}

// ============================================================
// LIBRARY: Cari dokumen
// ============================================================
function cariLibrary() {
    const btn = document.getElementById("btnCariLibrary");
    const spinner = btn?.querySelector(".loading-icon");
    if (spinner) spinner.style.display = "inline-block";
    if (btn) btn.disabled = true;

    setTimeout(() => {
        const selVal = document.getElementById("libCategory").value;
        const cari   = document.getElementById("libSearch").value.toLowerCase().trim();

        const filtered = masterLib.filter(item => {
            let matchKat = true;
            if (selVal.startsWith("__KK__")) {
                // Filter berdasarkan kataKunci
                matchKat = item.kataKunci === selVal.replace("__KK__", "");
            } else if (selVal) {
                matchKat = item.kategori.toUpperCase() === selVal.toUpperCase();
            }
            const matchCari = !cari || item.merk.toLowerCase().includes(cari) || item.seri.toLowerCase().includes(cari);
            return matchKat && matchCari;
        });

        const container = document.getElementById("libResult");
        if (filtered.length === 0) {
            container.innerHTML = "<p style='text-align:center; padding:20px;'>❌ Data tidak ditemukan.</p>";
        } else {
            container.innerHTML = filtered.map(item => {
                const hasPPT  = item.linkPPT  && item.linkPPT  !== "-" && item.linkPPT.startsWith("http");
                const hasBook = item.linkBook && item.linkBook !== "-" && item.linkBook.startsWith("http");
                const btnPPT  = hasPPT  ? `<a href="${item.linkPPT}"  style="background:#0d47a1; width:48%; color:white; padding:10px; border-radius:8px; text-align:center; text-decoration:none;" target="_blank">PPT</a>`  : `<div style="width:48%; visibility:hidden;"></div>`;
                const btnBook = hasBook ? `<a href="${item.linkBook}" style="background:#e65100; width:48%; color:white; padding:10px; border-radius:8px; text-align:center; text-decoration:none;" target="_blank">BOOK</a>` : `<div style="width:48%; visibility:hidden;"></div>`;
                return `
                    <div class="result-item">
                        <span style="background:#e0e7ff; color:#3730a3; font-size:0.7rem; padding:2px 8px; border-radius:4px; font-weight:700;">${item.kategori}</span>
                        <strong style="color:#0d47a1; display:block; margin-top:6px;">${item.merk} - ${item.seri}</strong>
                        <div style="display:flex; gap:8px; margin-top:10px; justify-content:space-between;">
                            ${btnPPT}${btnBook}
                        </div>
                    </div>`;
            }).join('');
        }

        if (spinner) spinner.style.display = "none";
        if (btn) btn.disabled = false;
    }, 50);
}

// ============================================================
// HELPER / TROUBLESHOOTING
// ============================================================
function cariError() {
    const btn = document.getElementById("btnCariError");
    const spinner = btn?.querySelector(".loading-icon");
    if (spinner) spinner.style.display = "inline-block";
    if (btn) btn.disabled = true;

    setTimeout(() => {
        const keyword  = document.getElementById("helperSN").value.toLowerCase().trim();
        const errInput = document.getElementById("helperError").value.toLowerCase().trim();

        const filtered = masterHelper.filter(item => {
            const combined = (item.kategori + " " + item.merk + " " + item.serialNumber).toLowerCase();
            return (!keyword || combined.includes(keyword)) && (!errInput || item.kodeError.toLowerCase().includes(errInput));
        });

        const container = document.getElementById("helperResult");
        if (filtered.length === 0) {
            container.innerHTML = "<p style='text-align:center; padding:20px;'>❌ Data tidak ditemukan.</p>";
        } else {
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
                </div>`).join('');
        }

        if (spinner) spinner.style.display = "none";
        if (btn) btn.disabled = false;
    }, 50);
}

// ============================================================
// VIDEO: Muat data video + komentar
// ============================================================
async function muatDataVideoDanKomentar() {
    try {
        const [vidRes, komRes] = await Promise.all([
            fetch(`${WEB_URL}?action=readVideo`).then(r => r.json()),
            fetch(`${WEB_URL}?action=readComments`).then(r => r.json()),
        ]);

        if (vidRes.status === "success") {
            masterVideos = vidRes.data;
            populateVideoDropdown(vidRes.kategoriList || []);
            if (masterVideos.length > 0) {
                if (!currentActiveVideoId) {
                    setVideoUtama(masterVideos[0].idVideo);
                } else {
                    renderListPilihanVideo(masterVideos);
                    renderKomentarVideo(currentActiveVideoId);
                }
            } else {
                document.getElementById("mainVideoTitle").innerText = "Belum ada video tersedia.";
            }
        }

        if (komRes.status === "success") {
            masterComments = komRes.data;
        }

        cekStatusAksesFormKomentarVideo();
    } catch (err) {
        console.error("Gagal memuat video:", err);
    }
}

function populateVideoDropdown(kategoriList) {
    const sel = document.getElementById("videoCategorySelect");
    sel.innerHTML = `<option value="">Semua Kategori</option>`;
    kategoriList.forEach(k => {
        sel.innerHTML += `<option value="${k}">${k}</option>`;
    });
}

function setVideoUtama(idVideo) {
    currentActiveVideoId = idVideo;
    const videoData = masterVideos.find(v => v.idVideo === idVideo);
    if (!videoData) return;
    document.getElementById("mainYoutubePlayer").src = `https://www.youtube.com/embed/${idVideo}`;
    document.getElementById("mainVideoTitle").innerText = videoData.judul;
    document.getElementById("mainVideoDesc").innerText = videoData.keterangan || "Tidak ada keterangan.";
    renderListPilihanVideo(masterVideos);
    renderKomentarVideo(idVideo);
}

function renderListPilihanVideo(listVideo) {
    const container = document.getElementById("videoListContainer");
    if (!container) return;
    const sisa = listVideo.filter(v => v.idVideo !== currentActiveVideoId);
    if (sisa.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#888; padding:10px;'>Tidak ada pilihan video lainnya.</p>";
        return;
    }
    container.innerHTML = sisa.map(v => `
        <div class="video-card-item" onclick="setVideoUtama('${v.idVideo}')">
            <div class="video-thumbnail-box">
                <img src="https://img.youtube.com/vi/${v.idVideo}/mqdefault.jpg" alt="${v.judul}" loading="lazy">
                <span class="video-badge-tag">${v.kategori}</span>
            </div>
            <div class="video-card-info"><h4>${v.judul}</h4></div>
        </div>`).join('');
}

function filterDaftarVideo() {
    const filterKat  = document.getElementById("videoCategorySelect").value.toUpperCase();
    const cariJudul  = document.getElementById("videoSearchInput").value.toLowerCase().trim();
    const hasil = masterVideos.filter(v => {
        const cocokKat   = !filterKat  || v.kategori.toUpperCase() === filterKat;
        const cocokJudul = !cariJudul  || v.judul.toLowerCase().includes(cariJudul) || (v.keterangan && v.keterangan.toLowerCase().includes(cariJudul));
        return cocokKat && cocokJudul;
    });
    renderListPilihanVideo(hasil);
}

function renderKomentarVideo(idVideo) {
    const container  = document.getElementById("videoCommentsList");
    const countLabel = document.getElementById("commentCount");
    if (!container) return;
    const komentarIni = masterComments.filter(c => String(c.idVideo) === String(idVideo));
    if (countLabel) countLabel.innerText = komentarIni.length;
    if (komentarIni.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#888; padding:20px 0;'>Belum ada komentar. Jadilah yang pertama!</p>";
        return;
    }
    container.innerHTML = [...komentarIni].reverse().map(c => `
        <div class="comment-item-row">
            <div class="comment-meta-user">
                <span class="comment-user-id"><i class="fa-solid fa-user-gear"></i> ID: ${c.idStaff}</span>
                <span class="comment-date-time">${c.tanggal}</span>
            </div>
            <p class="comment-text-content">${c.komentar}</p>
        </div>`).join('');
}

async function kirimKomentarTeknisi() {
    const isiKomentar = document.getElementById("inputIsiKomentar").value.trim();
    if (!isiKomentar) return alert("Silakan ketik isi komentar terlebih dahulu!");
    if (!loggedInUserStaffId) return alert("Sesi login tidak terdeteksi. Silakan login kembali di tab User.");

    const btn = document.getElementById("btnKirimKomentar");
    const spinner = btn?.querySelector(".loading-icon");
    if (spinner) spinner.style.display = "inline-block";
    if (btn) btn.disabled = true;

    try {
        const res = await fetch(WEB_URL, {
            method: "POST",
            body: JSON.stringify({ action: "addComment", idVideo: currentActiveVideoId, idStaff: loggedInUserStaffId, komentar: isiKomentar })
        }).then(r => r.json());

        if (res.status === "SUCCESS") {
            document.getElementById("inputIsiKomentar").value = "";
            await muatDataVideoDanKomentar();
        } else {
            alert("Gagal mengirim: " + res.message);
        }
    } catch (err) {
        alert("Koneksi gagal.");
    } finally {
        if (spinner) spinner.style.display = "none";
        if (btn) btn.disabled = false;
    }
}

function cekStatusAksesFormKomentarVideo() {
    const formBox   = document.getElementById("videoCommentForm");
    const noticeBox = document.getElementById("videoCommentLoginNotice");
    if (loggedInUserStaffId) {
        if (formBox)   formBox.style.display   = "block";
        if (noticeBox) noticeBox.style.display = "none";
    } else {
        if (formBox)   formBox.style.display   = "none";
        if (noticeBox) noticeBox.style.display = "block";
    }
    if (currentActiveVideoId) renderKomentarVideo(currentActiveVideoId);
}

// ============================================================
// RANK: Muat daftar sheet (dropdown Periode)
// ============================================================
async function muatDaftarSheetRank() {
    try {
        const res = await fetch(`${RANK_URL}?action=getSheets`).then(r => r.json());
        if (res.status !== "success") return;

        const sel = document.getElementById("rankPeriodeSelect");
        sel.innerHTML = "";
        res.sheets.forEach((name, i) => {
            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            sel.appendChild(opt);
        });

        // Auto-pilih sheet terakhir (data terbaru)
        if (res.sheets.length > 0) {
            sel.value = res.sheets[res.sheets.length - 1];
            await muatDataRank(sel.value);
        }
    } catch (err) {
        console.error("Gagal muat sheet rank:", err);
    }
}

async function onPeriodeChange() {
    const sheetName = document.getElementById("rankPeriodeSelect").value;
    // Reset filter gudang
    document.getElementById("rankGudangSelect").innerHTML = `<option value="">Semua Gudang</option>`;
    await muatDataRank(sheetName);
}

async function onGudangChange() {
    const sheetName  = document.getElementById("rankPeriodeSelect").value;
    const gudang     = document.getElementById("rankGudangSelect").value;
    await muatDataRank(sheetName, gudang);
}

async function muatDataRank(sheetName, gudangFilter) {
    if (!sheetName) return;
    const gudang = gudangFilter !== undefined ? gudangFilter : document.getElementById("rankGudangSelect").value;

    try {
        let url = `${RANK_URL}?action=getRankData&sheet=${encodeURIComponent(sheetName)}`;
        if (gudang) url += `&gudang=${encodeURIComponent(gudang)}`;

        const res = await fetch(url).then(r => r.json());
        if (res.status !== "success") return;

        masterRank = res.ranks || [];
        window.lastUpdateDate = res.lastUpdate || sheetName;

        // Isi dropdown gudang hanya saat pertama load sheet (tanpa filter gudang)
        if (!gudangFilter) {
            const selGudang = document.getElementById("rankGudangSelect");
            const currentVal = selGudang.value;
            selGudang.innerHTML = `<option value="">Semua Gudang</option>`;
            (res.gudangList || []).forEach(g => {
                const o = document.createElement("option");
                o.value = g; o.textContent = g;
                if (g === currentVal) o.selected = true;
                selGudang.appendChild(o);
            });
        }

        // Update UI
        const updateLabel = document.getElementById("update-info");
        if (updateLabel) updateLabel.innerText = "Periode: " + window.lastUpdateDate;

        updatePodium();
        renderRankList();
    } catch (err) {
        console.error("Gagal muat data rank:", err);
    }
}

// ============================================================
// RANK: Podium
// ============================================================
function updatePodium() {
    if (masterRank.length === 0) {
        [1,2,3].forEach(n => {
            const card = document.getElementById(`rank${n}`);
            if (card) {
                card.querySelector('.rank-id').innerText = "--";
                card.querySelector('.rank-score').innerText = "--";
            }
        });
        return;
    }

    const sorted = getSortedRank();
    [0, 1, 2].forEach(index => {
        const data = sorted[index];
        const card = document.getElementById(`rank${index + 1}`);
        if (card && data) {
            const idSpan    = card.querySelector('.rank-id');
            const scoreSpan = card.querySelector('.rank-score');
            idSpan.innerText    = "ID: " + data.id;
            scoreSpan.innerText = data[currentRankCat] + " Unit";
            idSpan.style.display    = isShowScore ? 'none'  : 'block';
            scoreSpan.style.display = isShowScore ? 'block' : 'none';
        }
    });
}

function getSortedRank() {
    const sorted = [...masterRank].sort((a, b) => b[currentRankCat] - a[currentRankCat]);
    return currentBoardMode === 'bottomboard' ? sorted.reverse() : sorted;
}

// ============================================================
// RANK: List 10 besar/terbawah
// ============================================================
function renderRankList() {
    const container = document.getElementById('rankList');
    if (!container) return;

    if (masterRank.length === 0) {
        container.innerHTML = "<p style='text-align:center; padding:20px; color:#888;'>Belum ada data untuk periode ini.</p>";
        return;
    }

    const sorted = getSortedRank().slice(0, 10);
    const catLabels = {
        totalUnit: "Total", ac: "AC", cctv: "CCTV", kulkas: "Kulkas", tv: "TV",
        mesinCuci: "MC", airCooler: "Air Cooler", freezer: "Freezer",
        speaker: "Speaker", waterHeater: "Water Heater", dispenser: "Dispenser"
    };

    container.innerHTML = sorted.map((item, i) => `
        <div class="rank-row" onclick="toggleDetail('det-${i}')">
            <div class="rank-number">${currentBoardMode === 'bottomboard' ? '↓' : '#'}${i + 1}</div>
            <div style="flex:1; margin-left:10px;">
                <strong>ID: ${item.id}</strong>
                <div style="font-size:0.75rem; color:#94a3b8;">${item.gudang || ""}</div>
                <div id="det-${i}" class="detail-box">
                    AC: ${item.ac} | CCTV: ${item.cctv} | Kulkas: ${item.kulkas} | TV: ${item.tv} |
                    MC: ${item.mesinCuci} | Air Cooler: ${item.airCooler} | Freezer: ${item.freezer} |
                    Speaker: ${item.speaker} | Water Heater: ${item.waterHeater} | Dispenser: ${item.dispenser}
                </div>
            </div>
            <div style="font-weight:bold;">${item[currentRankCat]} Unit</div>
        </div>`).join('');
}

function toggleDetail(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = (el.style.display === 'block') ? 'none' : 'block';
}

function setRankCategory(cat, btn) {
    currentRankCat = cat;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    updatePodium();
    renderRankList();
}

// ============================================================
// RANK: Scroll kategori dengan tombol panah
// ============================================================
function scrollCatLeft() {
    const el = document.getElementById("rankCatScroll");
    if (el) el.scrollBy({ left: -120, behavior: 'smooth' });
}
function scrollCatRight() {
    const el = document.getElementById("rankCatScroll");
    if (el) el.scrollBy({ left: 120, behavior: 'smooth' });
}

// ============================================================
// RANK: Board mode toggle (Leaderboard / Bottom Board)
// ============================================================
function toggleBoardMenu() {
    const menu = document.getElementById("boardDropdownMenu");
    menu.style.display = (menu.style.display === "none") ? "block" : "none";
}
function closeBoardMenu() {
    const menu = document.getElementById("boardDropdownMenu");
    if (menu) menu.style.display = "none";
}
function setBoardMode(mode) {
    currentBoardMode = mode;
    const title = document.getElementById("boardToggleTitle");
    title.innerText = mode === 'leaderboard' ? 'Leaderboard' : 'Bottom Board';
    closeBoardMenu();
    updatePodium();
    renderRankList();
}

// Tutup menu board jika klik di luar
document.addEventListener("click", function(e) {
    const wrapper = document.querySelector(".board-toggle-wrapper");
    if (wrapper && !wrapper.contains(e.target)) closeBoardMenu();
});

// ============================================================
// AUTH: Toggle mode tampilan login/signup/reset
// ============================================================
function toggleAuthMode(mode) {
    document.getElementById('loginView').style.display  = mode === 'login'  ? 'block' : 'none';
    document.getElementById('signupView').style.display = mode === 'signup' ? 'block' : 'none';
    document.getElementById('resetView').style.display  = mode === 'reset'  ? 'block' : 'none';
}

// ============================================================
// AUTH: Login
// ============================================================
async function handleLogin() {
    const user = document.getElementById('loginId').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    if (!user || !pass) return alert("Isi ID dan Password!");

    const btn = document.getElementById("btnLogin");
    const spinner = btn?.querySelector(".loading-icon");
    if (spinner) spinner.style.display = "inline-block";
    if (btn) btn.disabled = true;

    try {
        const res = await fetch(WEB_URL, {
            method: "POST",
            body: JSON.stringify({ action: "login", userId: user, password: pass })
        }).then(r => r.json());

        if (res.status === "success") {
            loginFailCount = 0;
            document.getElementById('forgotPassPrompt').style.display = 'none';
            showProfile(res.data);
        } else {
            loginFailCount++;
            if (loginFailCount >= 1) {
                document.getElementById('forgotPassPrompt').style.display = 'block';
            }
            alert(res.message);
        }
    } catch (error) {
        alert("Koneksi gagal. Periksa jaringan kamu.");
    } finally {
        if (spinner) spinner.style.display = "none";
        if (btn) btn.disabled = false;
    }
}

// ============================================================
// AUTH: Signup
// ============================================================
async function handleSignup() {
    const idS  = document.getElementById('regIdStaff').value.trim();
    const idE  = document.getElementById('regIdErajaya').value.trim();
    const pass = document.getElementById('regPass').value.trim();
    if (!idS || !idE || !pass) return alert("Semua kolom harus diisi!");

    const btn = document.getElementById("btnSignup");
    const spinner = btn?.querySelector(".loading-icon");
    if (spinner) spinner.style.display = "inline-block";
    if (btn) btn.disabled = true;

    try {
        const res = await fetch(WEB_URL, {
            method: "POST",
            body: JSON.stringify({ action: "signup", idStaff: idS, idErajaya: idE, password: pass })
        }).then(r => r.json());

        alert((res.status === "success" ? "✅ " : "❌ ") + res.message);
        if (res.status === "success") {
            document.getElementById('regIdStaff').value = '';
            document.getElementById('regIdErajaya').value = '';
            document.getElementById('regPass').value = '';
            toggleAuthMode('login');
        }
    } catch (error) {
        alert("Koneksi gagal. Coba lagi.");
    } finally {
        if (spinner) spinner.style.display = "none";
        if (btn) btn.disabled = false;
    }
}

// ============================================================
// AUTH: Reset Password
// ============================================================
async function handleResetPassword() {
    const idS  = document.getElementById('resetIdStaff').value.trim();
    const idE  = document.getElementById('resetIdErajaya').value.trim();
    const pass = document.getElementById('resetPass').value.trim();
    if (!idS || !idE || !pass) return alert("Semua kolom harus diisi!");

    const btn = document.getElementById("btnReset");
    const spinner = btn?.querySelector(".loading-icon");
    if (spinner) spinner.style.display = "inline-block";
    if (btn) btn.disabled = true;

    try {
        const res = await fetch(WEB_URL, {
            method: "POST",
            body: JSON.stringify({ action: "resetPassword", idStaff: idS, idErajaya: idE, password: pass })
        }).then(r => r.json());

        alert((res.status === "success" ? "✅ " : "❌ ") + res.message);
        if (res.status === "success") {
            document.getElementById('resetIdStaff').value = '';
            document.getElementById('resetIdErajaya').value = '';
            document.getElementById('resetPass').value = '';
            toggleAuthMode('login');
        }
    } catch (error) {
        alert("Koneksi gagal. Coba lagi.");
    } finally {
        if (spinner) spinner.style.display = "none";
        if (btn) btn.disabled = false;
    }
}

// ============================================================
// AUTH: Tampilkan Profil setelah login berhasil
// ============================================================
function showProfile(data) {
    document.getElementById('loginView').style.display   = 'none';
    document.getElementById('signupView').style.display  = 'none';
    document.getElementById('resetView').style.display   = 'none';
    document.getElementById('profileView').style.display = 'block';

    document.getElementById('profName').innerText     = data.name;
    document.getElementById('profIdStaff').innerText  = data.idStaff;
    document.getElementById('profIdEra').innerText    = data.idErajaya;
    document.getElementById('profPosition').innerText = data.position || "-";
    document.getElementById('profGudang').innerText   = data.gudang;

    loggedInUserStaffId = data.idStaff;
    cekStatusAksesFormKomentarVideo();

    // Crisp
    if (typeof $crisp !== 'undefined') {
        $crisp.push(["set", "user:nickname", [data.name]]);
        $crisp.push(["set", "user:email", [data.idStaff + "@erablue.id"]]);
        $crisp.push(["set", "session:data", [[
            ["ID_Staff", data.idStaff],
            ["Position", data.position],
            ["Gudang", data.gudang],
            ["ID_Erajaya", data.idErajaya]
        ]]]);
        const btnChat = document.getElementById('btnChatAdmin');
        if (btnChat) btnChat.style.display = 'block';
    }

    // ---- Sertifikat ----
    const certBox     = document.getElementById('certList');
    const certSection = document.getElementById('certSection');
    certBox.innerHTML = "";
    const certAda = (data.certs || []).filter(c => c.link && c.link.startsWith("http"));
    if (certAda.length > 0) {
        certSection.style.display = "block";
        certAda.forEach(c => {
            certBox.innerHTML += `<a href="${c.link}" class="cert-link" target="_blank">${c.nama} <i class="fa-solid fa-circle-check" style="float:right;"></i></a>`;
        });
    } else {
        certSection.style.display = "none";
    }

    // ---- Kuesioner ----
    const kuesSection = document.getElementById('kuesionerSection');
    const kuesList    = document.getElementById('kuesionerList');
    kuesList.innerHTML = "";
    const kuesBelum = (data.kuesioner || []).filter(k => !k.sudahDikerjakan && k.nama);
    if (kuesBelum.length > 0) {
        kuesSection.style.display = "block";
        kuesBelum.forEach(k => {
            kuesList.innerHTML += `
                <div class="kuesioner-item">
                    <p class="kuesioner-warning">KAMU BELUM MENGERJAKAN <strong>"${k.nama}"</strong></p>
                    ${k.link ? `<a href="${k.link}" target="_blank" class="kuesioner-link"><i class="fa-solid fa-pen-to-square"></i> Kerjakan Sekarang</a>` : ""}
                </div>`;
        });
    } else {
        kuesSection.style.display = "none";
    }

    // ---- Peringatan ----
    const peringSection = document.getElementById('peringatanSection');
    const peringList    = document.getElementById('peringatanList');
    peringList.innerHTML = "";
    const peringAda = (data.peringatan || []).filter(p => p && p.startsWith("http"));
    if (peringAda.length > 0) {
        peringSection.style.display = "block";
        peringAda.forEach((link, idx) => {
            const isImage = /\.(jpg|jpeg|png|webp|gif)/i.test(link) || link.includes("drive.google.com");
            // Konversi link Drive ke embed jika perlu
            const embedLink = convertDriveLinkToEmbed(link);
            const isImg     = /\.(jpg|jpeg|png|webp|gif)/i.test(link);
            peringList.innerHTML += `
                <div class="peringatan-item">
                    <p class="peringatan-label">⚠️ PERINGATAN PELANGGARAN ${peringAda.length > 1 ? (idx+1) : ""}</p>
                    ${isImg
                        ? `<img src="${link}" class="peringatan-media" alt="Bukti peringatan" loading="lazy">`
                        : `<iframe src="${embedLink}" class="peringatan-pdf" frameborder="0" allowfullscreen></iframe>`
                    }
                    <a href="${link}" target="_blank" class="peringatan-link-btn"><i class="fa-solid fa-arrow-up-right-from-square"></i> Buka File</a>
                </div>`;
        });
    } else {
        peringSection.style.display = "none";
    }
}

// Helper: konversi Google Drive link biasa ke embed URL
function convertDriveLinkToEmbed(url) {
    // Format: https://drive.google.com/file/d/FILE_ID/view
    // Target: https://drive.google.com/file/d/FILE_ID/preview
    const match = url.match(/\/file\/d\/([^/]+)\//);
    if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
    // Format: https://drive.google.com/open?id=FILE_ID
    const match2 = url.match(/[?&]id=([^&]+)/);
    if (match2) return `https://drive.google.com/file/d/${match2[1]}/preview`;
    return url;
}

// ============================================================
// AUTH: Logout
// ============================================================
function logout() {
    document.getElementById('profileView').style.display = 'none';
    document.getElementById('loginView').style.display   = 'block';
    document.getElementById('signupView').style.display  = 'none';
    document.getElementById('resetView').style.display   = 'none';

    loginFailCount = 0;
    document.getElementById('forgotPassPrompt').style.display = 'none';
    loggedInUserStaffId = "";
    cekStatusAksesFormKomentarVideo();

    if (typeof $crisp !== 'undefined') {
        $crisp.push(["do", "session:reset"]);
        $crisp.push(["do", "chat:hide"]);
        const btnChat = document.getElementById('btnChatAdmin');
        if (btnChat) btnChat.style.display = 'none';
    }
}

// ============================================================
// CRISP: Buka chat admin
// ============================================================
function bukaChatAdmin() {
    if (typeof $crisp !== 'undefined') {
        const btn = document.getElementById("btnChatAdmin");
        const spinner     = btn?.querySelector(".loading-icon");
        const defaultIcon = btn?.querySelector(".icon-default");
        if (spinner)     spinner.style.display     = "inline-block";
        if (defaultIcon) defaultIcon.style.display = "none";
        if (btn) btn.disabled = true;

        $crisp.push(['do', 'chat:show']);
        $crisp.push(['do', 'chat:open']);

        setTimeout(() => {
            if (spinner)     spinner.style.display     = "none";
            if (defaultIcon) defaultIcon.style.display = "inline-block";
            if (btn) btn.disabled = false;
        }, 1500);
    }
}

// ============================================================
// MODAL K3
// ============================================================
function showK3Modal(t, d, i) {
    document.getElementById('k3Modal').style.display = 'flex';
    document.getElementById('modalTitle').innerText  = t;
    document.getElementById('modalDesc').innerText   = d;
    document.getElementById('modalImg').src          = i;
}
function tutupK3Modal() { document.getElementById('k3Modal').style.display = 'none'; }

// ============================================================
// TOGGLE CARD (home)
// ============================================================
function toggleCard(id) {
    const x = document.getElementById(id);
    x.style.display = (x.style.display === "none") ? "block" : "none";
}
