# 11. Testing Plan & QA Strategy

## 1. Unit Testing (Jest)
- **Backend:** Test các Service logic cụ thể như:
    - Tính toán tổng tiền Order (Vé + Combo).
    - Logic check thời gian lock ghế hợp lệ.
- **Frontend:** Test các util functions xử lý format date, currency.

## 2. Integration Testing
- Test luồng `Create Booking -> Add Combo -> Finalize Payment`.
- Đảm bảo Prisma migration chạy đúng với database PostgreSQL.

## 3. End-to-End (E2E) Testing (Playwright)
- Luồng quan trọng nhất:
    1. Login.
    2. Chọn phim -> Chọn suất.
    3. Click ghế -> Thanh toán.
    4. Kiểm tra vé trong History.

## 4. Concurrency Testing (Seat Booking)
- Sử dụng script (k6 hoặc Artillery) giả lập 100 User cùng click 1 ghế duy nhất trong 1 giây.
- **Expectation:** Chỉ 1 User nhận được status 200, 99 user còn lại nhận 409 (Conflict).

## 5. AI Assistant Testing
- Thử nghiệm các câu lệnh ngôn ngữ tự nhiên sai ngữ pháp hoặc tối nghĩa.
- Đảm bảo AI không thực hiện function call với các tham số độc hại.
- Kiểm tra tính nhất quán của gợi ý phim (Mood matching).

## 6. Security Testing
- Thử truy cập API xóa phim mà không có quyền Admin -> Expectation: 403 Forbidden.
- Thử bypass checkout bằng cách thay đổi giá tiền qua client-side request -> Expectation: Backend tính toán lại và từ chối đơn hàng sai lệch.
