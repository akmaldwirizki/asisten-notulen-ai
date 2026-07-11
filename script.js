let mediaRecorder;
let audioChunks = [];

// Catatan Penting untuk Presentasi: 
// Di bawah ini adalah simulasi pengiriman data teks rapat ke Gemini API.
// Untuk penggunaan asli, Anda membutuhkan API Key dari Google AI Studio.
const GEMINI_API_KEY = "TEMPEL_API_KEY_GEMINI_DI_SINI"; 

function mulaiRekam() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            audioChunks = [];

            mediaRecorder.addEventListener("dataavailable", event => {
                audioChunks.push(event.data);
            });

            document.getElementById("btn-start").disabled = true;
            document.getElementById("btn-stop").disabled = false;
            document.getElementById("record-indicator").classList.add("recording");
            document.getElementById("status-text").innerText = "Status: Membaca Audio Rapat (Merekam...)";
            document.getElementById("status-text").style.color = "#dc2626";
        })
        .catch(err => {
            alert("Gagal mengakses mikrofon. Izinkan akses mikrofon di browser Anda!");
        });
}

function berhentiRekam() {
    mediaRecorder.stop();
    
    document.getElementById("btn-start").disabled = false;
    document.getElementById("btn-stop").disabled = true;
    document.getElementById("record-indicator").classList.remove("recording");
    document.getElementById("status-text").innerText = "Status: Mengirim audio ke Google Gemini AI...";
    document.getElementById("status-text").style.color = "#2563eb";

    mediaRecorder.addEventListener("stop", () => {
        // Pada aplikasi produksi, file 'audioBlob' ini yang dikirim ke API Speech-to-Text Gemini
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        
        // Simulasi teks rapat yang berhasil ditranskrip oleh AI berdasarkan rekaman suara
        setTimeout(() => {
            const contohTranskripRapat = "Rapat proyek BTI dimulai. Budi mengusulkan agar desain website diperbaiki minggu depan karena tampilannya kurang ramah pengguna. Susi setuju dan bertanggung jawab menyelesaikan desain baru hari Kamis. Ani menambahkan bahwa database harus siap hari Jumat dan itu akan dikerjakan oleh tim backend yaitu Doni. Keputusan rapat hari ini adalah menyetujui perbaikan antarmuka dan target selesai minggu ini.";
            
            document.getElementById("transkrip-output").value = contohTranskripRapat;
            
            // Lanjut panggil fungsi merangkum teks menggunakan Gemini LLM
            panggilGeminiAIUntukMerangkum(contohTranskripRapat);
        }, 2000); // Simulasi jeda loading server 2 detik
    });
}

async function panggilGeminiAIUntukMerangkum(teksRapat) {
    const ringkasanElement = document.getElementById("ringkasan-output");
    ringkasanElement.value = "AI sedang menyusun ringkasan, menganalisis keputusan, dan membuat action item...";

    try {
        // Menembak server Google Gemini API (Model LLM Generatif gratis)
        const response = await fetch(`https://googleapis.com{GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Ubah teks transkrip rapat berikut menjadi format Notulen Rapat terstruktur. Berikan hasil akhir dengan poin-poin berikut: 1. Poin Utama Pembahasan, 2. Keputusan yang Diambil, 3. Action Item (Daftar Tugas) beserta penanggung jawabnya jika ada. Ini teksnya: "${teksRapat}"`
                    }]
                }]
            })
        });

        const data = await response.json();
        const hasilRangkuman = data.candidates[0].content.parts[0].text;
        
        ringkasanElement.value = hasilRangkuman;
        document.getElementById("status-text").innerText = "Status: Notulen Selesai Dibuat!";
        document.getElementById("status-text").style.color = "#16a34a";
        document.getElementById("btn-download").disabled = false;

    } catch (error) {
        // Jika API Key belum diisi/salah, program akan menampilkan fallback agar presentasi Anda tetap aman berjalan aman
        ringkasanElement.value = "📋 HASIL RINGKASAN ASISTEN AI (Simulasi Mode):\n\n" +
            "1. POIN UTAMA PEMBAHASAN:\n" +
            "   - Perbaikan desain antarmuka (UI) website proyek BTI karena kurang user-friendly.\n" +
            "   - Kesiapan infrastruktur database pendukung.\n\n" +
            "2. KEPUTUSAN YANG DIAMBIL:\n" +
            "   - Menyetujui perbaikan total antarmuka web.\n" +
            "   - Seluruh target pembaruan wajib selesai minggu ini.\n\n" +
            "3. ACTION ITEM & PENANGGUNG JAWAB:\n" +
            "   - Susi: Menyelesaikan desain antarmuka baru (Target: Hari Kamis).\n" +
            "   - Doni (Tim Backend): Menyiapkan dan mengintegrasikan database (Target: Hari Jumat).";
            
        document.getElementById("status-text").innerText = "Status: Selesai (Simulasi Mode)";
        document.getElementById("status-text").style.color = "#16a34a";
        document.getElementById("btn-download").disabled = false;
    }
}

function unduhNotulen() {
    const isiNotulen = document.getElementById("ringkasan-output").value;
    const blob = new Blob([isiNotulen], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Hasil_Notulen_Rapat_AI.txt";
    link.click();
}
