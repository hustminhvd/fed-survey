const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const ExcelJS = require('exceljs');
const session = require('express-session');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const emailAddress = process.env.EMAIL_ADDRESS;
const emailPassword = process.env.EMAIL_PASSWORD;

if (!emailAddress || !emailPassword) {
  console.error('Vui lòng cấu hình EMAIL_ADDRESS và EMAIL_PASSWORD trong file .env');
  process.exit(1);
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Session middleware for admin authentication
app.use(session({
  secret: 'fed_survey_secret_2026',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
}));

app.use(express.static(path.join(__dirname, 'public')));

// Serve static files including QR.png from root
app.use(express.static(path.join(__dirname)));

// Middleware to check admin authentication
const checkAdminAuth = (req, res, next) => {
  if (req.session.adminAuthenticated) {
    next();
  } else {
    res.redirect('/admin-login');
  }
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailAddress,
    pass: emailPassword,
  },
});

app.post('/submit', async (req, res) => {
  const { studentName, studentId, studentEmail, studentClass, expectations } = req.body;

  if (!studentName || !studentId || !studentEmail || !studentClass || !expectations) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin.' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(studentEmail)) {
    return res.status(400).json({ success: false, message: 'Email không hợp lệ.' });
  }

  const dataFile = path.join(__dirname, 'submissions.json');
  const existing = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile, 'utf8') || '[]') : [];

  // Check if email already exists
  const emailExists = existing.some(sub => sub.studentEmail.toLowerCase() === studentEmail.toLowerCase());
  if (emailExists) {
    return res.status(400).json({ success: false, message: 'Email này đã được sử dụng để đăng ký. Vui lòng sử dụng email khác.' });
  }

  // Generate unique reward code based on email
  const rewardCode = crypto.createHash('md5').update(studentEmail.toLowerCase()).digest('hex').substring(0, 8).toUpperCase();

  const submission = {
    id: Date.now(),
    studentName,
    studentId,
    studentEmail,
    studentClass,
    expectations,
    rewardCode,
    submittedAt: new Date().toISOString(),
  };

  existing.push(submission);
  fs.writeFileSync(dataFile, JSON.stringify(existing, null, 2));

  try {
    const qrCodePath = `http://localhost:${port}/QR.png`;
    
    const mailOptions = {
      from: emailAddress,
      to: studentEmail, // Gửi về email của sinh viên
      subject: 'Xác nhận đăng ký khảo sát thành công',
      text: `Chào ${studentName},\n\nCảm ơn bạn đã đăng ký tham gia khảo sát của chúng tôi!\n\nThông tin đăng ký:\n- Họ tên: ${studentName}\n- MSSV: ${studentId}\n- Email: ${studentEmail}\n- Khóa: ${studentClass}\n- Mong muốn: ${expectations}\n\nMã dự thưởng của bạn: ${rewardCode}\n\nChúng tôi sẽ liên hệ với bạn sớm. Chúc bạn may mắn!\n\nTrân trọng,\nĐội khảo sát`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">🎉 Đăng ký thành công!</h1>
              <p style="margin: 10px 0 0 0;">Cảm ơn bạn đã tham gia khảo sát</p>
            </div>

            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #316dfa; margin-top: 0;">Thông tin đăng ký</h2>

              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 120px;">Họ tên:</td>
                  <td style="padding: 8px 0;">${studentName}</td>
                </tr>
                <tr style="background: #fff;">
                  <td style="padding: 8px 0; font-weight: bold;">MSSV:</td>
                  <td style="padding: 8px 0;">${studentId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                  <td style="padding: 8px 0;">${studentEmail}</td>
                </tr>
                <tr style="background: #fff;">
                  <td style="padding: 8px 0; font-weight: bold;">Khóa:</td>
                  <td style="padding: 8px 0;">${studentClass}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Mong muốn:</td>
                  <td style="padding: 8px 0;">${expectations.replace(/\n/g, '<br/>')}</td>
                </tr>
              </table>

              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h3 style="color: #856404; margin: 0 0 10px 0;">🎁 Mã dự thưởng của bạn</h3>
                <div style="font-size: 24px; font-weight: bold; color: #316dfa; letter-spacing: 2px;">${rewardCode}</div>
                <p style="margin: 10px 0 0 0; color: #856404; font-size: 14px;">Giữ mã này để tham gia chương trình dự thưởng</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <p style="margin-bottom: 10px; font-weight: bold;">Mã QR xác nhận:</p>
                <img src="cid:qrcode" alt="Mã QR xác nhận" style="border: 2px solid #316dfa; padding: 10px; max-width: 200px; border-radius: 8px;" />
              </div>

              <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #155724; text-align: center; font-weight: bold;">
                  ✅ Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất!
                </p>
              </div>

              <p style="text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px;">
                Thời gian đăng ký: ${new Date().toLocaleString('vi-VN')}<br/>
                Trân trọng,<br/>
                <strong>Đội khảo sát</strong>
              </p>
            </div>
          </body>
        </html>
      `,
      attachments: [
        {
          filename: 'QR.png',
          path: path.join(__dirname, 'QR.png'),
          cid: 'qrcode',
        }
      ],
    };

    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: 'Đăng ký thành công! Vui lòng kiểm tra email để nhận mã dự thưởng.' });
  } catch (error) {
    console.error('Lỗi gửi email:', error);
    return res.status(500).json({ success: false, message: 'Không thể gửi đăng ký. Vui lòng thử lại sau.' });
  }
});

app.get('/api/submissions', checkAdminAuth, (req, res) => {
  try {
    const dataFile = path.join(__dirname, 'submissions.json');
    const submissions = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile, 'utf8') || '[]') : [];
    res.json(submissions);
  } catch (error) {
    console.error('Lỗi đọc dữ liệu:', error);
    res.status(500).json({ error: 'Không thể đọc dữ liệu' });
  }
});

app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.post('/admin-login', (req, res) => {
  const { password } = req.body;

  if (password === 'Fed@2026') {
    req.session.adminAuthenticated = true;
    return res.json({ success: true, message: 'Đăng nhập thành công!' });
  } else {
    return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác!' });
  }
});

app.get('/admin', checkAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin-logout', (req, res) => {
  req.session.adminAuthenticated = false;
  res.redirect('/admin-login');
});

app.get('/download-excel', checkAdminAuth, async (req, res) => {
  try {
    const dataFile = path.join(__dirname, 'submissions.json');
    const submissions = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile, 'utf8') || '[]') : [];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Đăng ký khảo sát');

    // Thêm header
    worksheet.columns = [
      { header: 'STT', key: 'stt', width: 5 },
      { header: 'Họ và tên', key: 'name', width: 20 },
      { header: 'MSSV', key: 'id', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Khóa', key: 'class', width: 10 },
      { header: 'Mã dự thưởng', key: 'reward', width: 15 },
      { header: 'Mong muốn', key: 'expectations', width: 40 },
      { header: 'Thời gian đăng ký', key: 'time', width: 20 },
    ];

    // Thêm dữ liệu
    submissions.forEach((submission, index) => {
      worksheet.addRow({
        stt: index + 1,
        name: submission.studentName,
        id: submission.studentId,
        email: submission.studentEmail,
        class: submission.studentClass,
        reward: submission.rewardCode || 'N/A',
        expectations: submission.expectations,
        time: new Date(submission.submittedAt).toLocaleString('vi-VN'),
      });
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=dang-ky-khao-sat-${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Lỗi tạo Excel:', error);
    res.status(500).json({ error: 'Không thể tạo file Excel' });
  }
});

app.listen(port, () => {
  console.log(`Ứng dụng chạy tại http://localhost:${port}`);
});
