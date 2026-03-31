# 14. AI Assistant Technical specification

## 1. Core Logic & Intents
Trợ lý được thiết kế như một người bạn điện ảnh (Cinema Buddy).
- **Intents:**
    - `SEARCH_MOVIE`: Tìm phim.
    - `RECOMMEND_BY_MOOD`: Gợi ý theo tâm trạng.
    - `ANSWER_FAQ`: Trả lời câu hỏi về giá vé, giờ mở cửa.
    - `ASSIST_BOOKING`: Tìm suất và giữ ghế.

## 2. OpenAI Function Calling (Architecture)
Khi User hỏi: "Cho tôi 2 vé phim Marvel tối nay", AI sẽ gọi các hàm sau:
1. `searchMovies({ title: 'Marvel', status: 'NOW_SHOWING' })`
2. `getShowtimes({ movieId: '<id>', date: 'today' })`
3. Parse kết quả và trả về: "Có suất lúc 19:00 rạp 3. Bạn muốn đặt A7, A8 chứ?"

## 3. Mood-based Recommendation Strategy
- **Prompt:** "Bạn là chuyên gia điện ảnh. Nếu tôi buồn, hãy gợi ý phim hài hoặc chữa lành. Nếu tôi hào hứng, hãy gợi ý phim hành động. Luôn dựa trên danh sách phim hiện có..."
- **Context:** Backend gửi kèm danh sách phim hiện có (tóm tắt) vào System Message của OpenAI.

## 4. Conversation Memory
- Sử dụng `AIChatSession` và `AIChatMessage` trong Database để lưu lại lịch sử chat của 5-10 lượt gần nhất. 
- Giúp AI nhớ được user đang hỏi dở bộ phim nào trước đó.

## 5. Fallback Strategy
- Nếu AI không hiểu hoặc Token limit sắp đạt ngưỡng: Trả về câu trả lời mặc định kèm link đến trang danh sách phim.
- Nếu OpenAI API bị lỗi: Hiển thị thông báo "Trợ lý đang bận, vui lòng thử lại sau" và cho phép user truy cập trang Support truyền thống.
