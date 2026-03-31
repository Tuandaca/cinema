# Phase 4: Real-time Seat Booking System
# Giai đoạn 4: Hệ thống Đặt ghế (Real-time)

## 📝 Mô tả chi tiết (Detailed Description)
Triển khai logic cốt lõi của ứng dụng cinema: Sơ đồ ghế ngồi động và cơ chế giữ ghế thời gian thực để ngăn chặn việc hai khách hàng cùng thanh toán cho một ghế.

## 🔍 Phạm vi thực hiện (Scope)

### 1. Real-time Infrastructure
- Thiết lập Socket.io Gateway phía Backend NestJS.
- Tích hợp Socket.io Client phía Frontend Next.js.
- Cấu hình Upstash Redis để quản lý Distributed Locking.

### 2. Seat Selection Experience
- Render sơ đồ ghế từ API Room/Seat (Grid layout linh hoạt).
- Trạng thái ghế: Available (Trống), Selecting (Đang chọn), Reserved (Đã giữ), Sold (Đã bán).
- Hiệu ứng Pulse/Neon khi người dùng khác đang chọn ghế để tăng tính tương tác.

### 3. Locking Logic (Concurrency)
- API `lock-seat`: Sử dụng Redis SETNX để giữ ghế trong 5-10 phút.
- Tự động giải phóng ghế sau khi hết hạn (TTL) hoặc khi User hủy chọn.
- Xử lý các trường hợp mất kết nối Socket (Cleanup locks).

---
> **Lưu ý:** Xem chi tiết tiến độ tại [checklist.md](./checklist.md).
