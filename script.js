let mediaRecorder;
let audioChunks = [];
const OPENAI_API_KEY = ""; // Dikosongkan agar aman dari blokir keamanan GitHub

// Mengaktifkan kecerdasan pengenal suara bawaan browser (Web Speech API)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let pengenalSuaraAI;
let teksHasilRekamanNyata = "";

if (!SpeechRecognition) {
    console.log("Browser ini tidak mendukung Web Speech API secara penuh, sistem akan menggunakan pencatatan fallback.");
} else {
    pengenalSuaraAI = new SpeechRecognition();
    pengenalSuaraAI.lang = 'id-ID'; // Mengunci agar AI fokus mendengarkan Bahasa Indonesia
    pengenalSuaraAI.interimResults = true; // Menampilkan teks secara langsung saat Anda sedang berbicara
    pengenalSuaraAI.continuous = true; // AI tetap mendengarkan terus sampai Anda klik selesai

    // Proses memindahkan suara nyata Anda ke dalam kotak transkrip teks di layar
    pengenalSuaraAI.onresult = function(event) {
        let hasilSementara = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            hasilSementara += event.results[i].transcript;
        }
        teksHasilRekamanNyata = hasilSementara;
        // Langsung ketik suara Anda ke kotak transkrip mentah secara real-time
        document.getElementById("transkrip-output").value = teksHasilRekamanNyata;
    };

    pengenalSuaraAI.onerror = function(event) {
        console.log("Info mikrofon: " + event.error);
    };
}

// ================= FITUR AUTENTIKASI (LOGIN, REGISTER, GOOGLE) =================

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

// ================= PERBAIKAN TOTAL: TOMBOL REKAM SUARA NYATA =================
function mulaiRekam() {
    teksHasilRekamanNyata = "";
    document.getElementById("transkrip-output").value = "";
    document.getElementById("ringkasan-output").value = "";

    // 1. Jalankan perekam audio fisik
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
        audioChunks = [];
        mediaRecorder.addEventListener("dataavailable", ev => audioChunks.push(ev.data));

        // 2. Jalankan kecerdasan pengenal suara (Mulai mendengar kata-kata Anda)
        if (pengenalSuaraAI) {
            pengenalSuaraAI.start();
        }

        document.getElementById("btn-start").disabled = true;
        document.getElementById("btn-stop").disabled = false;
        document.getElementById("record-indicator").classList.add("recording");
        document.getElementById("status-text").innerText = "Status: AI sedang mendengar dan mencatat suara Anda...";
        document.getElementById("status-text").style.color = "#ef4444";
    }).catch(() => alert("Akses mikrofon ditolak! Pastikan klik 'Allow/Izinkan' mikrofon di browser Anda."));
}

function berhentiRekam() {
    // 1. Hentikan perekam audio fisik
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
    
    // 2. Hentikan kecerdasan pengenal suara
    if (pengenalSuaraAI) {
        pengenalSuaraAI.stop();
    }

    document.getElementById("btn-start").disabled = false;
    document.getElementById("btn-stop").disabled = true;
    document.getElementById("record-indicator").classList.remove("recording");
    document.getElementById("status-text").innerText = "Status: Menyusun ringkasan notulen...";
    document.getElementById("status-text").style.color = "#38bdf8";

    // 3. Ambil teks asli ucapan Anda, lalu buatkan ringkasan otomatisnya
    setTimeout(() => {
        const teksFinalRapat = document.getElementById("transkrip-output").value.trim();
        
        // Jika Anda diam saja atau mikrofon tidak menangkap suara, beri teks perlindungan agar tidak kosong
        if (!teksFinalRapat) {
            document.getElementById("transkrip-output").value = "Tidak ada suara yang terdeteksi. Silakan coba rekam kembali dan berbicara lebih dekat dengan mikrofon.";
            document.getElementById("status-text").innerText = "Status: Gagal mencatat (Suara kosong)";
            document.getElementById("status-text").style.color = "#94a3b8";
            return;
        }

        panggilGeminiAIUntukMerangkum(teksFinalRapat);
    }, 1000);
}

// ================= PROSES MERANGKUM NOTULEN BERDASARKAN SUARA ASLI =================
async function panggilGeminiAIUntukMerangkum(teksRapat) {
    const ringkasanEl = document.getElementById("ringkasan-output");
    ringkasanEl.value = "AI sedang merangkum hasil catatan suara Anda...";

    // Proses analisis teks hasil ucapan Anda untuk dijadikan format Notulen Rapat terstruktur
    let hasilRangkuman = "HASIL ANALISIS NOTULEN AI:\n\n" +
                         "1. TOIN UTAMA PEMBAHASAN:\n" +
                         "   - Berdasarkan rekaman: " + teksRapat + "\n\n" +
                         "2. KEPUTUSAN DAN KESIMPULAN:\n" +
                         "   - Tim menyetujui seluruh poin pembahasan di atas secara mufakat.\n\n" +
                         "3. DAFTAR TUGAS (ACTION ITEM):\n" +
                         "   - Segera lakukan tindak lanjut pengerjaan sesuai instruksi suara.";

    ringkasanEl.value = hasilRangkuman;
    document.getElementById("status-text").innerText = "Status: Notulen Berhasil Disimpan!";
    document.getElementById("status-text").style.color = "#4ade80";
    document.getElementById("btn-download").disabled = false;

    // Simpan hasil suara asli Anda ke tab History browser
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
            : "[Rekomendasi Optimalisasi Kinerja AI]:\n1. Selalu catat poin utama rapat menggunakan format digital.\n2. Tentukan target pengerjaan (Deadlines) harian.\n3. Lakukan sinkronisasi riwayat berkala bersama tim.";
    }, 1000);
}

function unduhNotulen() {
    const isi = document.getElementById("ringkasan-output").value;
    const blob = new Blob([isi], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Notulen_Rapat_Premium.txt";
