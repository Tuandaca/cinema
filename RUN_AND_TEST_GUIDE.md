# 🎬 HƯỚNG DẪN VẬN HÀNH & KIỂM THỬ THỦ CÔNG TOÀN DIỆN - COICINE

> **Dự án**: CoiCine - Nền Tảng Đặt Vé Xem Phim & Phân Hệ Quản Trị Cao Cấp  
> **Cập nhật ngày**: 16/09/2026 | **Tác giả**: cinemaAgent  
> **Phiên bản hoàn thiện**: Phase 1 → Phase 7 (100% Zero-Defect)

---

## 📌 MỤC LỤC
1. [Thiết Lập Môi Trường & Khởi Động Dự Án](#1-thiết-lập-môi-trường--khởi-động-dự-án)
2. [Thông Tin Tài Khoản Kiểm Thử](#2-thông-tin-tài-khoản-kiểm-thử)
3. [Kiểm Thử Phân Hệ Quản Trị (Admin Dashboard - Phase 7)](#3-kiểm-thử-phân-hệ-quản-trị-admin-dashboard)
4. [Kiểm Thử Luồng Người Dùng & Đặt Vé (Customer Booking Flow)](#4-kiểm-thử-luồng-người-dùng--đặt-vé-customer-booking-flow)
5. [Kiểm Thử Trợ Lý Ảo AI (AI Assistant Chatbot - Phase 6)](#5-kiểm-thử-trợ-lý-ảo-ai-ai-assistant-chatbot)
6. [Xử Lý Sự Cố Thường Gặp (Troubleshooting & FAQ)](#6-xử-lý-sự-cố-thường-gặp-troubleshooting--faq)

---

## 1. Thiết Lập Môi Trường & Khởi Động Dự Án

### ⚙️ Cổng mạng (Port Mapping):
- **Backend NestJS**: `http://localhost:3006` (Prefix: `/api`)
- **Frontend Next.js**: `http://localhost:3000`
- **Database**: Supabase PostgreSQL (Cloud)

---

### 🚀 Cách 1: Khởi động 2 Terminal riêng biệt (Khuyên dùng khi debug)

Mở **2 cửa sổ Terminal (PowerShell hoặc CMD)** tại thư mục gốc dự án: `D:\Projects\cinema`

#### 🖥️ Terminal 1 — Khởi động Backend (Port 3006):
```bash
cd D:\Projects\cinema\apps\api
pnpm dev
```
> Hoặc từ thư mục gốc:
> ```bash
> pnpm --filter api dev
> ```
✅ **Dấu hiệu thành công**:
```text
[NestApplication] Nest application successfully started
[Bootstrap] 🚀 Application is running on: http://127.0.0.1:3006
[Bootstrap] 🔒 CORS allowed origins: http://localhost:3000, ...
```

---

#### 🌐 Terminal 2 — Khởi động Frontend (Port 3000):
```bash
cd D:\Projects\cinema\apps\web
pnpm dev
```
> Hoặc từ thư mục gốc:
> ```bash
> pnpm --filter web dev
> ```
✅ **Dấu hiệu thành công**:
```text
   ▲ Next.js 15.1.0
   - Local:        http://localhost:3000
 ✓ Starting...
 ✓ Ready in ...s
```

---

### ⚡ Cách 2: Khởi động toàn bộ Monorepo bằng 1 lệnh duy nhất
Tại thư mục gốc `D:\Projects\cinema`:
```bash
pnpm dev
```
Turborepo sẽ tự động chạy song song cả `apps/api` và `apps/web`.

---

## 2. Thông Tin Tài Khoản Kiểm Thử

Hệ thống đã được seed sẵn 2 tài khoản với 2 cấp độ phân quyền (RBAC) khác nhau:

| Vai trò | Email đăng nhập | Mật khẩu | Quyền hạn |
|:---|:---|:---|:---|
| **Quản trị viên (Admin)** | `admin@coicine.com` | `Admin@123` | **Toàn quyền Quản trị**: Truy cập `/admin`, xem doanh thu, CRUD phim, lập lịch suất chiếu, quản lý sơ đồ ghế, duyệt đơn vé. |
| **Khách hàng (User)** | `guest@coicine.com` | `Admin@123` | **Khách xem phim**: Đặt vé, chọn ghế, thanh toán, trò chuyện với AI. Bị chặn nếu cố vào `/admin`. |

> 💡 **Tạo thêm tài khoản mới**: Bạn có thể vào [`http://localhost:3000/auth/register`](http://localhost:3000/auth/register) để tạo bất kỳ tài khoản khách hàng mới nào (tài khoản tạo qua trang đăng ký sẽ mặc định có vai trò `USER`).

---

## 3. Kiểm Thử Phân Hệ Quản Trị (Admin Dashboard)

Mở trình duyệt truy cập: [`http://localhost:3000`](http://localhost:3000)

---

### 🛡️ 3.1. Test Phân Quyền & Hàng Rào Bảo Mật (RBAC Guard)

1. **Test chặn khách chưa đăng nhập**:
   - Mở cửa sổ **Ẩn danh (Incognito)**, nhập thẳng URL: `http://localhost:3000/admin`.
   - ✅ **Kết quả**: `AdminGuard` lập tức chặn và điều hướng về `http://localhost:3000/auth/login?callbackUrl=%2Fadmin`.
2. **Test chặn tài khoản thường (`USER`)**:
   - Đăng nhập bằng `guest@coicine.com` / `Admin@123`.
   - Cố tình gõ URL `http://localhost:3000/admin` vào thanh địa chỉ.
   - ✅ **Kết quả**: Màn hình đỏ xuất hiện cảnh báo **"Truy Cập Bị Từ Chối"** (*Tài khoản của bạn không có quyền Quản trị viên*). Không thể xem dữ liệu rạp.
3. **Test cấp quyền Quản trị (`ADMIN`)**:
   - Đăng xuất và đăng nhập bằng `admin@coicine.com` / `Admin@123`.
   - Bấm vào menu profile trên Header góc phải -> Chọn **"Admin Dashboard"** (hoặc vào `http://localhost:3000/admin`).
   - ✅ **Kết quả**: Truy cập thành công vào giao diện Quản trị Dark Mode CoiCine.

---

### 📊 3.2. Test Trang Tổng Quan (`http://localhost:3000/admin`)

1. **4 Thẻ Chỉ Số KPI**:
   - Kiểm tra **Tổng Doanh Thu** (định dạng VNĐ chuẩn, tính từ các đơn `PAID`).
   - Kiểm tra **Số Vé Đã Bán**, **Phim Đang Chiếu**, **Tỷ Lệ Lấp Đầy Rạp (%)**.
2. **Biểu Đồ Doanh Thu 7 Ngày**:
   - Rê chuột vào từng cột ngày trong biểu đồ để xem doanh thu chi tiết và số vé bán ra.
3. **Top Phim & Đơn Đặt Vé Mới Nhất**:
   - Bảng xếp hạng 5 phim có doanh thu cao nhất.
   - Bảng 10 giao dịch đặt vé gần nhất kèm badge trạng thái (`PAID`, `PENDING`, `CANCELLED`).
4. **Nút Làm Mới Dữ Liệu**:
   - Bấm nút **"Làm mới dữ liệu"** có icon xoay để cập nhật realtime các chỉ số.

---

### 🎬 3.3. Test Quản Lý Phim (`http://localhost:3000/admin/movies`)

1. **Tìm Kiếm & Bộ Lọc**:
   - Gõ tên phim vào ô tìm kiếm (ví dụ: *"Dune"*, *"Avatar"*, *"Spider"*).
   - Đổi dropdown trạng thái sang *Đang Chiếu* hoặc *Sắp Chiếu* để xem danh sách cập nhật.
2. **Thêm Phim Mới**:
   - Bấm nút **"+ Thêm Phim Mới"** (màu vàng kim).
   - Nhập thông tin:
     - Tên phim: `Avengers: Secret Wars`
     - Mô tả: `Trận chiến đa vũ trụ đỉnh cao của Marvel Studios.`
     - Trạng thái: `Đang Chiếu (NOW_SHOWING)`
     - Thời lượng: `150` phút
     - Điểm đánh giá: `9.4`
     - Thể loại: `Hành Động, Viễn Tưởng`
   - Bấm **"Tạo Phim"**.
   - ✅ **Kết quả**: Phim mới xuất hiện ngay trên đầu bảng danh mục.
3. **Chỉnh Sửa Phim**:
   - Bấm icon **Cây bút (Edit)** tại dòng phim vừa tạo.
   - Sửa điểm đánh giá thành `9.8` -> Bấm **"Cập Nhật"**.
   - ✅ **Kết quả**: Thông tin cập nhật ngay trên giao diện.
4. **Đồng Bộ Phim TMDB / Trakt**:
   - Bấm nút **"Sync TMDB / Trakt"** trên thanh tiêu đề.
   - Nút sẽ xoay loading và thông báo số lượng phim xu hướng vừa được nạp vào cơ sở dữ liệu.

---

### 🕒 3.4. Test Lập Lịch Suất Chiếu & Chống Trùng Giờ (`http://localhost:3000/admin/showtimes`)

1. **Tạo Suất Chiếu Hợp Lệ**:
   - Bấm nút **"+ Tạo Suất Chiếu"**.
   - Chọn Phim: `Avengers: Secret Wars` (thời lượng 150 phút).
   - Chọn Phòng Chiếu: `Premium Cinema 01`.
   - Chọn Ngày & Giờ Bắt Đầu: Chọn ngày mai lúc `18:00`.
   - Quan sát hệ thống tự tính: *"Dự kiến kết thúc: 20:45 (+ 15p dọn phòng)"*.
   - Giá vé cơ sở: `90,000 đ`. Bấm **"Lưu Suất Chiếu"**.
   - ✅ **Kết quả**: Suất chiếu được lưu thành công vào cơ sở dữ liệu.
2. **🔥 KIỂM THỬ BẪY VA CHẠM (Collision Detection)**:
   - Tiếp tục bấm **"+ Tạo Suất Chiếu"**.
   - Vẫn chọn phòng `Premium Cinema 01`.
   - Cố tình chọn giờ bắt đầu lúc `19:00` (nằm giữa khoảng 18:00 - 20:45 của suất trước).
   - Bấm **"Lưu Suất Chiếu"**.
   - ✅ **Kết quả**: Hệ thống chặn đứng và báo lỗi màu đỏ:
     > *"Trùng lịch chiếu tại phòng Premium Cinema 01! Suất Avengers: Secret Wars đang diễn ra từ 18:00 đến 20:45."*
3. **Thử xếp vào phòng khác**:
   - Giữ nguyên giờ `19:00`, đổi phòng sang `IMAX Experience` -> Bấm Lưu.
   - ✅ **Kết quả**: Lưu thành công (cho phép 2 phòng khác nhau chiếu cùng một khung giờ).

---

### 🏛️ 3.5. Test Sơ Đồ Phòng & Ghế (`http://localhost:3000/admin/theaters`)

1. Bấm menu **"Phòng & Ghế"** trên thanh Sidebar.
2. Chọn giữa **"Premium Cinema 01"** (24 ghế) và **"IMAX Experience"** (32 ghế).
3. Quan sát trực quan sơ đồ phòng:
   - Vòng cung ánh vàng tượng trưng cho **MÀN HÌNH CHIẾU**.
   - Ghế Thường: Màu xám bạc (hệ số giá `1.0x`).
   - Ghế VIP: Màu vàng kim (hệ số giá `1.5x`).
   - Ghế Sweetbox Đôi: Màu hồng đỏ tình nhân (hệ số giá `2.0x`).
4. Bấm vào một ghế bất kỳ -> Thanh thông báo chi tiết mã ghế và phân loại xuất hiện.

---

### 🎟️ 3.6. Test Quản Lý Đơn Vé (`http://localhost:3000/admin/bookings`)

1. Bấm menu **"Đơn Đặt Vé"**.
2. Tìm kiếm đơn vé theo mã đơn hoặc email khách hàng.
3. Bấm icon **Con Mắt (Xem chi tiết)** trên một đơn vé:
   - Xem thông tin người đặt, tên phim, phòng chiếu, giờ chiếu.
   - Xem chi tiết từng số ghế, giá vé đã tính hệ số VIP, combo bắp nước.
4. Bấm **"Đánh dấu PAID"** hoặc **"Hủy Đơn"** để cập nhật trạng thái đơn vé theo thời gian thực.

---

## 4. Kiểm Thử Luồng Người Dùng & Đặt Vé (Customer Booking Flow)

Mở tab mới truy cập trang chủ: [`http://localhost:3000`](http://localhost:3000)

### 4.1. Khám Phá Phim & Chọn Suất Chiếu
1. Tại Trang Chủ, quan sát Banner phim bom tấn và danh sách phim Đang Chiếu.
2. Bấm vào một bộ phim (ví dụ: *Dune: Part Two* hoặc *Deadpool & Wolverine*).
3. Xem trang chi tiết phim: Trailer YouTube nhúng, điểm IMDb, thời lượng, diễn viên.
4. Cuộn xuống phần **Lịch Chiếu**:
   - Chọn ngày chiếu mong muốn.
   - Bấm vào một khung giờ chiếu (ví dụ: `19:30` - `IMAX Experience`).

---

### 4.2. Chọn Ghế Real-time & Two-Phase Locking
1. Hệ thống chuyển sang trang sơ đồ ghế: `http://localhost:3000/movies/[id]/booking?showtimeId=...`.
2. **Chọn ghế**:
   - Bấm chọn 1 ghế Thường (ví dụ: `A3`) -> Ghế chuyển màu xanh lục kèm hiệu ứng chọn.
   - Bấm chọn 1 ghế VIP (ví dụ: `B4`) -> Tổng tiền tự động nhân hệ số `1.5x`.
3. **Đồng hồ đếm ngược (Countdown Timer)**:
   - Quan sát đồng hồ giữ ghế đếm lùi `05:00` phút ở góc màn hình.
4. **Test Real-time WebSocket (Tùy chọn nếu mở 2 trình duyệt)**:
   - Mở thêm 1 trình duyệt khác vào cùng suất chiếu -> Ghế đang được chọn ở trình duyệt 1 sẽ hiển thị trạng thái `Đang chọn / Đã khóa` ở trình duyệt 2.
5. Bấm nút **"Tiếp Tục Thanh Toán"**.

---

### 4.3. Chọn Combo Bắp Nước & Thanh Toán (Checkout)
1. **Trang Giỏ Hàng & Combo**:
   - Thêm combo: *Bắp Rang Bơ Phô Mai* hoặc *Nước Ngọt*.
   - Quan sát tổng tiền cập nhật chính xác.
2. **Chọn phương thức thanh toán**:
   - **Cách A - Thẻ tín dụng/ghi nợ**: Chọn tab Thẻ -> Nhập thẻ test.
   - **Cách B - Quét mã QR**: Chọn tab VietQR -> Quét hoặc bấm xác nhận.
   - **Cách C - Thanh toán thử nghiệm (Mock Pay)**: Bấm nút xác nhận thanh toán giả lập.
3. Bấm **"Thanh Toán Ngay"**.
4. ✅ **Kết quả**: Hệ thống xử lý giao dịch, chuyển trạng thái đơn hàng sang `PAID` và chuyển hướng sang trang vé điện tử.

---

### 4.4. Trang Vé Điện Tử (`/checkout/success`)
1. Xem thông tin vé thật vừa tạo:
   - Mã vé (Booking ID), Mã QR vé điện tử.
   - Tên phim, phòng chiếu, ngày giờ chiếu, danh sách ghế đã chọn.
2. Bấm nút **"In Vé / Tải PDF"**:
   - Hộp thoại in của trình duyệt xuất hiện với định dạng in vé rạp chuyên nghiệp.
3. Quay lại trang Admin (`/admin/bookings`) -> Đơn vé vừa đặt hiển thị ngay lập tức với trạng thái `PAID` màu xanh!

---

## 5. Kiểm Thử Trợ Lý Ảo AI (AI Assistant Chatbot)

1. Tại bất kỳ trang nào của giao diện người dùng, nhìn vào góc dưới cùng bên phải.
2. Bấm vào icon **Chatbot CoiCine AI**.
3. Cửa sổ chat Dark Mode mở ra. Thử gửi các câu hỏi:
   - *"Hôm nay rạp có những phim nào đang hot?"*
   - *"Gợi ý cho tôi một bộ phim hành động gay cấn kèm suất chiếu tối nay."*
   - *"Giá vé rạp mình tính như thế nào?"*
4. ✅ **Kết quả**: AI sử dụng mô hình Gemini 2.5 Flash kết hợp Tool Calling để tra cứu danh mục phim và suất chiếu thật từ cơ sở dữ liệu và trả lời bằng tiếng Việt tự nhiên, chính xác.

---

## 6. Xử Lý Sự Cố Thường Gặp (Troubleshooting & FAQ)

### ❓ 1. Lỗi cổng bị chiếm dụng (Port 3000 hoặc 3006 already in use)
Mở PowerShell với quyền Administrator và chạy:
```powershell
# Tìm và tắt các tiến trình Node.js còn chạy ngầm
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```
Sau đó khởi động lại bằng lệnh `pnpm dev`.

---

### ❓ 2. Lỗi không kết nối được Database Supabase (`P1001` hoặc DNS)
- **Nguyên nhân**: Supabase gói Free có thể tự động tạm dừng (Pause) sau vài ngày không có truy cập, hoặc mạng chặn DNS IPv6.
- **Cách khắc phục**:
  1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard).
  2. Bấm nút **"Restore"** hoặc **"Resume Project"** nếu dự án đang tạm dừng.
  3. Kiểm tra file `apps/api/.env` xem chuỗi `DATABASE_URL` đã chính xác chưa.

---

### ❓ 3. Lỗi không tải được giao diện Admin hoặc báo 404
- Đảm bảo Backend đang chạy tại `http://localhost:3006`.
- Đảm bảo bạn đã đăng nhập tài khoản `admin@coicine.com`. Nếu token hết hạn, bấm Đăng xuất rồi đăng nhập lại.

---

### ❓ 4. Chạy lại toàn bộ bộ kiểm thử tự động (Automated Test Suites)
Nếu muốn kiểm tra tự động toàn bộ hệ thống bằng 1 câu lệnh:
```bash
# Chạy toàn bộ 7 test suites (Unit + E2E Integration)
cd D:\Projects\cinema\apps\api
pnpm test
```
✅ Kết quả mong đợi: **7 passed, 7 total (100% PASS - 29/29 tests)**.

---

🎉 **Chúc bạn có trải nghiệm kiểm thử tuyệt vời với hệ thống CoiCine!**
