export const PesanKonfirmasi = (name: string, value: string): string => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Selamat Datang</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          background-color: #ffffff;
          max-width: 600px;
          margin: 30px auto;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #2c3e50;
        }
        .content {
          font-size: 16px;
          color: #333;
          line-height: 1.6;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #888;
          text-align: center;
        }
        .btn {
          display: inline-block;
          padding: 12px 20px;
          margin-top: 20px;
          background-color: #007bff;
          color: #fff !important;
          text-decoration: none;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Halo, ${name}!</h1>
        </div>
        <div class="content">${value}</div>
        <div class="footer">
          <p>Email ini dikirim otomatis. Jangan membalas email ini.</p>
        </div>
      </div>
    </body>
  </html>
  `
}
