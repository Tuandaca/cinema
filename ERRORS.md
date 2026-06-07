# ERROR LOG - Phase 6: AI Assistant Integration

## [2026-05-03 21:30] - Vercel AI SDK TypeScript Mismatch
- **Type**: Agent/Integration
- **Severity**: Medium
- **File**: `apps/api/src/ai/ai.service.ts`
- **Root Cause**: Phiên bản `ai` (6.x) và `@ai-sdk/google` có sự thay đổi về kiểu dữ liệu cho thuộc tính `execute` trong `tool` và kết quả trả về (`result` vs `output`).
- **Fix Applied**: Sử dụng `as any` để bypass lỗi ép kiểu và chuyển đổi `result` sang `output` trong vòng lặp xử lý `toolResults`.
- **Prevention**: Luôn kiểm tra tài liệu mới nhất của Vercel AI SDK khi nâng cấp phiên bản.

---

## [2026-05-03 22:20] - Missing API Endpoint (Frontend 404)
- **Type**: Integration
- **Severity**: High
- **File**: `apps/web/src/components/ai/FloatingChatbot.tsx`
- **Root Cause**: Import `axiosInstance` từ đường dẫn không tồn tại và thiếu cấu hình `API_URL` tập trung.
- **Fix Applied**: Tự định nghĩa `API_URL` trong component và sử dụng `axios` trực tiếp. Chỉnh lại CORS trên backend để chấp nhận mọi port (3000, 3001, 3002).
- **Prevention**: Xây dựng file cấu hình API dùng chung (`services/api.ts`) ngay từ đầu phase.

---

## [2026-05-03 22:30] - react-markdown className Assertion Error
- **Type**: Syntax/Runtime
- **Severity**: Low
- **File**: `apps/web/src/components/ai/FloatingChatbot.tsx`
- **Root Cause**: `react-markdown` v9+ không còn hỗ trợ prop `className`.
- **Fix Applied**: Bao bọc `ReactMarkdown` trong một thẻ `div` có class `prose`.
- **Status**: Fixed.

---

## [2026-05-03 22:45] - Missing tailwindcss/typography Plugin
- **Type**: UI/Config
- **Severity**: Medium
- **File**: `apps/web/tailwind.config.ts`
- **Root Cause**: Sử dụng các class `prose` nhưng chưa cài đặt và kích hoạt plugin typography của Tailwind.
- **Fix Applied**: Cài đặt `@tailwindcss/typography` và thêm vào mảng `plugins` trong config.
- **Status**: Fixed.

---

## [2026-05-03 22:50] - Port Conflict & Ghost Processes
- **Type**: Environment
- **Severity**: Critical
- **Fix Applied**: Đã thêm lệnh `taskkill /F /IM node.exe` vào quy trình khởi động server (`pnpm dev`) để đảm bảo không còn process node "ma".
- **Status**: Fixed.

---

## [2026-05-05 03:30] - Gemini API Rate Limit (Quota Exceeded)
- **Type**: Runtime/Quota
- **Severity**: High
- **File**: `apps/api/src/ai/ai.service.ts`
- **Root Cause**: Tài khoản Gemini Free Tier bị giới hạn 1500 request/ngày và 10 RPM. Khi test liên tục sẽ gây lỗi 429 (Internal Server Error 500 nếu không bắt).
- **Fix Applied**: Thêm khối `catch` bắt các lỗi liên quan đến `quota/rate/429` trong `AiService.chat()`. Trả về một tin nhắn thân thiện bằng tiếng Việt cho người dùng thay vì báo lỗi hệ thống.
- **Status**: Fixed (Handling Implemented).

---

## [2026-05-10 16:55] - Empty Showtimes (Booking Blocker)
- **Type**: Integration/Data
- **Severity**: Critical
- **File**: Database / `apps/api/src/movies/movies.service.ts`
- **Root Cause**: No active showtimes available in the system for the current date, blocking the entire booking flow.
- **Fix Applied**: Pending. Need to write a database seed script or API to generate showtimes dynamically.
- **Status**: Investigating

---

## [2026-05-10 16:58] - AI Chatbot 500 Internal Server Error
- **Type**: Runtime/Integration
- **Severity**: High
- **File**: `apps/api/src/ai/ai.controller.ts`
- **Root Cause**: Database migration missing. `PrismaClientKnownRequestError: The column User.stripeCustomerId does not exist in the current database`. The schema was updated but `npx prisma db push` was not run.
- **Fix Applied**: Need to run `npx prisma db push` to sync the database schema.
- **Status**: Identified

