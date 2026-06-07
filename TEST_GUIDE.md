# 🧪 TEST GUIDE - CoiCine (Tuandaca tự test)

> **Ngày tạo**: 2026-06-07 | **Tạo bởi**: cinemaAgent
> **Mục tiêu**: Xác nhận toàn bộ hệ thống Phase 1–6 hoạt động đúng trước khi bắt đầu Phase 7.
> **Thời gian dự kiến**: ~30–45 phút

---

## ⚙️ BƯỚC 0: KHỞI ĐỘNG (BẮT BUỘC TRƯỚC KHI TEST)

Mở **2 terminal riêng biệt** và chạy:

**Terminal 1 — Backend:**
```powershell
cd D:\Projects\cinema\apps\api
npx nest start --watch
```
✅ Chờ thấy dòng: `🚀 Application is running on: http://[::1]:3006`

**Terminal 2 — Frontend:**
```powershell
cd D:\Projects\cinema\apps\web
npx next dev
```
✅ Chờ thấy: `✓ Ready in ...ms` — mở trình duyệt tại `http://localhost:3000`

> ⚠️ **Nếu Backend báo lỗi P1001 / DNS**: Vào [Supabase Dashboard](https://supabase.com/dashboard) → Resume dự án → chạy lại.

> ⚠️ **Nếu port bị chiếm**: Chạy `taskkill /F /IM node.exe` rồi thử lại.

---

## 📋 CHECKLIST TEST (Đánh dấu ✅ khi pass, ❌ khi fail)

---

### 🔵 TEST 1: Health Check

```powershell
curl http://localhost:3006/api/health
```
- [ ] ✅ Trả về JSON không báo lỗi (status ok)

---

### 🔵 TEST 2: Authentication

**2.1 — Đăng ký tài khoản mới:**
```powershell
curl -X POST http://localhost:3006/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"tuandaca.test@coicine.com","password":"Test1234!","name":"Tuan Test"}'
```
- [ ] ✅ Trả về `{"message":"User registered successfully","userId":"..."}`

**2.2 — Đăng nhập và lấy Token:**
```powershell
curl -X POST http://localhost:3006/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"tuandaca.test@coicine.com","password":"Test1234!"}'
```
- [ ] ✅ Trả về `{"access_token":"eyJ...","user":{...}}`
- 📝 **COPY `access_token` ra notepad** — dùng cho các test sau!

**2.3 — Đăng nhập sai mật khẩu:**
```powershell
curl -X POST http://localhost:3006/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"tuandaca.test@coicine.com","password":"SaiMatKhau"}'
```
- [ ] ✅ Trả về `401 Unauthorized`

---

### 🔵 TEST 3: Movies API

**3.1 — Lấy danh sách phim:**
```powershell
curl http://localhost:3006/api/movies
```
- [ ] ✅ Trả về mảng JSON (nếu rỗng `[]` → xem mục **"Nếu DB rỗng"** cuối file)
- 📝 **COPY id của 1 phim bất kỳ** ra notepad → gọi là `MOVIE_ID`

**3.2 — Lấy chi tiết phim:**
```powershell
# Thay <MOVIE_ID> bằng id thật
curl http://localhost:3006/api/movies/<MOVIE_ID>
```
- [ ] ✅ Trả về thông tin đầy đủ: title, rating, genres, showtimes...

**3.3 — Filter theo genre:**
```powershell
curl "http://localhost:3006/api/movies?genre=Action"
```
- [ ] ✅ Trả về mảng phim (có thể rỗng nếu không có phim Action)

---

### 🔵 TEST 4: Booking Flow (Cần có Showtime trong DB)

**4.1 — Lấy showtimes của phim:**
```powershell
curl http://localhost:3006/api/movies/<MOVIE_ID>/showtimes
```
- [ ] ✅ Trả về mảng showtimes
- 📝 **COPY id của 1 showtime** → gọi là `SHOWTIME_ID`

> ⚠️ Nếu mảng rỗng `[]` → DB không có showtime → xem mục **"Nếu DB rỗng"** cuối file.

**4.2 — Xem trạng thái ghế:**
```powershell
curl http://localhost:3006/api/showtimes/<SHOWTIME_ID>/seats
```
- [ ] ✅ Trả về mảng ghế với `status: AVAILABLE/BOOKED/LOCKED`
- 📝 **COPY id của 1 ghế có `status: "AVAILABLE"`** → gọi là `SEAT_ID`

**4.3 — Lock ghế (cần Token):**
```powershell
# Thay TOKEN, SHOWTIME_ID, SEAT_ID
$TOKEN = "eyJ..."
curl -X POST "http://localhost:3006/api/showtimes/<SHOWTIME_ID>/lock" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d '{"seatIds":["<SEAT_ID>"]}'
```
- [ ] ✅ Trả về `{"success":true,"message":"Seats locked successfully"}`

**4.4 — Lock ghế không có auth (phải bị chặn):**
```powershell
curl -X POST "http://localhost:3006/api/showtimes/<SHOWTIME_ID>/lock" `
  -H "Content-Type: application/json" `
  -d '{"seatIds":["<SEAT_ID>"]}'
```
- [ ] ✅ Trả về `401 Unauthorized`

**4.5 — Tạo booking:**
```powershell
curl -X POST http://localhost:3006/api/showtimes/bookings `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d '{"showtimeId":"<SHOWTIME_ID>","seatIds":["<SEAT_ID>"],"combos":[]}'
```
- [ ] ✅ Trả về Booking object: `{"id":"...","status":"PENDING","totalAmount":...}`
- 📝 **COPY `id` của booking** → gọi là `BOOKING_ID`

---

### 🔵 TEST 5: Payment (Mock)

**5.1 — Tạo Payment Intent:**
```powershell
curl -X POST "http://localhost:3006/api/payment/<BOOKING_ID>/intent" `
  -H "Authorization: Bearer $TOKEN"
```
- [ ] ✅ Trả về `{"clientSecret":"pi_mock_secret_123","isMock":true}`

**5.2 — Tạo QR Code:**
```powershell
curl -X POST "http://localhost:3006/api/payment/<BOOKING_ID>/qr-code" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d '{"amount":150000}'
```
- [ ] ✅ Trả về `{"qrUrl":"https://api.qrserver.com/...","bookingId":"..."}`

**5.3 — Payment không có auth (phải bị chặn):**
```powershell
curl -X POST "http://localhost:3006/api/payment/<BOOKING_ID>/intent"
```
- [ ] ✅ Trả về `401 Unauthorized` ← (Bug mới vừa fix hôm nay!)

---

### 🔵 TEST 6: AI Chatbot (Quan trọng nhất — Phase 6)

> Thay `"userId"` bằng userId thật lấy từ response Test 2.2 nếu muốn chính xác hơn.

**6.1 — Hỏi phim đang chiếu:**
```powershell
curl -X POST http://localhost:3006/api/ai/chat `
  -H "Content-Type: application/json" `
  -d '{"userId":"guest-test","sessionId":null,"message":"Đang chiếu phim gì vậy?"}'
```
- [ ] ✅ `text` KHÔNG rỗng (có câu trả lời tiếng Việt)
- [ ] ✅ `uiCards` có ít nhất 1 phần tử `{type:"MOVIE_LIST",...}`
- 📝 **COPY `sessionId`** từ response để dùng ở Test 6.6

**6.2 — Hỏi genre tiếng Việt (test auto-translate):**
```powershell
curl -X POST http://localhost:3006/api/ai/chat `
  -H "Content-Type: application/json" `
  -d '{"userId":"guest-test","sessionId":null,"message":"Tôi muốn xem phim hành động"}'
```
- [ ] ✅ AI gọi tool `getMoviesByGenre` với `genre:"Action"` (thấy trong log backend)
- [ ] ✅ `uiCards` có `MOVIE_LIST`

**6.3 — ⭐ TEST QUAN TRỌNG: Fallback tự động (không hỏi lại):**
```powershell
curl -X POST http://localhost:3006/api/ai/chat `
  -H "Content-Type: application/json" `
  -d '{"userId":"guest-test","sessionId":null,"message":"Cho tôi xem phim kinh dị"}'
```
- [ ] ✅ AI **KHÔNG** hỏi "Bạn có muốn tôi gợi ý không?"
- [ ] ✅ AI **TỰ ĐỘNG** gọi `getTopRatedMovies` khi không tìm thấy Horror
- [ ] ✅ `uiCards` vẫn có `MOVIE_LIST` (từ top rated)
- [ ] ✅ `text` giải thích rằng không có phim kinh dị, thay vào đó giới thiệu phim khác

**6.4 — Hỏi combo bắp nước:**
```powershell
curl -X POST http://localhost:3006/api/ai/chat `
  -H "Content-Type: application/json" `
  -d '{"userId":"guest-test","sessionId":null,"message":"Có combo bắp nước nào không?"}'
```
- [ ] ✅ `uiCards` có `COMBO_LIST`

**6.5 — Hỏi thông tin rạp:**
```powershell
curl -X POST http://localhost:3006/api/ai/chat `
  -H "Content-Type: application/json" `
  -d '{"userId":"guest-test","sessionId":null,"message":"Rạp CoiCine có mấy phòng chiếu?"}'
```
- [ ] ✅ `uiCards` có `THEATER_INFO`

**6.6 — ⭐ TEST QUAN TRỌNG: Context Memory (cùng session):**
```powershell
# Bước 1: Tìm phim Dune (lấy sessionId)
curl -X POST http://localhost:3006/api/ai/chat `
  -H "Content-Type: application/json" `
  -d '{"userId":"guest-test","sessionId":null,"message":"Cho tôi biết về phim Dune"}'
# → copy sessionId từ response

# Bước 2: Hỏi tiếp trong CÙNG session (thay SESSION_ID)
curl -X POST http://localhost:3006/api/ai/chat `
  -H "Content-Type: application/json" `
  -d '{"userId":"guest-test","sessionId":"<SESSION_ID>","message":"Cho tôi xem lịch chiếu phim đó đi"}'
```
- [ ] ✅ AI nhớ "phim đó" là Dune → gọi `getShowtimes` với movieId của Dune
- [ ] ✅ KHÔNG hỏi "Bạn muốn xem phim nào?"

---

### 🔵 TEST 7: Frontend UI (Mở trình duyệt `http://localhost:3000`)

**Trang chủ (`/`):**
- [ ] ✅ Danh sách phim load được (có spinner khi đang tải)
- [ ] ✅ Hiển thị lỗi thân thiện nếu backend offline
- [ ] ✅ Click MovieCard → chuyển đến trang detail đúng

**Trang danh sách (`/movies`):**
- [ ] ✅ Phim hiển thị với poster, tên, rating

**Trang chi tiết (`/movies/:id`):**
- [ ] ✅ Title, description, genres, runtime hiển thị đúng
- [ ] ✅ Nút "Đặt Vé" hoạt động → redirect đến `/movies/:id/booking`

**Trang chọn ghế (`/movies/:id/booking`):**
- [ ] ✅ SeatGrid hiển thị đầy đủ các ghế
- [ ] ✅ Click chọn ghế → ghế đổi màu
- [ ] ✅ Timer 5 phút xuất hiện sau khi chọn ghế đầu tiên
- [ ] ✅ Chọn thêm ghế → timer KHÔNG reset về 5:00
- [ ] ✅ Ghế `BOOKED` bị disable, không click được

**AI Chatbot:**
- [ ] ✅ Icon chat xuất hiện ở góc màn hình
- [ ] ✅ Click → mở chat window
- [ ] ✅ Gõ tin nhắn → nhận phản hồi tiếng Việt
- [ ] ✅ Movie cards hiển thị đẹp trong chat
- [ ] ✅ Không có response trống rỗng

---

### 🔵 TEST 8: Concurrent Seat Locking (Stress Test)

> Test **quan trọng nhất** về race condition — cần 2 trình duyệt/tab khác nhau.

1. Mở **Tab A** + **Tab B** cùng vào trang chọn ghế của 1 showtime
2. Đăng nhập **2 tài khoản khác nhau** ở 2 tab
3. Cả 2 cùng click vào **đúng 1 ghế** (VD: ghế A5)

**Kết quả mong đợi:**
- [ ] ✅ Tab A chọn được → ghế chuyển vàng (SELECTING)
- [ ] ✅ Tab B thấy ghế đó đổi màu **ngay lập tức** (không cần F5) — WebSocket hoạt động
- [ ] ✅ Tab B click vào ghế đó → bị chặn (không thể chọn)

---

## 📊 KẾT QUẢ TỔNG HỢP

Sau khi test xong, điền vào bảng này:

| Module | Số test | Pass | Fail | Ghi chú |
|--------|---------|------|------|---------|
| Health | 1 | | | |
| Auth | 3 | | | |
| Movies API | 3 | | | |
| Booking Flow | 5 | | | |
| Payment | 3 | | | |
| AI Chatbot | 6 | | | |
| Frontend UI | 12 | | | |
| Concurrent Lock | 3 | | | |
| **TỔNG** | **36** | | | |

---

## 🆘 NẾU DB RỖNG (Không có phim / showtime)

```powershell
# Chạy lệnh seed để tạo dữ liệu mẫu
cd D:\Projects\cinema\apps\api
npx ts-node --project tsconfig.json prisma/seed.ts
```

Nếu lệnh trên lỗi, thử:
```powershell
npx prisma db seed
```

---

## 📞 Sau khi test xong

Báo cho Agent (cinemaAgent) biết:
1. Bao nhiêu test PASS / FAIL
2. Test nào fail và thông báo lỗi cụ thể
3. Muốn fix lỗi hay bắt đầu Phase 7 luôn?

---

*TEST_GUIDE.md — Created by cinemaAgent | 2026-06-07*
