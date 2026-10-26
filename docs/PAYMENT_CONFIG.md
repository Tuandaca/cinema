# Tài Liệu Cấu Hình Thanh Toán CoiCine (Payment Configuration Guide)

> **Dự án**: CoiCine — Nền tảng đặt vé xem phim trực tuyến  
> **Phiên bản tài liệu**: 2.0 (Cập nhật 2026-10-26)  
> **Phân hệ**: VietQR Napas 247, Stripe Live & Sandbox, PayOS Gateway

---

## 1. Tổng Quan Kiến Trúc Thanh Toán (Payment Architecture)

Hệ thống thanh toán CoiCine được thiết kế theo mô hình **Đa cổng (Multi-Gateway)** với cơ chế phục hồi tự động (Resilient Fallback), hỗ trợ đồng thời các kênh thanh toán phổ biến tại Việt Nam và quốc tế:

1. **VietQR Napas 247 (Chuyển khoản ngân hàng tức thì)**: Tự động sinh mã QR chuẩn EMVCo của liên minh ngân hàng Napas 247. Hỗ trợ quét mã bằng hơn 40 ứng dụng ngân hàng (VCB, MB, Techcombank, VietinBank...) và ví điện tử (MoMo, ZaloPay, Viettel Money).
2. **Stripe Live & Test (Thẻ quốc tế Visa/Mastercard)**: Tích hợp Stripe API với cơ chế nhận diện tiền tệ `vnd` (Zero-Decimal Currency) và Webhook tự động cập nhật trạng thái đơn vé sang `PAID`.
3. **PayOS Gateway (Đối soát & Webhook ngân hàng tự động)**: Giải pháp cổng thanh toán Open Banking Việt Nam với webhook đồng bộ tự động khi tài khoản ngân hàng nhận được tiền.
4. **Cơ chế Dev Mock Fallback**: Khi các khóa API chưa được cấu hình hoặc trong môi trường phát triển cục bộ, hệ thống tự động kích hoạt Mock Mode an toàn, cho phép kiểm thử toàn bộ luồng thanh toán mà không làm gián đoạn hay gây lỗi runtime.

---

## 2. Cấu Hình VietQR Napas 247

### 2.1 Chuẩn Sinh Mã VietQR QuickLink (EMVCo Standard)
VietQR sử dụng chuẩn định tuyến Napas 247 qua QuickLink URL có định dạng:
```
https://img.vietqr.io/image/<BANK_BIN>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<TRANSFER_SYNTAX>&accountName=<ACCOUNT_NAME>
```

### 2.2 Các Tham Số Cấu Hình Chi Tiết

| Biến Môi Trường | Mô Tả | Giá Trị Mặc Định CoiCine | Ghi Chú |
|---|---|---|---|
| `VIETQR_BANK_ID` (hoặc `BANK_BIN`) | Mã định danh ngân hàng (BIN) theo chuẩn Napas | `970436` (Vietcombank) | Xem bảng mã BIN các ngân hàng bên dưới |
| `VIETQR_ACCOUNT_NO` (hoặc `ACCOUNT_NO`) | Số tài khoản ngân hàng thụ hưởng | `1028472918` | Số tài khoản của rạp/công ty |
| `VIETQR_ACCOUNT_NAME` (hoặc `ACCOUNT_NAME`) | Tên chủ tài khoản thụ hưởng | `CONG TY TNHH COICINE VIETNAM` | Viết hoa không dấu hoặc URL-encoded |
| `VIETQR_TEMPLATE` | Mẫu hiển thị đồ họa của ảnh VietQR | `compact2` | Các mẫu: `compact2`, `compact`, `qr_only`, `print` |

### 2.3 Bảng Mã BIN (Bank Identification Number) Các Ngân Hàng Phổ Biến

