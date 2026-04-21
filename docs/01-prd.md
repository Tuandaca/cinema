# 01. Product Requirements Document (PRD) - CoiCine (Modern Cinema Web App)

## 1. Product Vision (Tầm nhìn sản phẩm)
Xây dựng **CoiCine** - một nền tảng đặt vé xem phim hiện đại, mượt mà và thông minh, giúp người dùng không chỉ đặt vé nhanh chóng mà còn nhận được sự hỗ trợ cá nhân hóa từ AI, mang lại trải nghiệm điện ảnh trọn vẹn từ lúc chọn phim đến khi vào rạp.

## 2. Business Goals (Mục tiêu kinh doanh)
- Tối ưu hóa quy trình đặt vé và chọn combo thức ăn.
- Tăng tỷ lệ chuyển đổi thông qua hệ thống gợi ý phim thông minh bằng AI.
- Giảm tải cho bộ phận chăm sóc khách hàng nhờ trợ lý ảo AI hỗ trợ đặt vé 24/7.
- Xây dựng hệ thống quản lý rạp phim tập trung và dễ sử dụng cho Admin.

## 3. Problem Statement (Vấn đề cần giải quyết)
- Quy trình chọn ghế và đặt vé truyền thống thường chậm và dễ xảy ra tình trạng trùng lặp (race condition).
- Người dùng thường gặp khó khăn trong việc chọn phim phù hợp với tâm trạng.
- Các hệ thống hiện tại thiếu tích hợp thông minh giữa đặt vé và tư vấn trực tiếp.

## 4. User Personas (Chân dung người dùng)
- **Minh (22 tuổi - Sinh viên):** Thích xem phim hành động, thường đặt vé qua điện thoại, muốn quy trình nhanh và có nhiều ưu đãi.
- **Linh (30 tuổi - Nhân viên văn phòng):** Thích xem phim rạp cuối tuần với gia đình, cần hệ thống lọc phim theo giờ rảnh và đề xuất phim nhẹ nhàng.
- **Admin (Quản lý rạp):** Cần theo dõi doanh thu thực tế và quản lý suất chiếu linh hoạt.

## 5. Feature Scope (Phạm vi tính năng)

### 5.1. MVP Features (Tính năng cốt lõi)
- Đăng ký/Đăng nhập (JWT).
- Xem danh sách phim (Đang chiếu/Sắp chiếu).
- Chi tiết phim & Trailer (YouTube embed).
- Chọn suất chiếu & chọn ghế Real-time với Socket.io.
- Đặt vé & Đặt Combo (Bắp nước).
* Thanh toán (Simulated Payment).
- Lịch sử đặt vé.

### 5.2. Advanced Features (Tính năng nâng cao)
- **AI Chatbot:** Tư vấn phim dựa trên cảm xúc (Mood-based).
- **AI Auto-booking:** Hỗ trợ tìm suất chiếu và giữ ghế qua câu lệnh chat.
- **Cinematic UI (Dark Mode):** Giao diện tối sang trọng, giảm mỏi mắt, hiệu ứng chuyển cảnh mượt mà.
- **Multi-language (EN/VI):** Hỗ trợ chuyển đổi ngôn ngữ linh hoạt cho người dùng quốc tế.
- **Smart Invoice:** Xuất hóa đơn vé PDF có mã QR.

## 6. Success KPIs
- **Thời gian đặt vé trung bình:** Dưới 2 phút.
- **Tỷ lệ giữ ghế thành công:** 99.9% (Không trùng lặp).
- **Mức độ hài lòng với AI:** > 4/5 điểm (Dựa trên feedback).

## 7. Technical Constraints & Free-tier Limitations
- **Database (Supabase):** Giới hạn 500MB (Cần tối ưu hóa lưu trữ text).
- **Redis (Upstash):** Giới hạn request/day (Sử dụng chủ yếu cho Locking).
- **Vercel/Railway:** Giới hạn thời gian execution cho serverless functions.
- **OpenAI:** Chi phí theo token (Cần Prompt Engineering tốt để tiết kiệm).

## 8. Monetization & Scaling Ideas
- **Monetization:** Phí dịch vụ đặt vé, bán quảng cáo trên banner, membership ưu tiên.
- **Scaling:** Chuyển sang Microservices, sử dụng Kubernetes cho Backend, mở rộng Multi-region cho Database.
