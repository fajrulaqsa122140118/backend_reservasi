import nodemailer from 'nodemailer'

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: 587,
    secure: false, // true untuk port 465, false untuk 587
    auth: {
      user: process.env.SMTP_USER || 'driveaxa@gmail.com',
      pass: process.env.SMTP_PASS || 'mtzl mxgi ucgr xtau', // Ganti dengan password yang sesuai
    },
  })

  const mailOptions = {
    from: '"Dongans Biliard" <driveaxa@gmail.com>',
    to,
    subject,
    html,
  }

  await transporter.sendMail(mailOptions)
}
