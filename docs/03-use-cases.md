# 03. Use Cases Specifications

## Use Case ID: UC-01
**Title:** Xem phim và suất chiếu
- **Actor:** Guest, Registered User
- **Preconditions:** Hệ thống đã có dữ liệu phim và suất chiếu.
- **Trigger:** Người dùng truy cập trang chủ hoặc tìm kiếm.
- **Main Flow:**
    1. Người dùng vào landing page.
    2. Duyệt danh sách phim theo tab "Now Showing".
    3. Chọn phim để xem trailer và suất chiếu khả dụng.
- **Business Rules:** Phim sắp chiếu không được phép chọn suất chiếu/đặt vé.

## Use Case ID: UC-02
**Title:** Đặt vé & Chọn ghế Real-time
- **Actor:** Registered User, Realtime Seat Lock Service
- **Preconditions:** Người dùng đã đăng nhập.
- **Main Flow:**
    1. Người dùng chọn suất chiếu.
    2. Hệ thống render layout ghế từ DB.
    3. Người dùng click chọn ghế trống.
    4. Hệ thống lock ghế trong Redis (5 phút).
- **Alternative Flow:** Ghế vừa bị người khác chọn -> Hệ thống báo lỗi và cập nhật UI ngay lập tức.
- **Failure Flow:** Mất kết nối Socket -> Reconnect và fetch lại trạng thái ghế mới nhất.

## Use Case ID: UC-03
**Title:** Quản lý Phim & Suất chiếu
- **Actor:** Admin
- **Trigger:** Admin truy cập vào Dashboard.
- **Main Flow:**
    1. Admin chọn thêm phim mới.
    2. Upload Poster lên Cloudinary.
    3. Nhập ID video YouTube.
    4. Tạo suất chiếu cho các phòng (Room).
- **Postconditions:** Dữ liệu mới xuất hiện ngay trên trang người dùng.

## Use Case ID: UC-04
**Title:** Tư vấn & Đặt vé qua AI
- **Actor:** User, AI Assistant
- **Trigger:** Người dùng mở Chat popup.
- **Main Flow:**
    1. Người dùng nhập yêu cầu ngôn ngữ tự nhiên.
    2. AI xử lý ý định (Intent Recognition).
    3. AI gợi ý phim và suất chiếu.
    4. AI hỗ trợ chuyển hướng người dùng đến bước thanh toán.
- **Business Rules:** AI không được phép thanh toán thay người dùng, chỉ hỗ trợ đến bước chốt ghế/combo.
