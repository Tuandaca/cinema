# 06. API Specifications (REST)

## 1. Auth Module
- **POST `/api/auth/register`**
    - Body: `{ email, password, name }`
    - Validation: Zod (Email format, Min 8 chars password).
- **POST `/api/auth/login`**
    - Body: `{ email, password }`
    - Response: `{ accessToken, refreshToken, user }`
- **POST `/api/auth/refresh`**
    - Headers: `Authorization: Bearer <refreshToken>`

## 2. Movie Module
- **GET `/api/movies`**
    - Query: `?status=NOW_SHOWING&genre=Horror&page=1`
- **GET `/api/movies/:id`**
    - Response: Movie details + Showtimes grouped by date.
- **GET `/api/movies/search`**
    - Query: `?q=avengers`

## 3. Showtime & Booking Module
- **GET `/api/showtimes/:id/seats`**
    - Response: List of seats + status (Available/Locked/Booked).
- **POST `/api/bookings/lock`**
    - Auth: Required
    - Body: `{ showtimeId, seatIds: [] }`
    - Logic: Check Redis for existing locks. If clear, set lock TTL 5m.
- **POST `/api/bookings/confirm`**
    - Body: `{ bookingId, paymentMethod, comboItems: [] }`
    - Logic: Finalize DB transaction, release Redis lock.

## 4. AI Assistant Module
- **POST `/api/ai/chat`**
    - Body: `{ message, sessionId? }`
    - Logic: Call OpenAI with Function Calling (searchMovies, getShowtimes).
- **GET `/api/ai/recommendations`**
    - Auth: Optional (based on history if logged in).

## Validation & Common Rules
- **Rate Limit:** 100 requests / 15 minutes per IP (except Auth).
- **Error Format:** `{ "statusCode": 400, "message": "Bad Request", "errors": [] }`
- **Auth:** JWT HTTP-only Cookie for Refresh Token, Header for Access Token.
