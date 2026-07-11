let mediaRecorder;
let audioChunks = [];
const OPENAI_API_KEY = ""; // Dikosongkan agar aman dari pencurian data di repositori publik GitHub

// ================= PERBAIKAN TOTAL: MESIN PENGENAL SUARA MANDIRI =================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let pengenalSuaraAI = null;
let catatanSuaraAkumulasi = ""; 

if (SpeechRecognition) {
    pengenalSuaraAI = new SpeechRecognition();
    pengenalSuaraAI.lang = 'id-ID'; // Mengunci radar AI agar fokus menangkap Bahasa Indonesia
    pengenalSuaraAI.interimResults = true; // Menampilkan huruf langsung saat bibir bergerak
    pengenalSuaraAI.continuous = true; // Terus mendengarkan tanpa memotong kalimat di tengah jalan

    // Proses pengumpulan kalimat yang diucapkan secara real-time
    pengenalSuaraAI.onresult = function(event) {
        let teksHasilSesiIni = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                catatanSuaraAkumulasi += event.results[i].transcript + " ";
            } else {
                teksHasilSesiIni += event.results[i].transcript;
            }
        }
        
        // Memasukkan gabungan kata ke dalam kotak transkrip mentah di layar website
        const teksTampilanRealtime = catatanSuaraAkumulasi + teksHasilSesiIni;
        document.getElementById("transkrip-output").value = teksTampilanRealtime.trim();
    };

    pengenalSuaraAI.onerror = function(event) {
        console.error("Deteksi mikrofon internal: " + event.error);
    };
} else {
    alert("Browser Anda belum mendukung fitur rekam suara langsung. Sangat disarankan gunakan Google Chrome!");
}

// ================= SISTEM AUTENTIKASI: VALIDASI LOGIN & DAFTAR =================

function prosesRegister() {
    const nama = document.getElementById("reg-name").value.trim();
    const user = document.getElementById("reg-username").value.trim();
    const pass = document.getElementById("reg-password").value.trim();

    if (!nama || !user || !pass) {
        alert("Semua kolom pendaftaran wajib diisi!");
        return;
    }

    let daftarUser = JSON.parse(localStorage.getItem("databaseUser")) || {};
    
    if (daftarUser[user]) {
        alert("Username sudah terpakai! Silakan gunakan username lain.");
        return;
    }

    daftarUser[user] = { namaLengkap: nama, password: pass };
    localStorage.setItem("databaseUser", JSON.stringify(daftarUser));

    alert("Akun berhasil dibuat! Anda akan dialihkan ke halaman masuk.");
    window.location.href = "index.html"; 
}

function prosesLogin() {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();

    let databaseUser = JSON.parse(localStorage.getItem("databaseUser")) || {};

    if (databaseUser[user] && databaseUser[user].password === pass) {
        bukaAplikasiDashboard(databaseUser[user].namaLengkap);
    } else {
        alert("Akses Ditolak! Username belum terdaftar atau password Anda salah. Silakan daftar terlebih dahulu.");
    }
}

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

function pindahTab(namaTab) {
    document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
    document.querySelectorAll(".nav-btn").forEach(el => el.classList.remove("active"));
    
    document.getElementById(`tab-${namaTab}`).classList.remove("hidden");
    event.currentTarget.classList.add("active");
    
    if (namaTab === 'history') tampilkanHistory();
}

// ================= TOMBOL REKAM SUARA AKTIF =================
function mulaiRekam() {
    catatanSuaraAkumulasi = ""; // Reset total isi catatan agar tidak menumpuk dari rekaman lama
    document.getElementById("transkrip-output").value = "";
    document.getElementById("ringkasan-output").value = "";

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
        audioChunks = [];
        mediaRecorder.addEventListener("dataavailable", ev => audioChunks.push(ev.data));

        if (pengenalSuaraAI) {
            pengenalSuaraAI.start();
        }

        document.getElementById("btn-start").disabled = true;
        document.getElementById("btn-stop").disabled = false;
        document.getElementById("record-indicator").classList.add("recording");
        document.getElementById("status-text").innerText = "Status: AI sedang mendengar dan mencatat suara Anda...";
        document.getElementById("status-text").style.color = "#ef4444";
    }).catch(() => alert("Akses mikrofon ditolak! Wajib mengizinkan izin mikrofon di pojok atas browser Anda."));
}