---

## [2026-05-10 17:00] - WebSocket Connection Refused
- **Type**: Integration/Network
- **Severity**: High
- **File**: `apps/web/src/components/booking/SeatGrid.tsx`
- **Root Cause**: Frontend attempting to connect to `ws://localhost:3005` (Next.js port) instead of the NestJS WebSocket Gateway port (`3006`).
- **Fix Applied**: Pending. Update Socket.io client configuration to use the correct `API_URL`.
- **Status**: Investigating

---

## [2026-05-23 07:48] - Can't Reach Supabase Database Server (DNS Resolution Failed)
- **Type**: Integration/Environment
- **Severity**: Critical
- **File**: `apps/api/.env`
- **Root Cause**: Lệnh `npx prisma db push` thất bại với lỗi `P1001`. Lệnh kiểm tra mạng báo lỗi phân giải tên miền DNS cho `db.sbhkkfboazxoutfcitzd.supabase.co`. Có khả năng project Supabase đã bị Paused hoặc bị xoá.
- **Fix Applied**: Người dùng đã vào Supabase Dashboard để khôi phục (Resume) dự án.
- **Status**: Fixed

---

## [2026-05-23 08:20] - Gemini 1.5 Flash Model Deprecation & False-Positive Catch Block Bug
- **Type**: Logic/Integration
- **Severity**: High
- **File**: `apps/api/src/ai/ai.service.ts`
- **Agent**: cinemaAgent
- **Root Cause**: 
  1. API key hiện tại không còn hỗ trợ model `gemini-1.5-flash` (gây lỗi 404 Not Found từ Google API).
  2. Đoạn check lỗi `errMsg.includes('rate')` để bắt lỗi Rate Limit bị dính lỗi logic (false-positive), do chuỗi thông báo lỗi trả về chứa tên phương thức `generateContent`, trong đó có chứa từ "rate" (`gene` + `rate` + `Content`). Dẫn đến việc tất cả lỗi 404 Model Not Found đều bị trả về chuỗi "Hệ thống đang quá tải...".
- **Error Message**:
  ```json
  {
    "status": 404,
    "data": {
      "error": {
        "code": 404,
        "message": "models/gemini-1.5-flash is not found for API version v1, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.",
        "status": "NOT_FOUND"
      }
    }
  }
  ```
- **Fix Applied**: 
  1. Nâng cấp model từ `gemini-1.5-flash` lên `gemini-2.5-flash` (đã test thành công với API key hiện tại).
  2. Sửa lại khối catch lỗi: phân tách rõ từ khóa "rate" thực sự của Rate Limit với "generateContent" / "generate_content".
- **Prevention**: Tránh sử dụng `.includes('rate')` đơn lẻ đối với các thông báo lỗi liên quan đến API của Google. Nên check mã trạng thái `error.statusCode === 429` hoặc các cụm từ cụ thể hơn như `rate limit`, `too many requests`.
- **Status**: Fixed

---

## [2026-05-23 09:00] - AI Assistant Silent Fallback & UI Card Rendering Bug
- **Type**: Agent/Logic
- **Severity**: High
- **File**: `apps/api/src/ai/ai.service.ts`
- **Agent**: cinemaAgent
- **Root Cause**: 
  1. Khi dùng Vercel AI SDK với `maxSteps`, biến `toolResults` được extract từ `result` mặc định chỉ chứa kết quả của vòng lặp cuối cùng. Điều này làm AI không hiển thị được UI Cards nếu tool được gọi ở các bước trước đó.
  2. Nếu người dùng tìm kiếm phim theo các thể loại không có trong DB (VD: Horror, Romance), tool trả về rỗng. Trước đây AI thường tự hỏi lại người dùng "Bạn có muốn gợi ý phim khác không?" thay vì tự động fallback gọi tool, khiến `uiCards` rỗng và chỉ trả về đoạn hội thoại.
- **Fix Applied**: 
  1. Sửa logic trích xuất UI Cards: Dùng mảng `steps.flatMap(s => s.toolResults || [])` để gom toàn bộ kết quả tool từ tất cả các bước thay vì chỉ lấy bước cuối cùng.
  2. Cập nhật System Prompt: Bắt buộc (Force) AI phải **ngay lập tức** gọi `getTopRatedMovies` khi kết quả rỗng thay vì hỏi lại người dùng.
