const LIB_URL = "https://script.google.com/macros/s/AKfycbyijPTnQTlQXY4PuDdn6Ij8w0KSyTZB12iyybY0cRqZDF2mO-iRNPUQLfHPy0--f_I3Jg/exec";
const HELPER_URL = "https://script.google.com/macros/s/AKfycbyKDmQeViTbhVTu9PZX5XuaIvCbAv5lzurD2GWJOBvazwbCeWbhgQZauZh7yaCOyniE/exec";
const RANK_URL = "https://script.google.com/macros/s/AKfycbxIMWqxX8U9yrgB-YPYToonzsL1e-lW_j51ypP1l_VLEc-wCRqOehCGXUlSrQ5LxcuV/exec";
const USER_URL = "https://script.google.com/macros/s/AKfycbzq-gyy4pSAWRQKbuEjEoocfROTTrEHVE2fD-E4AHiyAHoSgEUkoB5Do3onDPIMYn54/exec";

// URL Web App Google Apps Script Baru untuk Video & Komentar
const VIDEO_URL = "https://script.google.com/macros/s/AKfycbxUmCE6ns828goR8dq7TaegPZPp46Y0HfePCxcAs1CTYTTvSe-z13hG-ALoVjNIaTM_/exec";

let masterLib = [], masterHelper = [], masterRank = [];
let currentRankCat = 'totalUnit';
let isShowScore = false;

