# 15. Roadmap & Phased Execution

## Phase 1: System Design (Week 1)
- **Deliverables:** Full `/docs` documentation, ERD, API specs.
- **Risk:** Thiết kế sai Schema dẫn đến khó refactor sau này.
- **Complexity:** Medium.

## Phase 2: Backend Core (Week 2-3)
- **Deliverables:** Auth system, Movie CRUD, DB Migrations.
- **Acceptance Criteria:** Đăng nhập thành công, Fetch được list phim từ DB.

## Phase 3: Frontend UI & Branding (Week 3-4)
- **Deliverables:** Landing page, Movie Detail, Dark Theme.
- **Focus:** Animation & Cinematic feel.

## Phase 4: Real-time Seat Booking (Week 4-5) - [CRITICAL]
- **Deliverables:** Seat Grid UI, Socket.io setup, Redis Locking.
- **Risk:** Race condition, mất kết nối socket.
- **Complex:** High.

## Phase 5: Order & Payment (Week 5-6)
- **Deliverables:** Cart, Combo selection, Payment integration, PDF Ticket.
- **Acceptance Criteria:** Booking thành công -> Database cập nhật PAID -> Có vé gửi về.

## Phase 6: AI Integration (Week 6-7)
- **Deliverables:** Chat UI, OpenAI Function calling, Recommendation system.
- **Complexity:** Medium.

## Phase 7: Admin Dashboard (Week 7-8)
- **Deliverables:** Quản lý Phim/Suất chiếu UI, Analytics Charts.

## Phase 8: Optimization & Launch (Week 8)
- **Deliverables:** Performance tuning, SEO, Deployment to Production.
- **Final Audit:** Security & Penetration test.
