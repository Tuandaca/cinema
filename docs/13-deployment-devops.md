# 13. Deployment & DevOps Strategy

## 1. Development Environment
- **Docker Compose:** Thiết lập môi trường local đồng nhất bao gồm PostgreSQL và Redis.
- **Linter/Hooks:** Sử dụng `husky` và `lint-staged` để chặn commit nếu code không đạt chuẩn ESLint.

## 2. CI/CD Pipeline (GitHub Actions)
- Mỗi khi Push code lên branch `main`:
    1. Chạy `npm install`.
    2. Chạy Linter & Unit tests.
    3. Nếu PASS -> Tự động Trigger deploy sang Vercel (FE) và Railway (BE).

## 3. Production Architecture (Free-tier Focus)
- **Frontend:** Vercel (Auto-edge caching, mượt mà với Next.js).
- **Backend:** Railway (Hỗ trợ deploy NestJS qua Dockerfile cực nhanh).
- **Database:** Supabase (Postgres Managed Service).
- **Redis:** Upstash (Serverless Redis, quản lý connection thông minh).

## 4. Backup & Rollback
- **Database Backup:** Tận dụng tính năng Auto backup của Supabase.
- **Rollback:** Vercel/Railway cho phép Instant Rollback về commit trước đó nếu phát hiện lỗi nghiêm trọng trên Production.

## 5. Monitoring & Logging
- **Railway Logs:** Xem log trực tiếp từ Dashboard.
- **BetterStack:** Cảnh báo qua Telegram nếu URL của Backend bị Down (Health check).
- **Uptime:** Công cụ miễn phí giám sát latency của hệ thống.
