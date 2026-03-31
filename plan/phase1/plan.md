# Phase 1: System Design & Setup
# Giai đoạn 1: Thiết kế Hệ thống & Cài đặt

## 📝 Mô tả chi tiết (Detailed Description)
Đây là giai đoạn đặt nền móng cho toàn bộ dự án. Mục tiêu là tạo ra "Bản thiết kế kỹ thuật" (Blueprint) và thiết lập môi trường phát triển cơ bản để đảm bảo mọi bước code sau này đều bám sát nghiệp vụ và kiến trúc tối ưu.

## 🔍 Phạm vi thực hiện (Scope)

### 1. Phân tích & Thiết kế (Specification & Analysis)
- Xây dựng 15 tài liệu đặc tả chi tiết từ PRD, Flow, ERD đến Kiến trúc hệ thống.
- Đảm bảo tính nhất quán giữa Database Schema và API Specs.
- Thiết kế các Sequence Diagrams cho các luồng phức tạp như Seat Locking (Tránh Race Condition).

### 2. Thiết lập cấu trúc dự án (Infrastructure Setup)
- Khởi tạo thư mục `/docs` cho tài liệu và `/plan` cho quản lý tiến độ.
- Xây dựng README.md và CONTEXT.md làm nguồn dẫn cho các phiên làm việc của AI Agent.
- Khởi tạo cấu trúc **Monorepo (Turborepo)**. Việc dùng Monorepo giúp chia sẻ Type-safe Zod schema và Prisma models giữa Frontend và Backend.

### 3. Chuẩn bị tài nguyên (Resources)
- Xác định và lựa chọn các dịch vụ Free-tier (Supabase, Upstash, Vercel, Railway).
- Hướng dẫn cấu hình biến môi trường (`.env.example`) và các Secrets cần thiết.

---
> **Lưu ý:** Mọi tiến độ của Giai đoạn này được cập nhật tại [checklist.md](./checklist.md).