// Variabel Master Data untuk Fitur Video dan Komentar
let masterVideos = [];
let masterComments = [];
let currentActiveVideoId = ""; // Menyimpan ID video yang sedang diputar di atas
let loggedInUserStaffId = "";  // Menyimpan ID staff untuk keperluan kirim komentar

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
        
        // Panggil penarikan data video & komentar secara otomatis di awal
        await muatDataVideoDanKomentar();
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
    // --- FITUR ANIMASI LOADING (START) ---
    const btn = document.getElementById("btnCariError");
    let spinner = null;
    if (btn) {
        spinner = btn.querySelector(".loading-icon");
        if (spinner) spinner.style.display = "inline-block";
        btn.disabled = true;
    }

    // Menggunakan setTimeout agar browser sempat merender animasi loading sebelum eksekusi filter yang berat
    setTimeout(() => {
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
            // --- FITUR ANIMASI LOADING (STOP) ---
            if (btn) {
                if (spinner) spinner.style.display = "none";
                btn.disabled = false;
            }
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

        // --- FITUR ANIMASI LOADING (STOP) ---
        if (btn) {
            if (spinner) spinner.style.display = "none";
            btn.disabled = false;
        }
    }, 50);
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
    // --- FITUR ANIMASI LOADING (START) ---
    const btn = document.getElementById("btnCariLibrary");
    let spinner = null;
    if (btn) {
        spinner = btn.querySelector(".loading-icon");
        if (spinner) spinner.style.display = "inline-block";
        btn.disabled = true;
    }

    setTimeout(() => {
        const kat = document.getElementById("libCategory").value;
        const cari = document.getElementById("libSearch").value.toLowerCase().trim();
        const filtered = masterLib.filter(item => {
            const matchKat = kat === "" || item.kategori.toUpperCase() === kat.toUpperCase();
            const matchCari = item.kataKunci.includes(cari) || item.merk.toLowerCase().includes(cari) || item.seri.toLowerCase().includes(cari);
            return matchKat && matchCari;
        });

        document.getElementById("libResult").innerHTML = filtered.map(item => {
            const hasPPT = item.linkPPT && item.linkPPT !== "-";
            const hasBook = item.linkBook && item.linkBook !== "-";

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

        // --- FITUR ANIMASI LOADING (STOP) ---
        if (btn) {
            if (spinner) spinner.style.display = "none";
            btn.disabled = false;
        }
    }, 50);
}

function toggleCard(id) {
    const x = document.getElementById(id);
    x.style.display = (x.style.display === "none") ? "block" : "none";
}

// =========================================================================
// FITUR BARU: LOGIKA INTEGRASI TAB VIDEO DAN DAFTAR KOMENTAR SPREADSHEET
// =========================================================================

async function muatDataVideoDanKomentar() {
    try {
        const res = await fetch(`${VIDEO_URL}?action=readVideoData`).then(r => r.json());
        masterVideos = res.videos || [];
        masterComments = res.comments || [];

        if (masterVideos.length > 0) {
            // Jika belum ada video aktif yang dipilih teknisi, setel video pertama sebagai Video Utama
            if (!currentActiveVideoId) {
                setVideoUtama(masterVideos[0].idVideo);
            } else {
                // Jika sudah ada, segarkan saja list dan komentarnya
                renderListPilihanVideo(masterVideos);
                renderKomentarVideo(currentActiveVideoId);
            }
        } else {
            document.getElementById("mainVideoTitle").innerText = "Belum ada video tersedia.";
        }
        
        // MEMPERBAIKI REVISI 1: Jalankan pengecekan status form agar tulisan pemberitahuan/form langsung menyesuaikan saat data dimuat
        cekStatusAksesFormKomentarVideo();
    } catch (err) {
        console.error("Gagal memuat data video & komentar:", err);
    }
}

function setVideoUtama(idVideo) {
    currentActiveVideoId = idVideo;
    const videoData = masterVideos.find(v => v.idVideo === idVideo);
    if (!videoData) return;

    // Ubah URL Iframe Player ke Link Embed Youtube
    const player = document.getElementById("mainYoutubePlayer");
    player.src = `https://www.youtube.com/embed/${idVideo}`;

    // Set Judul dan Deskripsi
    document.getElementById("mainVideoTitle").innerText = videoData.judul;
    document.getElementById("mainVideoDesc").innerText = videoData.keterangan || "Tidak ada keterangan.";

    // Render ulang daftar video pilihan (agar video yang aktif ter-filter/ter-styling jika perlu)
    renderListPilihanVideo(masterVideos);
    
    // Render komentar khusus milik video utama saat ini
    renderKomentarVideo(idVideo);
}

function renderListPilihanVideo(listVideo) {
    const container = document.getElementById("videoListContainer");
    if (!container) return;

    // Filter agar video utama yang sedang diputar tidak muncul ganda di list bawah
    const sisaVideo = listVideo.filter(v => v.idVideo !== currentActiveVideoId);

    if (sisaVideo.length === 0) {
        container.innerHTML = "<p style='grid-column: 1/-1; text-align:center; color:#888; padding:10px;'>Tidak ada pilihan video lainnya.</p>";
        return;
    }

    container.innerHTML = sisaVideo.map(v => `
        <div class="video-card-item" onclick="setVideoUtama('${v.idVideo}')">
            <div class="video-thumbnail-box">
                <img src="https://img.youtube.com/vi/${v.idVideo}/mqdefault.jpg" alt="${v.judul}" loading="lazy">
                <span class="video-badge-tag">${v.kategori}</span>
            </div>
            <div class="video-card-info">
                <h4>${v.judul}</h4>
            </div>
        </div>
    `).join('');
}

function filterDaftarVideo() {
    const filterKategori = document.getElementById("videoCategorySelect").value.toUpperCase();
    const cariJudul = document.getElementById("videoSearchInput").value.toLowerCase().trim();

    const hasilFilter = masterVideos.filter(v => {
        const cocokKategori = filterKategori === "" || v.kategori.toUpperCase() === filterKategori;
        const cocokJudul = v.judul.toLowerCase().includes(cariJudul) || (v.keterangan && v.keterangan.toLowerCase().includes(cariJudul));
        return cocokKategori && cocokJudul;
    });

    renderListPilihanVideo(hasilFilter);
}

function renderKomentarVideo(idVideo) {
    const container = document.getElementById("videoCommentsList");
    const countLabel = document.getElementById("commentCount");
    if (!container) return;

    // Filter komentar hanya untuk ID video tertentu
    const komentarVideoIni = masterComments.filter(c => String(c.idVideo) === String(idVideo));
    if (countLabel) countLabel.innerText = komentarVideoIni.length;

    if (komentarVideoIni.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#888; padding:20px 0;'>Belum ada komentar untuk video ini. Jadilah yang pertama berdiskusi!</p>";
        return;
    }

    // Susun komentar terbalik (komentar terbaru paling atas)
    const komentarUrut = [...komentarVideoIni].reverse();

    container.innerHTML = komentarUrut.map(c => `
        <div class="comment-item-row">
            <div class="comment-meta-user">
                <span class="comment-user-id"><i class="fa-solid fa-user-gear"></i> ID Staff: ${c.idStaff}</span>
                <span class="comment-date-time">${c.tanggal}</span>
            </div>
            <p class="comment-text-content">${c.komentar}</p>
        </div>
    `).join('');
}

async function kirimKomentarTeknisi() {
    const isiKomentar = document.getElementById("inputIsiKomentar").value.trim();
    if (!isiKomentar) return alert("Silakan ketik isi komentar terlebih dahulu!");

    if (!loggedInUserStaffId) {
        return alert("Sesi login tidak terdeteksi. Silakan login kembali di tab User.");
    }

    const btn = document.getElementById("btnKirimKomentar");
    let spinner = null;
    if (btn) {
        spinner = btn.querySelector(".loading-icon");
        if (spinner) spinner.style.display = "inline-block";
        btn.disabled = true;
    }

    try {
        const dataPayload = {
            idVideo: currentActiveVideoId,
            idStaff: loggedInUserStaffId,
            komentar: isiKomentar
        };

        const res = await fetch(VIDEO_URL, {
            method: "POST",
            body: JSON.stringify(dataPayload)
        }).then(r => r.json());

        if (res.status === "SUCCESS") {
            document.getElementById("inputIsiKomentar").value = ""; // Kosongkan kolom input
            // Refresh database lokal dan perbarui visual komentar
            await muatDataVideoDanKomentar();
        } else {
            alert("Gagal mengirim komentar: " + res.message);
        }
    } catch (err) {
        console.error("Terjadi error saat mengirim komentar:", err);
        alert("Koneksi gagal saat mengirim komentar.");
    } finally {
        if (btn) {
            if (spinner) spinner.style.display = "none";
            btn.disabled = false;
        }
    }
}

function cekStatusAksesFormKomentarVideo() {
    const formBox = document.getElementById("videoCommentForm");
    const noticeBox = document.getElementById("videoCommentLoginNotice");
    
    if (loggedInUserStaffId) {
        // Jika sudah login, tampilkan form buat komentar, sembunyikan peringatan login
        if (formBox) formBox.style.display = "block";
        if (noticeBox) noticeBox.style.display = "none";
    } else {
        // Jika belum login, sembunyikan form buat komentar, tampilkan peringatan login
        if (formBox) formBox.style.display = "none";
        if (noticeBox) noticeBox.style.display = "block";
    }

    // MEMPERBAIKI REVISI 1: Memastikan daftar komentar lama tetap diringkas/ditampilkan ke semua orang baik sebelum atau sesudah login
    if (currentActiveVideoId) {
        renderKomentarVideo(currentActiveVideoId);
    }
}

// ==========================================
// SELESAI FITUR BARU TAB VIDEO
// ==========================================

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

    // --- FITUR ANIMASI LOADING (START) ---
    const btn = document.getElementById("btnLogin");
    let spinner = null;
    if (btn) {
        spinner = btn.querySelector(".loading-icon");
        if (spinner) spinner.style.display = "inline-block";
        btn.disabled = true;
    }

    try {
        const res = await fetch(USER_URL, {
            method: "POST",
            body: JSON.stringify({ action: "login", userId: user, password: pass })
        }).then(r => r.json());
        if(res.status === "success") { showProfile(res.data); } else { alert(res.message); }
    } catch (error) {
        console.error(error);
    } finally {
        // --- FITUR ANIMASI LOADING (STOP) ---
        if (btn) {
            if (spinner) spinner.style.display = "none";
            btn.disabled = false;
        }
    }
}

