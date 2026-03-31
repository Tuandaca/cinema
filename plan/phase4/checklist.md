# Checklist Phase 4: Real-time Seat Booking System
# Kiểm tra Giai đoạn 4: Hệ thống Đặt ghế (Real-time)

- [ ] Cấu hình Socket.io Gateway (NestJS)
- [ ] Setup Socket.io Client & Context (Next.js)
- [ ] API lấy danh sách ghế theo Suất chiếu (Showtime)
- [ ] UI Sơ đồ ghế (Grid rendering)
- [ ] Logic Lock ghế tạm thời bằng Redis (SETNX)
- [ ] WebSocket event: `seat_selecting` (Broadcast cho User khác)
- [ ] WebSocket event: `seat_locked` (Giữ ghế tạm thời)
- [ ] Xử lý Timeout giải phóng ghế (Redis TTL)
- [ ] Logic Pulse animations cho Selecting seats
- [ ] Xử lý Edge Case: User thoát đột ngột (Socket disconnect lock cleanup)
