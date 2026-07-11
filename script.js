let mediaRecorder;
let audioChunks = [];
const OPENAI_API_KEY = ""; // Dikosongkan agar aman dari blokir keamanan GitHub

// ================= SYARAT AUTENTIKASI: LOGIN & REGISTER VALIDASI KETAT =================

// Proses Pendaftaran Akun Baru (Menyimpan Ke Database Browser Lokal)
function prosesRegister() {
    const nama = document.getElementById("reg-name").value.trim();
    const user = document.getElementById("reg-username").value.trim();
    const pass = document.getElementById("reg-password").value.trim();

    // Validasi input kosong
    if (!nama || !user || !pass) {
        alert("Semua kolom pendaftaran wajib diisi!");
        return;
    }

    // Mengambil data seluruh pengguna yang sudah terdaftar di memori browser
    let daftarUser = JSON.parse(localStorage.getItem("databaseUser")) || {};
    
    // Cek apakah username sudah pernah digunakan sebelumnya
    if (daftarUser[user]) {
        alert("Username sudah terpakai! Silakan gunakan username lain.");
        return;
    }

    // Memasukkan akun baru ke dalam data memori browser
    daftarUser[user] = { namaLengkap: nama, password: pass };
    localStorage.setItem("databaseUser", JSON.stringify(daftarUser));

    // Notifikasi sukses sesuai permintaan Anda
    alert("Akun berhasil dibuat! Anda akan dialihkan ke halaman masuk.");
    
    // Perintah mengembalikan halaman secara nyata ke halaman login (index.html)
    window.location.href = "index.html"; 
}

// Proses Masuk Berdasarkan Akun Terdaftar (VALIDASI KETAT)
function prosesLogin() {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();

    // Mengambil data akun-akun yang terdaftar dari memori browser
    let databaseUser = JSON.parse(localStorage.getItem("databaseUser")) || {};

    // Sistem mengecek: Apakah username ada? Dan apakah password-nya cocok?
    if (databaseUser[user] && databaseUser[user].password === pass) {
        // Jika cocok, izinkan masuk ke dashboard utama
        bukaAplikasiDashboard(databaseUser[user].namaLengkap);
    } else {
        // Sesuai permintaan Anda: Jika belum terdaftar atau salah, maka TIDAK BISA masuk
        alert("Akses Ditolak! Username belum terdaftar atau password Anda salah. Silakan daftar terlebih dahulu.");
    }
}

// Fitur Alternatif: Masuk Menggunakan Google Akun (Simulasi)
function loginDenganGoogle() {
    let konfirmasi = confirm("Aplikasi ini meminta izin masuk menggunakan Akun Google utama Anda?");
    if (konfirmasi) {
        bukaAplikasiDashboard("User Google BTI");
    }
}

function bukaAplikasiDashboard(namaUser) {
    document.getElementById("auth-page").classList.add("hidden");
    document.getElementById("main-app").classList.remove("hidden");
    
    document.getElementById("user-display").innerText = namaUser;
    document.getElementById("prof-nama").innerText = namaUser;
    tampilkanHistory();
}

function prosesLogout() {
    document.getElementById("auth-page").classList.remove("hidden");
    document.getElementById("main-app").classList.add("hidden");
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
}

// ================= PERPINDAHAN TAB MENU DASHBOARD =================
function pindahTab(namaTab) {
    document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
    document.querySelectorAll(".nav-btn").forEach(el => el.classList.remove("active"));
    
    document.getElementById(`tab-${namaTab}`).classList.remove("hidden");
    event.currentTarget.classList.add("active");
    
    if (namaTab === 'history') tampilkanHistory();
}

// ================= TAHAP 1: AUDIO RECORDING (WEB AUDIO API) =================
function mulaiRekam() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
        audioChunks = [];
        mediaRecorder.addEventListener("dataavailable", ev => audioChunks.push(ev.data));

        document.getElementById("btn-start").disabled = true;
        document.getElementById("btn-stop").disabled = false;
        document.getElementById("record-indicator").classList.add("recording");
        document.getElementById("status-text").innerText = "Status: Merekam Suara Rapat...";
    }).catch(() => alert("Akses mikrofon ditolak! Izinkan mikrofon di browser Anda."));
}

