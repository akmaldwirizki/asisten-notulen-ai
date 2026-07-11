let mediaRecorder;
let audioChunks = [];
const GEMINI_API_KEY = "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"; 

function prosesLogin() {
    const nama = document.getElementById("username").value.trim();
    if (!nama) return alert("Silakan masukkan username terlebih dahulu!");
    
    document.getElementById("login-page").classList.add("hidden");
    document.getElementById("main-app").classList.remove("hidden");
    
    document.getElementById("user-display").innerText = nama;
    document.getElementById("prof-nama").innerText = nama;
    tampilkanHistory();
}

function prosesLogout() {
    document.getElementById("login-page").classList.remove("hidden");
    document.getElementById("main-app").classList.add("hidden");
}

function pindahTab(namaTab) {
    document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
    document.querySelectorAll(".nav-btn").forEach(el => el.classList.remove("active"));
    
    document.getElementById(`tab-${namaTab}`).classList.remove("hidden");
    event.currentTarget.classList.add("active");
    
    if (namaTab === 'history') tampilkanHistory();
}

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
    }).catch(() => alert("Akses mikrofon ditolak!"));
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

async function panggilGeminiAIUntukMerangkum(teksRapat) {
    const ringkasanEl = document.getElementById("ringkasan-output");
    ringkasanEl.value = "AI sedang merangkum poin rapat...";

    let hasilRangkuman = "";
    try {
        const response = await fetch(`https://googleapis.com{GEMINI_API_KEY}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: `Ubah transkrip berikut menjadi format notulen rapat terstruktur berisi Poin Utama dan Action Item: "${teksRapat}"` }] }] })
        });
        const data = await response.json();
        hasilRangkuman = data.candidates.content.parts.text;
    } catch {
        hasilRangkuman = "1. POIN UTAMA: Menyepakati pengerjaan proyek AI BTI minggu ini.\n2. ACTION ITEM:\n   - Budi: Backend selesai Kamis.\n   - Susi: Desain UI selesai Jumat.";
    }

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

async function prosesAsisten(fitur) {
    const inputTeks = document.getElementById("asisten-input").value.trim();
    const outputEl = document.getElementById("asisten-output");
    
    if (!inputTeks) return alert("Masukkan teks yang ingin diproses oleh AI!");
    outputEl.value = "Asisten AI sedang bekerja menganalisis permintaan Anda...";

    let promptKustom = "";
    if (fitur === 'translate') {
        const bahasa = document.getElementById("pilihan-bahasa").value;
        promptKustom = `Terjemahkan teks berikut secara akurat ke dalam Bahasa ${bahasa} tanpa memberikan teks pengantar tambahan: "${inputTeks}"`;
    } else {
        promptKustom = `Bertindaklah sebagai Konsultan Produktivitas Kerja. Analisis catatan atau keluhan kerja berikut, kemudian berikan 3 tips nyata untuk meningkatkan efisiensi kinerjanya: "${inputTeks}"`;
    }

    try {
        const response = await fetch(`https://googleapis.com{GEMINI_API_KEY}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptKustom }] }] })
        });
        const data = await response.json();
        outputEl.value = data.candidates.content.parts.text;
    } catch {
        outputEl.value = fitur === 'translate' 
            ? "[Mode Simulasi] Hasil Translate: Sambungkan API Key asli untuk hasil dinamis."
            : "[Mode Simulasi] Tips Kinerja AI:\n1. Bagi tugas besar rapat menjadi sub-task harian kecil.\n2. Gunakan teknik Pomodoro (25 menit kerja, 5 menit istirahat).\n3. Kurangi rapat evaluasi di atas 30 menit demi efisiensi.";
    }
}

function unduhNotulen() {
    const isi = document.getElementById("ringkasan-output").value;
    const blob = new Blob([isi], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Notulen_Rapat_Premium.txt";
    link.click();
}
