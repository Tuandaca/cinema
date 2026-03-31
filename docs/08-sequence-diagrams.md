# 08. Sequence Diagrams (Mermaid)

## 1. Seat Locking Flow (Race Condition Prevention)
Đảm bảo hai người không thể chọn cùng một ghế cùng lúc.

```mermaid
sequenceDiagram
    participant U1 as User 1
    participant U2 as User 2
    participant S as NestJS Server
    participant R as Redis Cache
    participant DB as PostgreSQL

    U1->>S: Click chọn Ghế A7 (Socket Event)
    U2->>S: Click chọn Ghế A7 (Socket Event - trễ 10ms)
    
    S->>R: SETNX lock:showtime:A7 (TTL 5m)
    R-->>S: OK (Thành công cho U1)
    
    S->>R: SETNX lock:showtime:A7 (TTL 5m)
    R-->>S: FAIL (Đã tồn tại - cho U2)
    
    S-->>U1: Emit 'lock_success' (Màu vàng trên UI)
    S-->>U2: Emit 'lock_fail' (Màu xám/đỏ trên UI)
    
    S->>S: Broadcast 'seat_locked' (A7) tới tất cả Clients
```

## 2. Payment & Confirmation Flow
```mermaid
sequenceDiagram
    participant U as User
    participant S as Backend
    participant P as Payment Gateway
    participant DB as Postgres

    U->>S: POST /api/bookings/confirm (bookingId)
    S->>DB: Check booking status (PENDING)
    S->>P: Chuyển hướng/Xử lý thanh toán
    P-->>S: Webhook Payment Success
    S->>DB: Update Booking (PAID)
    S->>DB: Update BookingSeats (FINALIZED)
    S->>S: Giải phóng Redis Lock
    S-->>U: Hiển thị Ticket & QR Code
```

## 3. AI Booking Flow
```mermaid
sequenceDiagram
    participant U as User
    participant AI as OpenAI
    participant S as Backend
    participant DB as Postgres

    U->>S: "Tìm giúp tôi phim Marvel tối nay"
    S->>AI: Send prompt + System Message
    AI->>S: Function call: searchMovies(query: 'Marvel')
    S->>DB: Query DB
    DB-->>S: Result: Avengers...
    S-->>AI: Data result
    AI-->>S: "Tôi tìm thấy phim Avengers lúc 20:00. Bạn muốn đặt không?"
    S-->>U: Hiển thị tin nhắn trợ lý
```
