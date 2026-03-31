# 05. Database Schema & Prisma Design

## Table Specifications

### Table: User
- **Purpose:** Lưu trữ thông tin tài khoản người dùng.
- **Fields:**
    - `id`: UUID (PK), default uuid()
    - `email`: String (Unique, Index)
    - `password`: String (Hashed)
    - `roleId`: UUID (FK)
- **Constraints:** Not null for all.

### Table: Seat
- **Purpose:** Quản lý tọa độ ghế trong phòng chiếu.
- **Fields:**
    - `id`: UUID (PK)
    - `roomId`: UUID (FK)
    - `row`: String (A, B, C...)
    - `number`: Int
    - `type`: Enum (NORMAL, VIP, SWEETBOX)

### Table: Booking (Critical for Seat Locking)
- **Status:** PENDING, PAID, CANCELLED.
- **Locking Logic (Redis):** Sử dụng key `lock:showtimeId:seatId` với TTL 300s. Lưu trữ `userId` để xác thực người giữ lock.

---

## Full Prisma Schema

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  USER
}

enum MovieStatus {
  NOW_SHOWING
  COMING_SOON
}

enum BookingStatus {
  PENDING
  PAID
  CANCELLED
}

model User {
  id        String    @id @default(uuid())
  email     String    @unique
  password  String
  name      String?
  role      Role      @default(USER)
  bookings  Booking[]
  reviews   Review[]
  chatSessions AIChatSession[]
  createdAt DateTime  @default(now())
}

model Movie {
  id          String      @id @default(uuid())
  title       String
  description String      @db.Text
  trailerUrl  String
  posterUrl   String
  status      MovieStatus
  genres      Genre[]
  showtimes   Showtime[]
  reviews     Review[]
}

model Genre {
  id     String  @id @default(uuid())
  name   String  @unique
  movies Movie[]
}

model TheaterRoom {
  id        String     @id @default(uuid())
  name      String
  capacity  Int
  seats     Seat[]
  showtimes Showtime[]
}

model Seat {
  id       String      @id @default(uuid())
  roomId   String
  room     TheaterRoom @relation(fields: [roomId], references: [id])
  row      String
  number   Int
  type     String      @default("NORMAL") // NORMAL, VIP, SWEETBOX
  bookingSeats BookingSeat[]
}

model Showtime {
  id        String      @id @default(uuid())
  movieId   String
  movie     Movie       @relation(fields: [movieId], references: [id])
  roomId    String
  room      TheaterRoom @relation(fields: [roomId], references: [id])
  startTime DateTime
  endTime   DateTime
  priceBase Float
  bookings  Booking[]
}

model Booking {
  id         String        @id @default(uuid())
  userId     String
  user       User          @relation(fields: [userId], references: [id])
  showtimeId String
  showtime   Showtime      @relation(fields: [showtimeId], references: [id])
  status     BookingStatus @default(PENDING)
  totalAmount Float
  seats      BookingSeat[]
  orderItems OrderItem[]
  createdAt  DateTime      @default(now())
}

model BookingSeat {
  id        String  @id @default(uuid())
  bookingId String
  booking   Booking @relation(fields: [bookingId], references: [id])
  seatId    String
  seat      Seat    @relation(fields: [seatId], references: [id])
  price     Float
}

model Combo {
  id          String @id @default(uuid())
  name        String
  description String
  price       Float
  orderItems  OrderItem[]
}

model OrderItem {
  id        String  @id @default(uuid())
  bookingId String
  booking   Booking @relation(fields: [bookingId], references: [id])
  comboId   String
  combo     Combo   @relation(fields: [comboId], references: [id])
  quantity  Int
}

model Review {
  id      String @id @default(uuid())
  userId  String
  user    User   @relation(fields: [userId], references: [id])
  movieId String
  movie   Movie  @relation(fields: [movieId], references: [id])
  rating  Int
  comment String
}

model AIChatSession {
  id        String          @id @default(uuid())
  userId    String
  user      User            @relation(fields: [userId], references: [id])
  messages  AIChatMessage[]
  createdAt DateTime        @default(now())
}

model AIChatMessage {
  id        String        @id @default(uuid())
  sessionId String
  session   AIChatSession @relation(fields: [sessionId], references: [id])
  role      String        // user, assistant
  content   String        @db.Text
  createdAt DateTime      @default(now())
}
```
