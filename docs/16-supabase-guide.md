# 🚀 Hướng dẫn thiết lập Supabase chi tiết cho Cinema Project

Supabase sẽ đóng vai trò là "Trái tim" lưu trữ toàn bộ dữ liệu phim, người dùng và đặt vé của chúng ta.

---

## 1. Khởi tạo Project mới

1.  **Truy cập:** [https://supabase.com](https://supabase.com) và đăng nhập bằng tài khoản **GitHub** (nhanh nhất).
2.  **Tạo Project:** Nhấn nút **"New Project"**.
    - **Name:** Đặt tên là `cinema-app`.
    - **Database Password:** Bạn hãy nhập một mật khẩu mạnh (ví dụ: `Cinema@2026!`). 
        > [!IMPORTANT]
        > **HÃY LƯU MẬT KHẨU NÀY LẠI.** Bạn sẽ cần nó để tạo chuỗi Connection String sau này.
    - **Region:** Chọn `Southeast Asia (Singapore)` để có tốc độ kết nối nhanh nhất từ Việt Nam.
    - **Pricing Plan:** Chọn `Free`.
3.  **Đợi:** Supabase sẽ mất khoảng 1-2 phút để "nấu" (provision) database cho bạn.

---

## 2. Lấy chuỗi DATABASE_URL (Cho Backend/Prisma)

Sau khi Project đã sẵn sàng (Dashboard hiện ra):

1.  Vào mục **Project Settings** (biểu tượng bánh răng ở dưới cùng menu bên trái).
2.  Chọn tab **Database**.
3.  Tìm phần **Connection string**.
4.  Chọn tab **URI**.
5.  Chuỗi mã sẽ có dạng: 
    `postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres`
6.  **Copy chuỗi này** và thay thế `[YOUR-PASSWORD]` bằng mật khẩu bạn đã tạo ở Bước 1.

---

## 3. Lấy URL & API Key (Cho Frontend/AI Assistant)

Nếu sau này chúng ta cần dùng Supabase Client ở Frontend:

1.  Cũng trong mục **Project Settings**, chọn tab **API**.
2.  **Project URL:** Copy chuỗi trong ô `URL`.
3.  **Project API Key:** Copy chuỗi trong ô `anon` `public`. (Đây là key an toàn để dùng ở Frontend).

---

## 4. Cấu hình vào dự án Cinema

Bây giờ, bạn hãy quay lại VS Code:

1.  Tại thư mục `apps/api/`, tạo một file mới tên là `.env`.
2.  Dán thông tin bạn vừa lấy được vào:

```env
# Dán cái URI ở bước 2 vào đây
DATABASE_URL="postgresql://postgres:Cinema@2026!@db.shvscpsxxxx.supabase.co:5432/postgres"

# Sau này dùng cho JWT
JWT_SECRET="tạm-thời-để-mặc-định"
```

---

## 5. Thực hiện Migration đầu tiên

Sau khi đã có file `.env` chuẩn, bạn chỉ cần mở Terminal tại thư mục gốc của dự án và chạy:

```bash
cd apps/api
npx prisma migrate dev --name init
```

Lệnh này sẽ tự động lên Supabase và tạo tất cả các bảng (User, Movie...) cho bạn!
