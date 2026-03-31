# 12. Security Specifications

## 1. Authentication & Authorization
- **JWT Authentication:** 
    - Access Token (Ngắn hạn - 15p) truyền trong `Authorization` Header.
    - Refresh Token (Dài hạn - 7 ngày) lưu trong `HttpOnly Secure Cookie`.
- **RBAC (Role Based Access Control):** Cấu trúc `@Roles('ADMIN')` guard cho các Controller quản lý hệ thống.

## 2. Data Protection
- **Input Validation:** Tận dụng Zod schemas cho mọi Request Body để chặn SQL Injection và Malformed Data.
- **Password Hashing:** Sử dụng Argon2 hoặc Bcrypt (12 rounds).
- **XSS Protection:** Next.js mặc định sanitize dữ liệu render, backend sử dụng `helmet` middleware.

## 3. API Security
- **Rate Limiting:** Sử dụng thư viện `@nestjs/throttler` cho các đầu API nhạy cảm (Login, Register, AI Chat).
- **CORS:** Cấu hình chỉ cho phép domain Frontend được giao tiếp với Backend.

## 4. Secure Payment Flow
- **No Card Data on DB:** Tuyệt đối không lưu số thẻ tín dụng vào DB của mình. Sử dụng Token/Session ID từ nhà cung cấp thanh toán (Stripe).
- **Amount Validation:** Giá tiền luôn được Backend tính toán lại dựa trên dữ liệu DB thực tế trước khi gửi yêu cầu thanh toán.

## 5. Secret Management
- Toàn bộ API Keys (OpenAI, Cloudinary, DB URL, JWT Secret) được quản lý qua biến môi trường (.env) và chỉ cấu hình trên Dashboard của nhà cung cấp hosting (Vercel/Railway).