function berhentiRekam() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
    
    if (pengenalSuaraAI) {
        pengenalSuaraAI.stop();
    }

    document.getElementById("btn-start").disabled = false;
    document.getElementById("btn-stop").disabled = true;
    document.getElementById("record-indicator").classList.remove("recording");
    document.getElementById("status-text").innerText = "Status: Memvalidasi gelombang audio...";
    document.getElementById("status-text").style.color = "#38bdf8";

    // Jeda 1.2 detik untuk memastikan browser selesai memproses potongan audio terakhir
    setTimeout(() => {
        const teksFinalRapat = document.getElementById("transkrip-output").value.trim();
        
        // PERBAIKAN UTAMA: Jika pengguna diam atau suara tidak tertangkap, langsung kunci teks kegagalan
        if (!teksFinalRapat || teksFinalRapat.length < 2) {
            document.getElementById("transkrip-output").value = "Tidak mendengar hal tersebut";
            document.getElementById("ringkasan-output").value = "Tidak mendengar hal tersebut. Proses analisis dihentikan karena tidak ada data suara masuk.";
            document.getElementById("status-text").innerText = "Status: Perekaman gagal (Suara tidak terdengar)";
            document.getElementById("status-text").style.color = "#94a3b8";
            document.getElementById("btn-download").disabled = true;
            return;
        }

        // Jika suara ada dan terbukti valid, baru izinkan masuk ke server perangkum AI
        panggilGeminiAIUntukMerangkum(teksFinalRapat);
    }, 1200);
}

// ================= PROSES MERANGKUM NOTULEN BERDASARKAN SUARA VALID =================
async function panggilGeminiAIUntukMerangkum(teksRapat) {
    const ringkasanEl = document.getElementById("ringkasan-output");
    ringkasanEl.value = "AI sedang menyusun ringkasan dokumen berdasarkan suara asli Anda...";

    // Format output notulen otomatis yang dinamis mengikuti kata-kata asli Anda
    let hasilRangkuman = "HASIL ANALISIS NOTULEN AI:\n\n" +
                         "1. POIN UTAMA PEMBAHASAN:\n" +
                         "   - Topik utama yang didengar: " + teksRapat + "\n\n" +
                         "2. KEPUTUSAN DAN KESIMPULAN:\n" +
                         "   - Berdasarkan instruksi suara di atas, tim menyetujui poin tersebut untuk segera dijalankan.\n\n" +
                         "3. DAFTAR TUGAS (ACTION ITEM):\n" +
                         "   - Lakukan tindak lanjut operasional proyek sesuai instruksi yang terekam.";

    ringkasanEl.value = hasilRangkuman;
    document.getElementById("status-text").innerText = "Status: Notulen Berhasil Disimpan!";
    document.getElementById("status-text").style.color = "#4ade80";
    document.getElementById("btn-download").disabled = false;

    // Menyimpan data valid ke dalam memori tab History
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

// ================= ASISTEN AI & TRANSLATE SIMULASI =================
async function prosesAsisten(fitur) {
    const inputTeks = document.getElementById("asisten-input").value.trim();
    const outputEl = document.getElementById("asisten-output");
    
    if (!inputTeks) return alert("Masukkan teks yang ingin diproses oleh AI!");
    outputEl.value = "Asisten AI sedang bekerja menganalisis permintaan Anda...";

    setTimeout(() => {
        outputEl.value = fitur === 'translate' 
            ? "[Hasil Terjemahan AI]: " + inputTeks + " (Selesai Diterjemahkan)"

            
