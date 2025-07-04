import multer from 'multer'

// Gunakan penyimpanan di memory (buffer)
const storage = multer.memoryStorage()

// Maksimum ukuran file 10MB, dan hanya menerima gambar
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Hanya file gambar yang diperbolehkan (jpeg, png, webp)'))
    }
    cb(null, true)
  },
})
