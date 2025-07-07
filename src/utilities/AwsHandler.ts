
import { S3Client, PutObjectCommand, ObjectCannedACL, DeleteObjectCommand } from '@aws-sdk/client-s3'
import logger from './Log'
import { supabase } from '@/config/supabase'



const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT,
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // WAJIB untuk selain AWS
  // useAccelerateEndpoint: true,
})

const pathToFolder: string = process.env.PATH_AWS || 'uploads'

export type FileType = {
  mimetype: string;
  buffer: Buffer;
  originalname: string;
};


/**
 * Upload file ke S3 tanpa menggunakan Redis
 * @param file - File yang akan diupload
 * @param folderPath - Path folder tujuan di S3
 * @returns URL file yang diupload atau null jika gagal
 */


const uploadFileToS3WithOutRedis = async (file: FileType, folderPath: string): Promise<{ url: string; filename: string } | null> => {
  try {
    const { mimetype, buffer, originalname } = file
    const uniqueFilename = `${originalname.split('.')[0]}_${Date.now()}.${originalname.split('.')[1]}`
    
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: `${pathToFolder}/${folderPath}/${uniqueFilename}`,
      Body: Buffer.from(buffer),
      ACL: ObjectCannedACL.public_read_write,
      ContentType: mimetype,
    }

    const command = new PutObjectCommand(uploadParams)
    await s3Client.send(command)

    const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${pathToFolder}/${folderPath}/${uniqueFilename}`

    return {
      url,
      filename: uniqueFilename,
    }
    // return `https://dshzlnrzugmwbiqobzuj.supabase.co/storage/v1/object/public/${process.env.AWS_S3_BUCKET}/${pathToFolder}/${folderPath}/${uniqueFilename}`

  } catch (error) {
    console.error('Error uploading file to S3:', error)
    logger.error(error)
    return null
  }
}

const uploadFileToSupabase = async (
  file: FileType,
  folderPath: string,
): Promise<{ url: string; filename: string } | null> => {
  try {
    const uniqueFilename = `${Date.now()}_${file.originalname}`
    const uploadPath = `${folderPath}/${uniqueFilename}`

    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .upload(uploadPath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return null
    }

    const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${uploadPath}`

    return {
      url,
      filename: uniqueFilename,
    }
  } catch (error) {
    console.error('Unexpected upload error:', error)
    return null
  }
}
/**
 * Hapus file dari S3 berdasarkan URL
 * @param fileUrl - URL file yang akan dihapus
 */
const deleteFileFromS3 = async (fileUrl: string): Promise<void> => {

  const filePath = fileUrl.split('/').slice(4).join('/') // Mengambil path file dari URL
  try {

    console.log('filePath', filePath)
    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: filePath,
    }

    const command = new DeleteObjectCommand(deleteParams)
    await s3Client.send(command)
  } catch (error) {
    console.error('Error deleting file from S3:', error)
    logger.error(error)
  }
}
/**
 * Hapus file dari Supabase Storage
 * @param filePath - Path file di Supabase (tanpa URL base)
 * @returns true jika berhasil, false jika gagal
 */
const deleteFileFromSupabase = async (filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .remove([filePath])

    if (error) {
      console.error('Supabase delete error:', error)
      return false
    }

    console.log(`File ${filePath} berhasil dihapus dari Supabase.`)
    return true
  } catch (error) {
    console.error('Unexpected delete error:', error)
    return false
  }
}


export { uploadFileToS3WithOutRedis, deleteFileFromS3, uploadFileToSupabase, deleteFileFromSupabase }