- **Prevention**: Khi sử dụng multi-step agent (`maxSteps` > 1) với Vercel AI SDK, luôn trích xuất `toolResults` từ mảng `steps`. System Prompt luôn cần có chỉ thị rõ ràng (Zero-Shot Guidance) để ép LLM thực hiện fallback call mà không xin phép.
- **Status**: Fixed

---

## [2026-05-23 16:35] - AI Assistant Context Amnesia (Memory Optimization)
- **Type**: Agent/Logic
- **Severity**: Medium
- **File**: `apps/api/src/ai/ai.service.ts`
- **Agent**: cinemaAgent
- **Root Cause**: Cơ sở dữ liệu bảng `AIChatMessage` chỉ lưu trữ trường `content` là văn bản text do AI sinh ra, không hề lưu trữ thông tin UI Cards (Dữ liệu từ Tool Results). Vì vậy, khi AI trả về danh sách phim qua UI Cards nhưng không nhắc tên phim trong câu trả lời, ở lượt chat tiếp theo, AI hoàn toàn "mất trí nhớ" và không biết mình vừa giới thiệu những phim gì (Context Amnesia).
- **Fix Applied**: Thêm **Rule 10 (GHI NHỚ NGỮ CẢNH)** vào System Prompt, bắt buộc AI mỗi khi hiển thị UI Card phải gọi đích danh tên các bộ phim hoặc suất chiếu trong câu chữ của mình. (VD: "Dưới đây là phim: Dune, Deadpool..."). Việc này ép thông tin chạy vào trường `content` và lưu vào DB.
- **Prevention**: Khi xây dựng hệ thống AI sử dụng UI Cards phong phú (Generative UI) mà DB không hỗ trợ lưu toàn bộ JSON của Tool, bắt buộc phải có Prompt Engineering để ép LLM đưa thông tin khóa (Key info) vào văn bản thuần (Plain Text).
- **Status**: Fixed

---

## [2026-05-23 18:55] - AI SDK Zod Validation Silent Failure
- **Type**: Integration/Logic
- **Severity**: High
- **File**: `apps/api/src/ai/ai.service.ts`
- **Agent**: cinemaAgent
- **Root Cause**: Khi người dùng hỏi các thể loại không cụ thể bằng tiếng Việt (VD: "phim tình cảm"), LLM không tự dịch sang tiếng Anh được nên sinh ra Tool Call với arguments rỗng `{}` (hoặc `genre: undefined`). Do schema `z.string()` yêu cầu bắt buộc, Vercel AI SDK ném lỗi Zod Validation Error ẩn bên dưới, bỏ qua việc chạy hàm `execute`. Kết quả là `toolResults` mang theo lỗi, khiến `res.result` trả về `undefined`, không có UI Card nào được vẽ ra. Đồng thời AI cũng "đứng hình" vì không biết xử lý lỗi này ra sao nên sinh ra `text: ""`.
- **Fix Applied**: Sửa Zod Schema của `getMoviesByGenre`: 
  1. Đổi `genre` thành `.optional()`.
  2. Bổ sung câu Prompt bắt buộc LLM phải tự dịch sang tiếng Anh.
  3. Trong hàm `execute`, thêm check `if (!genre) return [];`. Nhờ đó nếu LLM có quên biến `genre`, tool vẫn sẽ trả về mảng rỗng `[]` thay vì lỗi, giúp kích hoạt trơn tru rule fallback `getTopRatedMovies`.
- **Prevention**: Luôn dùng `.optional()` cho các Zod Schema parameters nhận từ LLM nếu có rủi ro LLM không điền đủ dữ liệu, và tự handle validation bên trong block `execute` để duy trì luồng chạy.
- **Status**: Fixed

---

## [2026-05-23 19:24] - Hot Reload Blocked by Test Scripts
- **Type**: Process & Test Failure
- **Severity**: High
- **File**: `apps/api/test_ai_parse_error.ts` (deleted)
- **Agent**: cinemaAgent
- **Root Cause**: Trong quá trình debug, các file test `.ts` nháp được tạo ngay trong thư mục src/apps. Trình biên dịch TypeScript toàn cục của lệnh `nest start --watch` đã quét trúng các file này. Vì các file nháp chứa lỗi cú pháp cố ý để test, trình biên dịch báo lỗi và **từ chối update server**. Do đó, các bản vá lỗi (z.enum, destructuring default) không được cập nhật lên server đang chạy, khiến người dùng liên tục gặp lỗi cũ dù code đã được sửa.
- **Fix Applied**: Xóa toàn bộ các file `.ts` nháp dùng để test. Khôi phục lại quá trình build thành công.
- **Prevention**: KHÔNG tạo file nháp mang tính phá vỡ cấu trúc type ngay trong thư mục project chạy watch. Nên đưa vào thư mục tạm hoặc file `.js` độc lập.
- **Status**: Fixed

