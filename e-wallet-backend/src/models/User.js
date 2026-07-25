// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   username: {
//     type: String,
//     required: [true, 'Username wajib diisi'],
//     trim: true
//   },
//   email: {
//     type: String,
//     required: [true, 'Email wajib diisi'],
//     unique: true, // Mencegah email ganda
//     lowercase: true,
//     trim: true
//   },
//   password: {
//     type: String,
//     required: [true, 'Password wajib diisi']
//   },
//   pin: {
//     type: String,
//     // PIN mungkin belum diisi saat register awal, jadi tidak wajib dulu
//     default: null 
//   },
//   phone_number: {
//     type: String,
//     required: [true, 'Nomor HP wajib diisi'],
//     unique: true
//   },
//   avatar: {
//     type: String,
//     default: null
//   },
//   nik: {
//     type: String,
//     default: null // Data KYC
//   },
//   is_verified: {
//     type: Boolean,
//     default: false // Akan true jika NIK/Avatar diisi (Limit 20jt)
//   },
//   is_suspended: {
//     type: Boolean,
//     default: false // Kontrol keamanan Admin
//   },
//   two_factor_enabled: {
//     type: Boolean,
//     default: false
//   },
//   two_factor_secret: {
//     type: String,
//     default: null
//   },
//   role: {
//     type: String,
//     enum: ['user', 'admin'], // Hanya menerima dua string ini
//     default: 'user'
//   },
//   login_attempts: {
//     type: Number,
//     required: true,
//     default: 0
//   },
//   lock_until: {
//     type: Date
//   }
  
// }, { 
//   timestamps: true // Otomatis membuat created_at dan updated_at
// });


// // 1. Hook Pre-Save: Mengacak Password dan PIN sebelum disimpan
// // HAPUS parameter (next) di dalam kurung
// userSchema.pre('save', async function () {
//   // Jika password tidak dimodifikasi (misal user hanya update avatar), keluar dari fungsi
//   if (!this.isModified('password')) return;

//   // Hash password dengan salt factor 12
//   this.password = await bcrypt.hash(this.password, 12);
  
//   // Hapus field passwordConfirm jika kamu menggunakannya di validasi frontend
//   this.passwordConfirm = undefined; 
  
//   // HAPUS pemanggilan next() di sini
// });

// // Hook Pre-Save tambahan untuk PIN
// userSchema.pre('save', async function () {
//   if (!this.isModified('pin') || !this.pin) return;
//   this.pin = await bcrypt.hash(this.pin, 12);
// });


// // 2. Instance Method: Membandingkan password mentah dengan password terenkripsi di DB
// userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
//   // Menggunakan bcrypt.compare untuk mencocokkan
//   return await bcrypt.compare(candidatePassword, userPassword);
// };

// // Instance Method: Membandingkan PIN
// userSchema.methods.correctPin = async function (candidatePin, userPin) {
//   return await bcrypt.compare(candidatePin, userPin);
// };


// module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username wajib diisi'],
    trim: true,
    index: true // Mempercepat pencarian data
  },
  email: {
    type: String,
    required: [true, 'Email wajib diisi'],
    unique: true,
    lowercase: true,
    trim: true,
    // [CLEAN CODE] Validasi tingkat lapis baja di sisi Server
    match: [/^\S+@\S+\.\S+$/, 'Format email tidak valid forensik'] 
  },
  password: {
    type: String,
    required: [true, 'Password wajib diisi'],
    minlength: [8, 'Password minimal 8 karakter'],
    select: false // [ISOLASI KEAMANAN] Cegah password bocor di JSON response
  },
  pin: {
    type: String,
    default: null,
    select: false // [ISOLASI KEAMANAN]
  },
  phone_number: {
    type: String,
    required: [true, 'Nomor HP wajib diisi'],
    unique: true
  },
  avatar: {
    type: String,
    default: null
  },
  nik: {
    type: String,
    default: null
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  is_suspended: {
    type: Boolean,
    default: false
  },
  two_factor_enabled: {
    type: Boolean,
    default: false
  },
  two_factor_secret: {
    type: String,
    default: null,
    select: false // [ISOLASI KEAMANAN]
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  login_attempts: {
    type: Number,
    required: true,
    default: 0
  },
  lock_until: {
    type: Date
  }
}, { 
  timestamps: true 
});

// ==========================================
// ALGOJO PRE-SAVE: Sentralisasi Enkripsi Kredensial
// ==========================================
userSchema.pre('save', async function () {
  // 1. Eksekusi Enkripsi Password (jika dimodifikasi)
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  // 2. Eksekusi Enkripsi PIN (jika dimodifikasi & tidak null)
  if (this.isModified('pin') && this.pin) {
    this.pin = await bcrypt.hash(this.pin, 12);
  }
});

// ==========================================
// INSTANCE METHODS: Komparasi Forensik
// ==========================================
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.correctPin = async function (candidatePin, userPin) {
  return await bcrypt.compare(candidatePin, userPin);
};

module.exports = mongoose.model('User', userSchema);