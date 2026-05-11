# Ứng dụng đăng ký khảo sát sinh viên

Ứng dụng cho phép sinh viên đăng ký tham gia khảo sát với thông tin cá nhân, nhận mã dự thưởng unique và email xác nhận với mã QR.

## Câu hỏi khảo sát

1. Họ và tên
2. Mã số Sinh viên (MSSV)
3. Email nhận thông tin (unique, không trùng lặp)
4. Khóa (K64 - K70)
5. Bạn mong muốn nhận lại được những gì từ dự án?

## Tính năng

- ✅ Form đăng ký với validation đầy đủ
- ✅ Kiểm tra email trùng lặp
- ✅ Tạo mã dự thưởng unique theo email
- ✅ Gửi email xác nhận với mã QR embedded và mã dự thưởng
- ✅ Trang quản trị xem danh sách đăng ký
- ✅ Download dữ liệu dưới dạng Excel
- ✅ Responsive design

## Quy trình đăng ký

1. Sinh viên nhập đầy đủ thông tin
2. Hệ thống kiểm tra email chưa được sử dụng
3. Tạo mã dự thưởng unique (8 ký tự, hash từ email)
4. Lưu thông tin vào database
5. Gửi email xác nhận về địa chỉ sinh viên
6. Email chứa: thông tin đăng ký, mã dự thưởng, mã QR

## Mã dự thưởng

- **Định dạng**: 8 ký tự chữ hoa (A-Z, 0-9)
- **Cách tạo**: Hash MD5 của email, lấy 8 ký tự đầu, chuyển thành chữ hoa
- **Unique**: Mỗi email có 1 mã duy nhất
- **Mục đích**: Tham gia chương trình dự thưởng

## Cài đặt

1. Mở terminal tại thư mục `c:\Minh\3.Projects\fed_survey`
2. Chạy:
   ```bash
   npm install
   ```
3. Tạo file `.env` từ `.env.example` và điền thông tin Gmail:
   ```env
   EMAIL_ADDRESS=your.email@gmail.com
   EMAIL_PASSWORD=your_app_password
   PORT=3000
   ```

> Gmail yêu cầu `App Password` thay vì mật khẩu thông thường.

## Chạy ứng dụng

```bash
npm start
```

Mở trình duyệt:
- **Đăng ký khảo sát**: `http://localhost:3000`
- **Quản trị**: `http://localhost:3000/admin`

## API Endpoints

- `POST /submit` - Gửi đăng ký
- `GET /api/submissions` - Lấy danh sách đăng ký
- `GET /download-excel` - Tải file Excel
- `GET /admin` - Trang quản trị

## Cấu trúc file

```
fed_survey/
├── server.js              # Backend Node.js
├── public/
│   ├── index.html         # Form đăng ký
│   ├── admin.html         # Trang quản trị
│   ├── app.js             # Frontend logic
│   └── styles.css         # CSS styles
├── submissions.json       # Dữ liệu đăng ký
├── package.json           # Dependencies
├── .env                   # Cấu hình email
└── README.md              # Tài liệu
```
