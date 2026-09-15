# CHI TIẾT KẾ HOẠCH FIX 5 BUGS - PHASE 6 (2026-08-01)

File này lưu trữ chi tiết nguyên nhân và cách giải quyết kỹ thuật cho 5 lỗi phát hiện trong quá trình test Phase 6. Các Agent ở phiên làm việc sau vui lòng đọc kỹ và thực thi chính xác.

---

## 1. Vấn đề 1: Đăng ký → 404 Not Found

**Nguyên nhân:** Thư mục `apps/web/src/app/auth/` hiện chỉ có `login/`, **chưa có** `register/`.
**Fix (Frontend):**
- Tạo folder & file `apps/web/src/app/auth/register/page.tsx`.
- Form cần đồng bộ UI/UX với trang login (Dark mode, viền màu `coicine-gold`).
- Form có các trường: Họ tên, Email, Mật khẩu, Xác nhận mật khẩu.
- State management: `isLoading`, `error`.
- API Call: Gọi `POST /api/auth/register` với payload `{ email, password, name }`. Chuyển hướng về `/auth/login` sau khi thành công.

---

## 2. Vấn đề 2: Chatbot lặp lại câu trả lời cũ

**Nguyên nhân:** 
Hệ thống AI lấy history (`take: 20`) từ bảng `AIChatMessage` (file `apps/api/src/ai/ai.service.ts`). Khi lượt trước AI sinh ra text + gọi tool, text đó được lưu vào DB. Khi user gửi câu mới, lịch sử được tải lên bao gồm cả nội dung "tìm thấy phim" cũ. Do model đôi khi "bị bám" vào context cũ, nó ưu tiên lặp lại nội dung đã tìm trước đó thay vì xử lý tool calls cho câu mới.

**Fix (Backend - `ai.service.ts`):**
- Dòng 46: Giới hạn history xuống `take: 10` thay vì `20` để giảm nhiễu ngữ cảnh.
- Sửa System Prompt: Củng cố chỉ thị "Luôn phân tích câu hỏi MỚI NHẤT của người dùng. Không được lặp lại câu trả lời cũ trừ khi người dùng yêu cầu.".
- Cải thiện logic lưu/tải DB: Nếu nhận thấy AI có dấu hiệu sinh câu trả lời bị lặp, cần có cơ chế làm sạch context (clear context hoặc tóm tắt history).
- Thêm chỉ thị rõ ràng: `Hãy tự động gọi lại Tool nếu chủ đề thay đổi thay vì dùng dữ liệu cũ.`

---

## 3. Vấn đề 3: Không có suất chiếu nào

**Nguyên nhân:** 
Hàm `getShowtimes` query `startTime: { gte: new Date() }`. Database hiện tại chỉ toàn suất chiếu trong quá khứ hoặc chưa có suất chiếu.

**Fix (Database/Backend):**
- Tạo script `apps/api/seed-showtimes.ts`.
- Script này: Query toàn bộ phim (`NOW_SHOWING`), tạo 3 suất chiếu (ví dụ 10:00, 14:00, 19:00) cho mỗi ngày, kéo dài từ hôm nay đến 7 ngày tiếp theo. Gắn vào các phòng ngẫu nhiên.
- Mở Terminal chạy: `npx ts-node seed-showtimes.ts` (nhớ export env `DATABASE_URL` trước khi chạy nếu cần).

---

## 4. Vấn đề 4: Chỉ có phim cũ, thiếu phim hot hiện tại

**Nguyên nhân:** Dữ liệu seed mặc định ban đầu là các phim cũ lấy từ OMDB. Thiếu các phim thực tế đang chiếu rạp như Conan, Spider-Man, The Odyssey...

**Fix (Database/Backend):**
- Tạo script `apps/api/seed-hot-movies.ts` (hoặc gộp chung với `seed-showtimes.ts`).
- Sử dụng Prisma `upsert` để thêm các phim mới nhất (dữ liệu mock thủ công hoặc gọi API fetch TMDB/OMDB cho các phim: "Detective Conan: The Million-dollar Pentagram", "Spider-Man: Across the Spider-Verse", "The Odyssey", v.v.).
- Set status của các phim này thành `NOW_SHOWING`.
- Sau khi seed phim, seed luôn showtimes cho chúng.

---

## 5. Vấn đề 5: Tên Logo sai ("CinemaAIBooking")

**Nguyên nhân:** 
File `packages/shared/index.ts` có chứa: `export const CINEMA_APP_NAME = "Cinema AI Booking";`
Frontend `Header.tsx` dùng biến này để cắt chuỗi render Logo khiến giao diện hiện chữ "Cinema AIBooking".

**Fix (Shared Package):**
- Đổi dòng đó thành: `export const CINEMA_APP_NAME = "CoiCine";`
- Vì là Turborepo, Frontend sẽ tự nhận diện sự thay đổi này.

---
*Lưu ý cho Agent: Nếu chạy script seed bị lỗi Prisma Client, hãy nhớ chạy lệnh `pnpm --filter api exec prisma generate` trước.*
