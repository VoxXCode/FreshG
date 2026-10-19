// =============================================================================
// BACKEND REST API LOGIN - FRESHG
// Mengacu pada Modul 2: Asynchronous JS, REST API, JSON, & Status Codes
// =============================================================================

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// -----------------------------------------------------------------------------
// 1. MIDDLEWARE
// -----------------------------------------------------------------------------
// Mengizinkan CORS agar API bisa diakses dari aplikasi React Native / Web / Postman
app.use(cors());

// Mengubah payload request body menjadi format JSON (Bab 8.3 Modul 2)
app.use(express.json());

// -----------------------------------------------------------------------------
// 2. DATA SUMBER PENGGUNA (Simulasi Database)
// Mengambil data dari src/data/users.json (Array of Objects - Bab 4.1 Modul 2)
// -----------------------------------------------------------------------------
let users = [];
const dataPath = path.join(__dirname, '..', 'src', 'data', 'users.json');

try {
  if (fs.existsSync(dataPath)) {
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const cleanContent = fileContent.replace(/^\uFEFF/, '');
    users = JSON.parse(cleanContent);
    console.log(`[Database] Memuat ${users.length} akun pengguna dari users.json`);
  }
} catch (error) {
  console.warn('[Database] users.json tidak terbaca, menggunakan default array:', error.message);
}

// Fallback data jika file belum ada
if (users.length === 0) {
  users = [
    {
      id: "u001",
      fullName: "Budi Santoso",
      email: "budi.santoso@gmail.com",
      username: "budisant",
      password: "Budi2024!",
      role: "student"
    },
    {
      id: "u005",
      fullName: "Demo FreshG",
      email: "demo@freshg.id",
      username: "demofreshg",
      password: "Demo12345",
      role: "user"
    }
  ];
}

// -----------------------------------------------------------------------------
// 3. ENDPOINT REST API: LOGIN
// Method: POST | URL: /api/login (Bab 8.2 Modul 2)
// -----------------------------------------------------------------------------
app.post('/api/login', (req, res) => {
  // Destructuring dari request body (Bab 3.3 Modul 2) dengan fallback objek kosong
  const { email, username, password } = req.body || {};
  const identifier = email || username;

  console.log(`[POST /api/login] Request diterima: identifier="${identifier || ''}"`);

  // ---------------------------------------------------------------------------
  // A. VALIDASI LOGIKA INPUT (HTTP Status Code 400: Bad Request)
  // Tabel 8.5 Modul 2: "400 Bad Request / request tidak sesuai"
  // ---------------------------------------------------------------------------
  if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
    return res.status(400).json({
      success: false,
      message: "Email atau username wajib diisi!"
    });
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({
      success: false,
      message: "Kata sandi wajib diisi!"
    });
  }

  // ---------------------------------------------------------------------------
  // B. PENGECEKAN KREDENSIAL PENGGUNA
  // Menggunakan Array Method find() (Bab 4.2 Modul 2)
  // ---------------------------------------------------------------------------
  const cleanId = identifier.trim().toLowerCase();

  const user = users.find(u => {
    const isEmailMatch = u.email && u.email.toLowerCase() === cleanId;
    const isUsernameMatch = u.username && u.username.toLowerCase() === cleanId;
    return isEmailMatch || isUsernameMatch;
  });

  // Jika akun tidak ditemukan ATAU password salah
  // HTTP Status Code 401: Unauthorized (Tabel 8.5 Modul 2)
  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: "Email atau password salah!"
    });
  }

  // ---------------------------------------------------------------------------
  // C. LOGIN BERHASIL (HTTP Status Code 200: OK)
  // Tabel 8.5 Modul 2: "200 OK / request berhasil"
  // ---------------------------------------------------------------------------
  // Simulasi token string / JWT sederhana
  const simulatedToken = Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username,
      exp: Date.now() + 3600000 // 1 jam
    })
  ).toString('base64');

  return res.status(200).json({
    success: true,
    message: "Login berhasil! Selamat datang kembali.",
    token: `Bearer_${simulatedToken}`,
    user: {
      id: user.id,
      fullName: user.fullName || user.name || "Pengguna FreshG",
      email: user.email,
      username: user.username,
      role: user.role || "user"
    }
  });
});

// -----------------------------------------------------------------------------
// 4. ENDPOINT REST API: LOGOUT
// Method: POST | URL: /api/logout
// -----------------------------------------------------------------------------
app.post('/api/logout', (req, res) => {
  console.log('[POST /api/logout] User berhasil logout');
  return res.status(200).json({
    success: true,
    message: "Logout berhasil! Sesi Anda telah diakhiri."
  });
});

// -----------------------------------------------------------------------------
// 5. PENANGANAN ROUTE 404 NOT FOUND (Tabel 8.5 Modul 2)
// -----------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`
  });
});

// -----------------------------------------------------------------------------
// 5. MENJALANKAN SERVER
// -----------------------------------------------------------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`Server REST API aktif di : http://localhost:${PORT}`);
  console.log(`Endpoint Login (POST)    : http://localhost:${PORT}/api/login`);
  console.log(`=======================================================`);
});
