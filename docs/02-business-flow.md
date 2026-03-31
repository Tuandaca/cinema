# 02. Business Flow Document

## 1. Browse & Select Movie Flow (Quy trình duyệt phim)
1. Người dùng truy cập Trang chủ.
2. Hệ thống hiển thị Phim Đang Chiếu (Now Showing) và Sắp Chiếu (Coming Soon).
3. Người dùng lọc phim theo Thể loại hoặc Tìm kiếm qua AI.
4. Người dùng click chọn phim để xem chi tiết (Trailer, Cast, Rating).

## 2. Showtime & Seat Selection Flow (Quy trình chọn suất & ghế)
1. Từ trang chi tiết, người dùng chọn "Đặt vé".
2. Người dùng chọn Ngày và Suất chiếu (Showtime).
3. Hệ thống hiển thị sơ đồ ghế Real-time.
4. **Seat Locking:** Khi người dùng click chọn ghế:
    - Frontend gửi event qua Socket.io.
    - Backend kiểm tra Redis, nếu ghế chưa bị lock/đặt, thực hiện lock 5-10 phút.
    - Cập nhật trạng thái cho tất cả người dùng khác đang xem cùng suất chiếu.

## 3. Order & Payment Flow (Quy trình Hoàn tất đơn hàng)
1. Sau khi chọn ghế, người dùng nhấn "Tiếp tục".
2. Hệ thống hiển thị danh sách Combo thức ăn (Popcorn, Drinks).
3. Người dùng chọn thêm Combo (Thêm vào OrderItem).
4. Trang Summary hiển thị tổng tiền.
5. Người dùng thực hiện thanh toán (Stripe/Simulate).
6. Backend xác nhận:
    - Chuyển trạng thái Booking từ `PENDING` sang `PAID`.
    - Gửi mã vé/QR về Email/History.
    - Giải phóng lock trong Redis.

## 4. AI Recommendation & Booking Flow
1. Người dùng nhắn tin: "Tôi muốn xem phim kinh dị tối nay cho 2 người".
2. AI phân tích:
    - Tìm kiếm phim `Genre: Horror` + `Status: NOW_SHOWING`.
    - Gọi hàm `getShowtimes(movieId, today)`.
    - Đề xuất suất chiếu phù hợp.
3. Nếu người dùng đồng ý: AI gọi hàm `lockSeats` và chuyển người dùng đến trang thanh toán.

## 5. Edge Cases (Trường hợp ngoại lệ)
- **Timeout:** Người dùng giữ ghế quá lâu mà không thanh toán -> Redis tự expiration, giải phóng ghế.
- **Double Booking:** Hai người cùng click 1 ghế cùng lúc m/s -> Người gửi request đến Redis trước sẽ thắng.
- **Payment Failure:** Thanh toán lỗi -> Giữ trạng thái Pending thêm 2 phút để user thử lại, nếu không thì hủy lock.
- **Canceled Showtime:** Suất chiếu bị hủy -> Refund tự động và thông báo qua Email.
