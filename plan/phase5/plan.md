# Phase 5: Order & Payment Integration
# Giai đoạn 5: Tích hợp Đơn hàng & Thanh toán

## 📝 Mô tả chi tiết (Detailed Description)
Hoàn thiện chu kỳ thanh toán đơn hàng. Bao gồm việc chọn thêm dịch vụ đi kèm (Combo) và xác thực giao dịch an toàn để chốt vé vĩnh viễn.

## 🔍 Phạm vi thực hiện (Scope)

### 1. Combo & Cart System
- Module quản lý Combo (Bắp, nước, quà tặng).
- Order Summary: Hiển thị chi tiết tiền vé + tiền combo + phí VAT.
- Lưu trạng thái Order tạm thời vào Database/Redis trước khi thanh toán.

### 2. Payment Gateway
- Tích hợp Stripe API (Gói thanh toán mô phỏng hoặc thực tế).
- Xử lý Webhook từ Stripe để nhận diện giao dịch thành công/thất bại phía Backend.
- Logic "Xác nhận vé" sau thanh toán: Chuyển Seat status sang `SOLD` và gửi thông báo.

### 3. Smart Invoice & QR
- Generate file vé (PDF hoặc Ảnh) chứa QR Code định danh duy nhất.
- Gửi Email xác nhận tự động thông qua Resend/Nodemailer.

---
> **Lưu ý:** Xem chi tiết tiến độ tại [checklist.md](./checklist.md).
