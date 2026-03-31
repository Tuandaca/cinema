# 🎬 Cinema - Modern AI-Powered Booking App

> **Portfolio-Grade Cinema Booking Platform** built with **Next.js 15**, **NestJS**, and **OpenAI**. Designed for hyper-performance, real-time seat selection, and intuitive AI-assisted experiences.

---

## 🌟 Overview (Tổng quan)

Cinema là một ứng dụng đặt vé xem phim hiện đại, tập trung vào trải nghiệm người dùng tuyệt vời (Cinematic UX) và hỗ trợ thông minh từ AI. Dự án được phát triển theo tiêu chuẩn doanh nghiệp, đảm bảo tính bảo mật và khả năng mở rộng cao.

### Key Features (Tính năng nổi bật)
- 🍿 **Real-time Seat Booking:** Hệ thống đặt ghế thời gian thực, chống trùng lặp (Race condition) tuyệt đối với Socket.io & Redis.
- 🤖 **AI Assistant:** Trợ lý ảo tư vấn phim theo tâm trạng (Mood-based) và hỗ trợ đặt vé tự động qua Chat.
- 🎞️ **Cinematic Experience:** Giao diện tối (Dark Mode) cao cấp với hiệu ứng Framer Motion & Trailer autoplay.
- 🔐 **Secure Checkout:** Tích hợp thanh toán mô phỏng (Stripe-ready), quản lý đơn hàng & mã QR vé.
- 📊 **Admin Dashboard:** Quản lý phim, suất chiếu và theo dõi doanh thu qua biểu đồ.

---

## 🛠️ Tech Stack (Công nghệ)

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), TypeScript, TailwindCSS, Framer Motion |
| **Backend** | NestJS (Modular Architecture), TypeScript |
| **Database** | PostgreSQL (Managed by Supabase), Prisma ORM |
| **Caching/Locking** | Redis (Managed by Upstash) |
| **Realtime** | Socket.IO |
| **AI Integration** | OpenAI API (GPT-4o Function Calling) |
| **Storage** | Cloudinary (Images/Posters), YouTube (Trailers) |

---

## 📖 Project Documentation (Hệ thống Tài liệu)

Toàn bộ tài liệu đặc tả dự án được lưu trữ trong thư mục `/docs`. Đây là nguồn tài liệu chuẩn để AI và Con người cùng hiểu dự án:

1.  **[PRD](file:///d:/Projects/cinema/docs/01-prd.md)**: Yêu cầu sản phẩm & KPIs.
2.  **[Business Flow](file:///d:/Projects/cinema/docs/02-business-flow.md)**: Quy trình nghiệp vụ chi tiết.
3.  **[Database Schema](file:///d:/Projects/cinema/docs/05-database-schema.md)**: Thiết kế DB & Prisma Schema.
4.  **[API Spec](file:///d:/Projects/cinema/docs/06-api-spec.md)**: Đặc tả REST APIs.
5.  **[Architecture](file:///d:/Projects/cinema/docs/07-architecture.md)**: Kiến trúc hệ thống tổng thể.
6.  **[AI Spec](file:///d:/Projects/cinema/docs/14-ai-assistant-spec.md)**: Thiết kế hội thoại & logic AI.

---

## 🚥 Roadmap (Lộ trình phát triển)

- [x] **Phase 1: System Design & Architecture** (Hoàn thành)
- [ ] **Phase 2: Backend Foundation** (Đang triển khai)
- [ ] **Phase 3: Frontend Core UI**
- [ ] **Phase 4: Real-time Seat Booking**
- [ ] **Phase 5: Payment & Invoice**
- [ ] **Phase 6: AI Assistant Integration**
- [ ] **Phase 7: Admin Dashboard**
- [ ] **Phase 8: Optimization & Deployment**

---

## 🚦 Hướng dẫn bắt đầu phiên làm việc (For AI Agent)

Khi bắt đầu một phiên làm việc mới, Agent PHẢI thực hiện các bước sau:
1.  Đọc `.agent/CONTEXT.md` để nắm được **Phase hiện tại** và **Task đang làm dở**.
2.  Đọc `.agent/GEMINI.md` để hiểu quy tắc làm việc và Tech Stack.
3.  Đọc tài liệu tương ứng trong `/docs` để thực thi đúng logic nghiệp vụ (Ví dụ: Đang làm API thì đọc `06-api-spec.md`).
4.  Bám sát **Checklist** của Phase hiện tại trong thư mục `plan/`.

---

## 🚀 Deployment (Triển khai)
- **Frontend:** Vercel
- **Backend:** Railway / Render
- **Database:** Supabase
- **Redis:** Upstash

---
*Created and Managed by Antigravity AI vs Tuandaca*