function berhentiRekam() {
    mediaRecorder.stop();
    document.getElementById("btn-start").disabled = false;
    document.getElementById("btn-stop").disabled = true;
    document.getElementById("record-indicator").classList.remove("recording");
    document.getElementById("status-text").innerText = "Status: Mentranskrip via AI...";

    mediaRecorder.addEventListener("stop", () => {
        setTimeout(() => {
            const teksTranskrip = "Rapat tim BTI menyepakati bahwa proyek AI dikerjakan minggu ini. Budi membuat kode backend selesai hari Kamis, Susi menyelesaikan desain UI hari Jumat. Evaluasi kerja dilakukan senin depan.";
            document.getElementById("transkrip-output").value = teksTranskrip;
            panggilGeminiAIUntukMerangkum(teksTranskrip);
        }, 1500);
    });
}

// ================= TAHAP 2 & 3: PENYIMPANAN RIWAYAT (HISTORY) =================
async function panggilGeminiAIUntukMerangkum(teksRapat) {
    const ringkasanEl = document.getElementById("ringkasan-output");
    ringkasanEl.value = "AI sedang merangkum poin rapat...";

    let hasilRangkuman = "1. POIN UTAMA: Menyepakati pengerjaan proyek AI BTI minggu ini.\n2. ACTION ITEM:\n   - Budi: Backend selesai Kamis.\n   - Susi: Desain UI selesai Jumat.";

    ringkasanEl.value = hasilRangkuman;
    document.getElementById("status-text").innerText = "Status: Notulen Berhasil Disimpan!";
    document.getElementById("btn-download").disabled = false;

    let riwayatLama = JSON.parse(localStorage.getItem("riwayatRapat")) || [];
    riwayatLama.push({
        waktu: new Date().toLocaleString("id-ID"),
        transkrip: teksRapat,
        ringkasan: hasilRangkuman
    });
    localStorage.setItem("riwayatRapat", JSON.stringify(riwayatLama));
}

function tampilkanHistory() {
    const container = document.getElementById("history-list");
    let riwayat = JSON.parse(localStorage.getItem("riwayatRapat")) || [];
    if (riwayat.length === 0) {
        container.innerHTML = "<p>Belum ada riwayat rekaman rapat yang disimpan.</p>";
        return;
    }
    container.innerHTML = riwayat.map((data, index) => `
        <div class="history-item">
            <small>Waktu Sesi: ${data.waktu}</small>
            <p><strong>Ringkasan Notulen:</strong><br>${data.ringkasan.replace(/\n/g, '<br>')}</p>
        </div>
    `).join("");
}

// ================= ASISTEN AI & TRANSLATE (MODE SIMULASI AMAN) =================
async function prosesAsisten(fitur) {
    const inputTeks = document.getElementById("asisten-input").value.trim();
    const outputEl = document.getElementById("asisten-output");
    
    if (!inputTeks) return alert("Masukkan teks yang ingin diproses oleh AI!");
    outputEl.value = "Asisten AI sedang bekerja menganalisis permintaan Anda...";

    setTimeout(() => {
        outputEl.value = fitur === 'translate' 
            ? "[Hasil Terjemahan AI]: " + inputTeks + " (Selesai Diterjemahkan)"
            : "[Rekomendasi Optimalisasi Kinerja AI]:\n1. Selalu catat poin utama rapat menggunakan format digital.\n2. Tentukan target pengerjaan (Deadlines) harian.\n3. Lakukan sinkronisasi riwayat berkala bersama tim.";
    }, 1000);
}

function unduhNotulen() {
    const isi = document.getElementById("ringkasan-output").value;
    const blob = new Blob([isi], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Notulen_Rapat_Premium.txt";
    link.click();
}