| Ngân Hàng | Mã BIN Napas | Mã Viết Tắt (Shortcode) |
|---|---|---|
| **Vietcombank (VCB)** | `970436` | `VCB` |
| **MBBank (Ngân hàng Quân Đội)** | `970422` | `MB` |
| **Techcombank (TCB)** | `970407` | `TCB` |
| **VietinBank (ICB)** | `970415` | `ICB` |
| **VPBank** | `970432` | `VPB` |
| **BIDV** | `970418` | `BIDV` |
| **ACB (Á Châu)** | `970416` | `ACB` |
| **TPBank** | `970423` | `TPB` |
| **Sacombank** | `970403` | `STB` |
| **HDBank** | `970437` | `HDB` |

### 2.4 Quy Tắc Định Dạng Số Tiền & Cú Pháp Chuyển Khoản
- **Số tiền (`amount`)**: Bắt buộc là số nguyên VNĐ không có phần thập phân hay dấu phân cách (Ví dụ: `160000`, không dùng `160.000` hay `160000.00`).
- **Nội dung chuyển khoản (`addInfo`)**:
  - Cú pháp chuẩn: `COICINE-${bookingId.slice(0, 8).toUpperCase()}` (Ví dụ: `COICINE-9A2F7D18`).
  - Đảm bảo độ dài dưới 25 ký tự để tương thích với tất cả các cổng Core Banking của các ngân hàng nội địa.

---

## 3. Cấu Hình Stripe (Thẻ Quốc Tế & Live Webhook)

### 3.1 Các Tham Số Khóa API Stripe

| Biến Môi Trường | Môi Trường Áp Dụng | Mô Tả | Định Dạng Mẫu |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Backend (`apps/api/.env`) | Khóa bí mật giao tiếp với Stripe API | `your-stripe-secret-key` |
| `STRIPE_WEBHOOK_SECRET` | Backend (`apps/api/.env`) | Khóa ký số xác thực webhook từ Stripe | `your-stripe-webhook-secret` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Frontend (`apps/web/.env.local`) | Khóa công khai khởi tạo Stripe Elements | `your-stripe-publishable-key` |

### 3.2 ⚠️ Quy Tắc Tiền Tệ Zero-Decimal Đối Với Đồng Việt Nam (`vnd`)
Trong hệ thống Stripe API, tiền tệ `vnd` (Việt Nam Đồng) thuộc nhóm **Zero-Decimal Currency** (tiền tệ không có số thập phân/xu/cents):
- **Quy tắc tuyệt đối**: Số tiền gửi lên Stripe bằng đúng giá trị tiền tệ thực tế:
  ```typescript
  // ĐÚNG:
  const amount = Math.round(booking.totalAmount); // 160000 VNĐ -> amount = 160000

  // SAI (CẤM NHÂN 100):
  // const amount = Math.round(booking.totalAmount * 100); // Sẽ dẫn đến trừ 16.000.000 VNĐ!
  ```