function showProfile(data) {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('signupView').style.display = 'none';
    document.getElementById('profileView').style.display = 'block';
    document.getElementById('profName').innerText = data.name;
    document.getElementById('profIdStaff').innerText = data.idStaff;
    document.getElementById('profIdEra').innerText = data.idErajaya;
    document.getElementById('profGudang').innerText = data.gudang;

    // Simpan ID Staff yang sukses login ke variabel global pendukung komentar video
    loggedInUserStaffId = data.idStaff;
    cekStatusAksesFormKomentarVideo(); // Update status form komentar video

    // --- INTEGRASI CRISP: Kirim data teknisi ke admin ---
    if (typeof $crisp !== 'undefined') {
        $crisp.push(["set", "user:nickname", [data.name]]);
        $crisp.push(["set", "user:email", [data.idStaff + "@erablue.id"]]);
        $crisp.push(["set", "session:data", [[
            ["ID_Staff", data.idStaff],
            ["Gudang", data.gudang],
            ["ID_Erajaya", data.idErajaya]
        ]]]);
        
        // Tampilkan tombol chat admin yang ada di HTML
        const btnChat = document.getElementById('btnChatAdmin');
        if(btnChat) btnChat.style.display = 'block';
    }

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

    // Kosongkan sesi login lokal pendukung komentar video saat logout
    loggedInUserStaffId = "";
    cekStatusAksesFormKomentarVideo(); // Update status form komentar video (kembali tersembunyi)

    // --- INTEGRASI CRISP: Reset sesi dan sembunyikan tombol chat ---
    if (typeof $crisp !== 'undefined') {
        $crisp.push(["do", "session:reset"]);
        $crisp.push(["do", "chat:hide"]);
        const btnChat = document.getElementById('btnChatAdmin');
        if(btnChat) btnChat.style.display = 'none';
    }
}

// Fungsi pendukung untuk tombol Chat Admin Kantor
function bukaChatAdmin() {
    if (typeof $crisp !== 'undefined') {
        // --- FITUR ANIMASI LOADING (START) ---
        const btn = document.getElementById("btnChatAdmin");
        let spinner = null;
        let defaultIcon = null;
        if (btn) {
            spinner = btn.querySelector(".loading-icon");
            defaultIcon = btn.querySelector(".icon-default");
            if (spinner) spinner.style.display = "inline-block";
            if (defaultIcon) defaultIcon.style.display = "none";
            btn.disabled = true;
        }

        $crisp.push(['do', 'chat:show']);
        $crisp.push(['do', 'chat:open']);

        // Sembunyikan kembali loading setelah 1.5 detik karena Crisp chat langsung terbuka
        setTimeout(() => {
            if (btn) {
                if (spinner) spinner.style.display = "none";
                if (defaultIcon) defaultIcon.style.display = "inline-block";
                btn.disabled = false;
            }
        }, 1500);
    }
}