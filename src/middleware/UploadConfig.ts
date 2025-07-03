import multer from 'multer'
import path from 'path'

// Konfigurasi storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/') // folder penyimpanan
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext
    cb(null, uniqueName)
  },
})

// Filter jenis file (opsional)
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Hanya file gambar yang diizinkan'), false)
  }
}

export const upload = multer({ storage, fileFilter })
export const uploadConfig = {
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 10, // Maksimal ukuran file 10MB
  },
}