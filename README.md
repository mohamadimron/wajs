# MyApp - Web Application

Aplikasi web modern dengan fitur autentikasi, real-time communication, dan manajemen berbasis peran.

## Fitur Utama

- **Autentikasi**: Sistem login dan register yang aman
- **Manajemen Peran**: Perbedaan antara admin dan user biasa
- **Real-time Communication**: Menggunakan Socket.IO untuk komunikasi real-time
- **Log Sistem**: Pelacakan aktivitas pengguna
- **Dashboard**: Tampilan khusus untuk masing-masing peran
- **Tampilan Responsif**: Desain mobile-friendly menggunakan Bootstrap 5
- **Keamanan**: Proteksi terhadap serangan umum

## Teknologi yang Digunakan

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Frontend**: HTML5, CSS3, Bootstrap 5, JavaScript
- **Template Engine**: EJS
- **Real-time**: Socket.IO
- **Autentikasi**: Session-based dengan bcryptjs untuk hashing password
- **Keamanan**: Helmet.js, rate limiting

## Struktur Proyek

```
/myapp
├── server.js           # File server utama
├── package.json        # Dependensi dan konfigurasi
├── views/              # Template EJS
│   ├── layout.ejs      # Layout utama
│   ├── index.ejs       # Halaman beranda
│   ├── login.ejs       # Halaman login
│   ├── register.ejs    # Halaman register
│   ├── dashboard.ejs   # Dashboard user
│   ├── admin.ejs       # Dashboard admin
│   ├── settings.ejs    # Halaman pengaturan
│   └── 404.ejs         # Halaman error 404
├── public/             # File statis
│   ├── css/
│   │   └── style.css   # File CSS kustom
│   ├── js/
│   │   └── main.js     # File JavaScript klien
│   └── images/         # Gambar dan aset lainnya
└── database.db         # Database SQLite (akan dibuat otomatis)
```

## Instalasi

1. Pastikan Anda memiliki Node.js versi 14 atau lebih baru terinstal di sistem Anda
2. Clone atau download proyek ini
3. Masuk ke direktori proyek
4. Install dependensi:
   ```bash
   npm install
   ```
5. Jalankan aplikasi:
   ```bash
   npm start
   ```
   Atau untuk mode pengembangan:
   ```bash
   npm run dev
   ```

## Konfigurasi Default

- **Port Server**: 8080
- **Akun Admin Default**:
  - Username: `admin`
  - Password: `admin123`

## Penggunaan

1. Akses aplikasi melalui browser di `http://localhost:8080`
2. Registrasi akun baru atau login dengan akun admin default
3. Nikmati fungsionalitas berdasarkan peran Anda

## Fitur Admin

- Panel manajemen pengguna
- Lihat log aktivitas sistem
- Akses pengaturan aplikasi
- Manajemen sistem

## Fitur Real-time

Aplikasi ini menyertakan fungsionalitas real-time melalui Socket.IO:
- Chat real-time di dashboard
- Indikator koneksi aktif
- Notifikasi real-time (dalam pengembangan)

## Keamanan

- Password di-hash menggunakan bcryptjs
- Perlindungan terhadap serangan CSRF
- Rate limiting untuk mencegah spam
- Sanitasi input pengguna
- Session management yang aman

## Responsif

Aplikasi dirancang dengan pendekatan mobile-first menggunakan Bootstrap 5, memastikan tampilan yang optimal di berbagai ukuran perangkat.

## Lisensi

Aplikasi ini merupakan proyek open-source untuk tujuan pembelajaran.# wajs
# wajs
