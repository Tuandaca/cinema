# 10. Non-Functional Requirements (NFR)

## 1. Performance Targets
- **Lighthouse Score:** > 90 cho mọi chỉ số (Desktop & Mobile).
- **First Contentful Paint (FCP):** < 1.2s.
- **API Response Time:** < 300ms cho các request thông thường, < 50ms cho Socket events.

## 2. Scalability
- **Concurrency:** Hệ thống phải xử lý được 500 người dùng chọn ghế cùng lúc (trên 1 rạp) mà không bị treo.
- **Horizontal Scaling:** Backend NestJS không lưu State (Stateless), cho phép scale ra nhiều instance.

## 3. Reliability & Availability
- **Uptime:** 99.5% (Dựa trên cam kết của Vercel/Railway).
- **Seat Stability:** Không bao giờ xảy ra tình trạng mất ghế đã lock sau khi F5 trang.

## 4. SEO & Accessibility
- **SEO:** Metadata động cho từng phim. Semantic HTML (h1, h2, article).
- **Accessibility (A11y):** Tỷ lệ tương phản màu sắc cao, hỗ trợ điều hướng bằng bàn phím (Tab-focus), Aria-labels cho các icon buttons.

## 5. Observability (Giám sát)
- **Logging:** Sử dụng Winston (Backend) để log lỗi vào console, tích hợp Sentry cho Production error tracking.
- **Analytics:** Google Analytics 4 để theo dõi hành vi người dùng, PostHog cho session replay (giúp debug UI).

## 6. Maintainability
- **Code Style:** Tuân thủ ESLint (Prettier), kiến trúc Modular chặt chẽ.
- **Documentation:** Luôn cập nhật API spec (Postman/Redoc) khi thay đổi endpoint.
