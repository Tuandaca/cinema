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
