# Phase 2: Backend Core & Foundation
# Giai đoạn 2: Xác thực & Nhân Backend

## 📝 Mô tả chi tiết (Detailed Description)
Xây dựng nền móng Backend vững chắc bằng NestJS, tập trung vào tính Module hóa (Modular Architecture). Giai đoạn này chuyển đổi thiết kế Database từ tài liệu sang mã nguồn thực tế và thiết lập hệ thống bảo mật cốt lõi.

## 🔍 Phạm vi thực hiện (Scope)

### 1. Khởi tạo Infrastructure
- Thiết lập Turborepo để quản lý tập trung `apps/api` (Backend) và `apps/web` (Frontend).
- Khởi tạo NestJS boilerplate với TypeScript, ESLint, và Prettier.
- Cấu hình biến môi trường (`.env`) sử dụng `@nestjs/config`.

### 2. Database Layer (Prisma & Supabase)
- Cài đặt Prisma ORM và cấu hình kết nối tới PostgreSQL (Supabase).
- Triển khai `schema.prisma` dựa trên đặc tả [05-database-schema.md](file:///d:/Projects/cinema/docs/05-database-schema.md).
- Thực hiện Migration để đồng bộ cấu trúc bảng lên Cloud.
- Viết Database Service tập trung để tương tác với Prisma Client.

### 3. Authentication & Security
- Triển khai JWT (JSON Web Token) cho Access Token và Refresh Token.
- Xây dựng cơ chế Login/Register/Logout bảo mật (Hashing password với Bcrypt/Argon2).
- Thiết lập Passport Guards cho các phân quyền: `AdminGuard`, `UserGuard`.
- Cấu hình CORS, Helmet, và Rate Limiting để bảo vệ API.

### 4. Business Data Initialization (Modular Adapter)
- Xây dựng hệ thống Adapter (`IMovieProvider`) để tích hợp đa nguồn.
- Triển khai **Trakt.tv Integration** làm dữ liệu gốc (English).
- Tích hợp cơ chế **"Sync & Store"** để lưu dữ liệu vào Supabase Postgres.
- Chuẩn bị sẵn module **Localization** để hỗ trợ chuyển đổi EN/VI.
- Khởi tạo Suất chiếu (Showtimes) và Phòng chiếu (Rooms) mẫu phục vụ test luồng đặt vé.

---
> **Lưu ý:** Xem chi tiết tiến độ tại [checklist.md](./checklist.md).