### 3.3 Thiết Lập Stripe Webhook Cho Production
1. Đăng nhập vào [Stripe Dashboard](https://dashboard.stripe.com/webhooks).
2. Thêm endpoint mới:
   - **URL**: `https://api.yourdomain.com/api/payment/webhook`
   - **Phiên bản API**: `2024-12-18.acacia` (hoặc mới nhất)
   - **Sự kiện cần lắng nghe (Events to listen)**:
     * `payment_intent.succeeded`
     * `checkout.session.completed`
3. Lấy mã `Signing secret` (bắt đầu bằng `whsec_...`) và điền vào biến `STRIPE_WEBHOOK_SECRET`.
4. Trong quá trình phát triển cục bộ, sử dụng Stripe CLI để chuyển tiếp sự kiện:
   ```powershell
   stripe listen --forward-to localhost:3006/api/payment/webhook
   ```

---

## 4. Cấu Hình PayOS (Tự Động Đối Soát Chuyển Khoản Ngân Hàng)

PayOS cho phép kết nối tài khoản ngân hàng cá nhân hoặc doanh nghiệp để tự động bắn webhook khi nhận được tiền chuyển khoản tương ứng với mã đơn đặt vé.

### 4.1 Các Tham Số Cấu Hình

| Biến Môi Trường | Môi Trường | Mô Tả |
|---|---|---|
| `PAYOS_CLIENT_ID` | Backend (`apps/api/.env`) | Mã định danh khách hàng PayOS |
| `PAYOS_API_KEY` | Backend (`apps/api/.env`) | Khóa API truy cập dịch vụ PayOS |
| `PAYOS_CHECKSUM_KEY` | Backend (`apps/api/.env`) | Khóa bí mật tạo và kiểm tra chữ ký mã hóa SHA256 |

### 4.2 Thiết Lập Webhook PayOS
- Truy cập bảng điều khiển PayOS > Kênh thanh toán > Cài đặt Webhook.
- Nhập Webhook URL: `https://api.yourdomain.com/api/payment/payos/webhook`.
- Hệ thống CoiCine sẽ kiểm tra `signature` từ `PAYOS_CHECKSUM_KEY` trước khi cập nhật đơn vé thành `PAID`.

---

## 5. Bảng Tổng Hợp Biến Môi Trường (Environment Variable Matrix)

### Backend (`apps/api/.env`)
```env
# ==========================================
# 💳 PAYMENT CONFIGURATION (apps/api/.env)
# ==========================================

# --- VietQR Napas 247 Settings ---
VIETQR_BANK_ID="970436"
VIETQR_ACCOUNT_NO="1028472918"
VIETQR_ACCOUNT_NAME="CONG TY TNHH COICINE VIETNAM"
VIETQR_TEMPLATE="compact2"

# Alias compatibility
BANK_BIN="970436"
ACCOUNT_NO="1028472918"
ACCOUNT_NAME="CONG TY TNHH COICINE VIETNAM"

# --- Stripe Live / Test Settings ---
# Bỏ trống hoặc để chuỗi chứa "placeholder" để chạy chế độ Dev Mock Fallback
STRIPE_SECRET_KEY="your-stripe-secret-key-or-leave-empty-for-mock"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"

# --- PayOS Gateway Settings (Tùy chọn) ---
PAYOS_CLIENT_ID="your-payos-client-id"
PAYOS_API_KEY="your-payos-api-key"
PAYOS_CHECKSUM_KEY="your-payos-checksum-key"
```

### Frontend (`apps/web/.env.local`)
```env
# ==========================================
# 💳 PAYMENT CONFIGURATION (apps/web/.env.local)
# ==========================================

# --- Stripe Frontend Settings ---
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

---

## 6. Hướng Dẫn Kiểm Thử & Nghiệm Thu (Verification Checklist)

1. **Kiểm tra hiển thị VietQR tại `/checkout`**:
   - Chọn suất chiếu và ghế > Chuyển đến màn hình `/checkout`.
   - Bấm vào tab "VietQR" > Bấm "Tạo mã VietQR thanh toán".
   - Xác nhận ảnh VietQR hiển thị rõ nét với logo Vietcombank, Napas 247, đúng số tiền VNĐ và nội dung `COICINE-[MÃ_ĐƠN]`.
   - Nhấn nút "Sao chép" ở từng trường (Số tài khoản, Số tiền, Cú pháp) > Xác nhận xuất hiện thông báo toast "Đã sao chép...".
   - Dùng camera điện thoại hoặc app ngân hàng thật quét mã > Kiểm tra thông tin tự động điền đúng 100%.

2. **Kiểm tra loại bỏ ký tự dollar ($) và định dạng VNĐ**:
   - Đảm bảo toàn bộ giá tiền hiển thị dạng `160.000 đ`, `65.000 đ` thay vì `$X.XX`.

3. **Kiểm tra quản lý vé tại `/profile/tickets`**:
   - Sau khi thanh toán, chuyển sang `/profile/tickets`.
   - Kiểm tra 3 tab "Vé sắp tới", "Vé đã xem / Hết hạn", "Tất cả" hiển thị số lượng vé chính xác.
   - Kiểm tra các số liệu: Phim đã xem (chỉ tính suất chiếu đã qua), Tổng chi tiêu (định dạng VNĐ), Vé sắp tới.
   - Thử bấm nút sao chép mã đơn và nút "Xem vé điện tử / QR".