---

## [2026-05-23 20:00] - AI Generates Empty Text & Stuck in Loop History
- **Type**: Agent/Logic
- **Severity**: High
- **File**: `apps/api/src/ai/ai.service.ts`
- **Agent**: cinemaAgent
- **Root Cause**: 
  1. **SDK Behavior**: Model Gemini 2.5 Flash có hành vi trả về `finishReason: 'tool-calls'` khi gọi tool và dừng luôn, không kích hoạt bước tiếp theo để tổng hợp câu trả lời bằng tiếng Việt, khiến câu trả lời trả về là chuỗi rỗng `""`.
  2. **Context Amnesia**: Lỗi chuỗi rỗng `""` này vô tình được lưu vào Database ở vai trò Assistant. Khi người dùng hỏi câu tiếp theo (VD: "Phim hành động hay"), AI đọc lại history thấy lượt trước mình trả về rỗng kèm tool `getTheaterInfo`, nó bị "ảo giác" và lặp lại chính xác tool cũ thay vì xử lý câu lệnh mới.
- **Fix Applied**: 
  1. Bổ sung bước **synthesis fallback**: Kiểm tra nếu `text` rỗng sau khi gọi tool, chủ động gọi `generateText` một lần nữa để nhồi kết quả tool vào prompt, ép LLM dịch và tổng hợp thành lời văn.
  2. Chặn việc lưu chuỗi rỗng: Chỉ lưu content vào Database nếu `finalText` có dữ liệu thực sự.
- **Prevention**: Luôn có bước post-processing text đối với một số model đặc thù như Gemini 2.5 Flash trong Vercel AI SDK để đảm bảo không trả về text rỗng cho user.
- **Status**: Fixed

---

## [2026-06-07 11:40] - QA Static Analysis: Payment Endpoint Missing Auth Guard
- **Type**: Logic/Security
- **Severity**: High
- **File**: `apps/api/src/payment/payment.controller.ts`
- **Agent**: cinemaAgent
- **Root Cause**: Cả 2 endpoint `POST /payment/:bookingId/intent` và `POST /payment/:bookingId/qr-code` đều không có `@UseGuards(JwtAuthGuard)`. Bất kỳ người dùng nào (kể cả chưa đăng nhập) đều có thể tạo Payment Intent với bookingId bất kỳ.
- **Fix Applied**: Thêm `@UseGuards(JwtAuthGuard)` vào cả 2 endpoint, import `JwtAuthGuard`.
- **Prevention**: Tất cả endpoint thay đổi dữ liệu (POST/PUT/DELETE) phải được review auth guard. Cần code review checklist.
- **Status**: Fixed

---

## [2026-06-07 11:40] - QA Static Analysis: Seat Type Missing 'SELECTING' in Frontend
- **Type**: Syntax/Type
- **Severity**: Medium
- **File**: `apps/web/src/services/booking.service.ts:9`
- **Agent**: cinemaAgent
- **Root Cause**: Interface `Seat` ở Frontend khai báo `status: 'AVAILABLE' | 'LOCKED' | 'BOOKED'` nhưng Backend trả về 4 giá trị: `'AVAILABLE' | 'SELECTING' | 'LOCKED' | 'BOOKED'`. TypeScript không bắt lỗi runtime do kiểu dữ liệu không match.
- **Fix Applied**: Thêm `'SELECTING'` vào union type của `Seat.status`.
- **Prevention**: Dùng shared types trong package `packages/shared` (Turborepo) để Backend và Frontend luôn dùng chung interface. Tránh define type riêng lẻ ở mỗi phía.
- **Status**: Fixed

---

## [2026-06-07 11:40] - QA Static Analysis: Debug console.log in Production Code
- **Type**: Code Quality
- **Severity**: Low
- **File**: `apps/web/src/services/movie.service.ts:5`
- **Agent**: cinemaAgent
- **Root Cause**: Dòng `console.log('🎬 MovieService using API_URL:', API_URL)` còn sót lại trong code production, gây leak thông tin config ra browser console.
- **Fix Applied**: Xóa dòng console.log.
- **Prevention**: Sử dụng linter rule `no-console` hoặc chỉ dùng `process.env.NODE_ENV !== 'production'` guard khi cần debug log.
- **Status**: Fixed

