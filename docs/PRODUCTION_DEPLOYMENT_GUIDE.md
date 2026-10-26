# 🚀 Hướng Dẫn Toàn Diện Triển Khai Production (Production Deployment Guide)
> **Dự án**: CoiCine - Modern AI-Powered Cinema Booking Platform  
> **Phiên bản tài liệu**: 2.0 (Cập nhật sau hoàn thành Phase 8 & Phase 9)  
> **Tác giả**: cinemaAgent & Tuandaca  

---

## 📑 Mục lục
1. [Kiến Trúc Hệ Thống & Luồng Dữ Liệu](#1-kiến-trúc-hệ-thống--luồng-dữ-liệu)
2. [So Sánh & Lựa Chọn Phương Án Hạ Tầng](#2-so-sánh--lựa-chọn-phương-án-hạ-tầng)
3. [Checklist Chuẩn Bị & Biến Môi Trường (Environment Variables)](#3-checklist-chuẩn-bị--biến-môi-trường-environment-variables)
4. [Phương Án 1: Triển Khai Cloud PaaS (Vercel + Railway + Supabase + Upstash)](#4-phương-án-1-triển-khai-cloud-paas-vercel--railway--supabase--upstash)
5. [Phương Án 2: Triển Khai Self-Hosted VPS (Docker Compose + Nginx + SSL Certbot)](#5-phương-án-2-triển-khai-self-hosted-vps-docker-compose--nginx--ssl-certbot)
6. [Quản Lý Cơ Sở Dữ Liệu: Migration, Seed & Backup](#6-quản-lý-cơ-sở-dữ-liệu-migration-seed--backup)
7. [Quy Trình Kiểm Thử Khói Sau Triển Khai (Production Smoke Test)](#7-quy-trình-kiểm-thử-khói-sau-triển-khai-production-smoke-test)
8. [Giám Sát (Monitoring), Cảnh Báo & Kế Hoạch Phục Hồi (Rollback Runbook)](#8-giám-sát-monitoring-cảnh-báo--kế-hoạch-phục-hồi-rollback-runbook)

---

## 1. Kiến Trúc Hệ Thống & Luồng Dữ Liệu

CoiCine được phát triển theo mô hình **Monorepo** với Turborepo, bao gồm 2 ứng dụng cốt lõi:
- **`apps/web`**: Next.js 15 (App Router, Standalone build, SSR & ISR, TailwindCSS, Framer Motion).
- **`apps/api`**: NestJS 10 (Modular Architecture, Prisma ORM, Socket.io Real-time Gateway, VietQR Napas 247, Stripe Live, PayOS Webhook).
- **`packages/shared`**: Thư viện dùng chung DTO, Types, Validations.

```mermaid
flowchart TD
    subgraph Users["Khách Hàng & Quản Trị Viên"]
        Browser["Trình duyệt / Thiết bị Di Động"]
    end

    subgraph CDN_Gateway["Hạ Tầng Mạng & Tên Miền"]
        DNS["Cloudflare DNS / Let's Encrypt SSL"]
        LB["Nginx Reverse Proxy / Vercel Edge CDN"]
    end

    subgraph Application_Tier["Tầng Ứng Dụng (Application Tier)"]
        NextWeb["Frontend: Next.js 15 App Router\n(Port 3000 / Standalone)"]
        NestAPI["Backend: NestJS 10 Modular API\n(Port 3006 / REST & WSS)"]
        SocketEngine["Socket.io WebSocket Server\n(/booking Namespace - Real-time Lock)"]
    end

    subgraph Data_Tier["Tầng Dữ Liệu & Bộ Nhớ Đệm (Data Tier)"]
        PostgresDB[("PostgreSQL\n(Supabase Connection Pooler: 6543 / Direct: 5432)")]
        RedisCache[("Redis Engine / Upstash\n(Pub/Sub & 10-Minute Seat Locks)")]
    end

    subgraph External_Services["Dịch Vụ Bên Ngoài (Third-Party Integrations)"]
        VietQR["VietQR Napas 247 QuickLink Engine"]
        Stripe["Stripe Live Card Payment Gateway"]
        PayOS["PayOS Bank Transfer Gateway"]
        GeminiAI["Google Gemini 2.5 Flash (AI Chatbot)"]
        TMDB["TMDB / OMDb Media Posters CDN"]
    end

    Browser -->|HTTPS :443| DNS
    DNS --> LB
    LB -->|SSR Pages & Static Assets| NextWeb
    LB -->|API REST Requests| NestAPI
    LB -->|WSS Bidirectional Stream| SocketEngine

    NextWeb -->|Internal Proxy /api/*| NestAPI
    NestAPI -->|Prisma Connection Pooler| PostgresDB
    SocketEngine <-->|Seat Hold Locks & Heartbeat| RedisCache
    NestAPI -->|Generate QR Code| VietQR
    NestAPI -->|Payment Intent / Webhooks| Stripe
    NestAPI -->|Transfer Verification| PayOS
    NestAPI -->|Recommendation Prompts| GeminiAI
    Browser -->|Poster Images| TMDB
```

---

## 2. So Sánh & Lựa Chọn Phương Án Hạ Tầng

| Tiêu chí | Phương Án 1: Cloud PaaS (Vercel + Railway + Supabase) | Phương Án 2: Self-Hosted VPS (Docker Compose + Nginx) |
| :--- | :--- | :--- |
| **Thích hợp cho** | **MVP, ra mắt nhanh, demo khách hàng, tải trung bình** *(Khuyên dùng)* | **Doanh nghiệp, tối ưu chi phí cố định, tải cao ổn định** |
| **Chi phí ước tính** | $0 - $20/tháng (Có thể chạy hoàn toàn trên Free/Hobby Tier ban đầu) | $10 - $25/tháng (Hetzner CPX21: 3 vCPU/4GB RAM hoặc DigitalOcean 2 vCPU/4GB RAM) |
| **Độ khó vận hành** | ⭐ (Rất dễ - Zero server administration, Git push auto deploy) | ⭐⭐⭐ (Trung bình - Cần quản lý Linux, Nginx, SSL, UFW Firewall) |
| **Quản lý WebSocket** | Railway / Render hỗ trợ duy trì kết nối WSS 24/7 mượt mà | Nginx proxy pass cấu hình `Upgrade` và `Connection` giữ kết nối ổn định |
| **Sao lưu & Phục hồi** | Tự động qua Dashboard Supabase & 1-Click Rollback Vercel/Railway | Cần cài đặt Cronjob backup Postgres ra S3 / Storage ngoài |
| **Khả năng co giãn (Scale)** | Tự động tăng hạ tài nguyên theo lượt truy cập | Cần nâng cấp gói VPS (Vertical Scale) hoặc cấu hình Swarm/K8s |

> [!TIP]
> **Khuyến nghị lộ trình**:
> 1. **Giai đoạn 1 (Ra mắt & Nghiệm thu)**: Triển khai theo **Phương án 1 (Cloud PaaS)** để đưa vào hoạt động ngay trong 15-30 phút mà không gặp rủi ro cấu hình máy chủ.
> 2. **Giai đoạn 2 (Scale thương mại lớn)**: Chuyển sang **Phương án 2 (VPS Docker Compose)** nếu muốn gom toàn bộ hạ tầng về 1 máy chủ để tối ưu ngân sách cố định hàng tháng.

---

## 3. Checklist Chuẩn Bị & Biến Môi Trường (Environment Variables)

### 3.1. Danh mục dịch vụ cần đăng ký trước
- [ ] **Tên miền (Domain)**: Ví dụ `coicine.vn`. Cần trỏ 2 bản ghi DNS:
  - `@` hoặc `www` -> Trỏ về Vercel (hoặc IP VPS)
  - `api` -> Trỏ về Railway/Render (hoặc IP VPS)
- [ ] **Database Supabase**: Đăng ký dự án miễn phí tại [supabase.com](https://supabase.com). Lưu lại:
  - `Direct Database URL` (port 5432 - dùng để chạy Prisma migration).
  - `Connection Pooling URL` (port 6543 - dùng cho NestJS runtime).
- [ ] **Redis (Upstash)**: Đăng ký tại [upstash.com](https://upstash.com) lấy URL `rediss://...`.
- [ ] **Tài khoản Ngân hàng nhận tiền VietQR**:
  - Mã BIN ngân hàng (ví dụ Vietcombank: `970436`, MBBank: `970422`, Techcombank: `970407`).
  - Số tài khoản và tên chủ tài khoản viết hoa không dấu.
- [ ] **Cổng thanh toán quốc tế (Stripe)**: Đăng ký tại [stripe.com](https://stripe.com) lấy `Publishable Key` và `Secret Key`.
- [ ] **AI Engine (Google Gemini)**: Đăng ký tại [aistudio.google.com](https://aistudio.google.com) lấy `GOOGLE_GENERATIVE_AI_API_KEY`.

---

### 3.2. Bảng Biến Môi Trường Master

#### A. Backend API (`apps/api/.env`)
| Tên Biến | Ý nghĩa | Ví dụ Production | Bắt buộc |
| :--- | :--- | :--- | :---: |
| `NODE_ENV` | Môi trường chạy | `production` | Có |
| `PORT` | Cổng dịch vụ lắng nghe | `3006` | Có |
| `DATABASE_URL` | Kết nối PostgreSQL Pooler | `postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true` | Có |
| `DIRECT_URL` | Kết nối PostgreSQL trực tiếp | `postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres` | Có |
| `REDIS_URL` | Chuỗi kết nối Redis Upstash / VPS | `rediss://default:[token]@[endpoint].upstash.io:6379` | Có |
| `JWT_SECRET` | Khóa bí mật mã hóa Access Token | *Chuỗi ngẫu nhiên 64 ký tự (dùng `openssl rand -hex 32`)* | Có |
| `JWT_EXPIRES_IN` | Thời gian sống của Token | `7d` | Có |
| `CORS_ORIGINS` | Danh sách domain Frontend cho phép | `https://coicine.vn,https://www.coicine.vn` | Có |
| `VIETQR_BANK_ID` | Mã định danh BIN ngân hàng | `970436` (Vietcombank) | Có |
| `VIETQR_ACCOUNT_NO` | Số tài khoản nhận tiền | `1028472918` | Có |
| `VIETQR_ACCOUNT_NAME` | Tên chủ tài khoản nhận | `CONG TY TNHH COICINE VIETNAM` | Có |
| `VIETQR_TEMPLATE` | Mẫu hiển thị QR VietQR | `compact2` | Có |
| `STRIPE_SECRET_KEY` | Khóa bí mật Stripe Live | `your-stripe-secret-key` | Tùy chọn |
| `STRIPE_WEBHOOK_SECRET`| Khóa xác thực Webhook Stripe | `your-stripe-webhook-secret` | Tùy chọn |
| `PAYOS_CLIENT_ID` | Client ID của PayOS | `xxxxxxxx-xxxx-xxxx` | Tùy chọn |
| `PAYOS_API_KEY` | API Key của PayOS | `xxxxxxxx-xxxx-xxxx` | Tùy chọn |
| `PAYOS_CHECKSUM_KEY` | Checksum Key của PayOS | `xxxxxxxxxxxxxxxxxxxxxxxx` | Tùy chọn |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Khóa Google AI Gemini | `your-gemini-api-key` | Có |

#### B. Frontend Web (`apps/web/.env.production` hoặc Vercel Dashboard)
| Tên Biến | Ý nghĩa | Ví dụ Production | Bắt buộc |
| :--- | :--- | :--- | :---: |
| `NODE_ENV` | Môi trường chạy | `production` | Có |
| `PORT` | Cổng chạy container Next.js | `3000` | Có |
| `INTERNAL_API_URL` | URL gọi API từ Next.js Server | `https://api.coicine.vn/api` (hoặc `http://api:3006/api` trong Docker) | Có |
| `NEXT_PUBLIC_API_URL` | URL gọi API từ Client trình duyệt | `/api` | Có |
| `NEXT_PUBLIC_SOCKET_URL` | URL kết nối WebSocket Client | `https://api.coicine.vn` | Có |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Khóa công khai Stripe Live | `your-stripe-publishable-key` | Tùy chọn |

---

## 4. Phương Án 1: Triển Khai Cloud PaaS (Vercel + Railway + Supabase + Upstash)

### Bước 4.1: Khởi tạo Cơ sở Dữ liệu Supabase & Đẩy Schema
1. Truy cập [database.new](https://database.new) để tạo dự án Supabase mới.
2. Đặt mật khẩu mạnh cho Database và chọn Region gần nhất (ví dụ: `Singapore - ap-southeast-1`).
3. Mở **Project Settings** -> **Database**:
   - Sao chép **Connection string (URI)** mục *Transaction Connection Pooler* (Port `6543`) làm `DATABASE_URL`.
   - Sao chép **Connection string (URI)** mục *Direct connection* (Port `5432`) làm `DIRECT_URL`.
4. Tại máy tính quản trị (hoặc qua GitHub Actions), chạy lệnh đẩy Prisma Schema lên Supabase:
   ```bash
   # Gán biến tạm thời và push schema
   set DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
   pnpm --filter api exec prisma db push
   ```
5. Chạy seed dữ liệu suất chiếu và ghế ngồi vào Database thật:
   ```bash
   pnpm --filter api exec prisma db seed
   ```

### Bước 4.2: Triển khai Redis Serverless trên Upstash
1. Đăng nhập [console.upstash.com](https://console.upstash.com).
2. Tạo database Redis mới, chọn Region `ap-southeast-1 (Singapore)` để cùng khu vực với Supabase.
3. Trong tab **Details**, sao chép chuỗi kết nối dạng `rediss://default:xxxx@xxxx.upstash.io:6379`.

### Bước 4.3: Triển khai Backend NestJS trên Railway
1. Truy cập [railway.app](https://railway.app) và nhấn **New Project** -> **Deploy from GitHub repo**.
2. Chọn repo `Tuandaca/cinema`.
3. Nhấp vào dịch vụ vừa tạo -> chọn tab **Settings**:
   - **Root Directory**: Để trống (hoặc `/`).
   - **Dockerfile Path**: Điền `apps/api/Dockerfile`.
   - **Healthcheck Path**: Điền `/api/health`.
   - **Restart Policy**: `On failure` (tối đa 10 lần).
4. Chọn tab **Variables** và điền toàn bộ danh sách biến tại [Mục 3.2.A](#a-backend-api-appsapienv):
   - `PORT`: `3006`
   - `DATABASE_URL`: `[Supabase Pooler URI]`
   - `REDIS_URL`: `[Upstash Redis URI]`
   - `CORS_ORIGINS`: `https://coicine.vn,https://www.coicine.vn`
   - `JWT_SECRET`: `[Chuỗi khóa bí mật]`
   - `VIETQR_BANK_ID`: `970436`
   - `VIETQR_ACCOUNT_NO`: `1028472918`
   - `VIETQR_ACCOUNT_NAME`: `CONG TY TNHH COICINE VIETNAM`
   - `GOOGLE_GENERATIVE_AI_API_KEY`: `[Gemini Key]`
5. Trong mục **Networking** -> **Custom Domain**: Nhập `api.coicine.vn` và làm theo hướng dẫn trỏ bản ghi CNAME từ DNS của bạn.

### Bước 4.4: Triển khai Frontend Next.js trên Vercel
1. Đăng nhập [vercel.com](https://vercel.com) -> **Add New Project** -> Chọn repo `Tuandaca/cinema`.
2. Trong phần cấu hình:
   - **Framework Preset**: Chọn `Next.js`.
   - **Root Directory**: Nhấn Edit chọn thư mục `apps/web`.
   - **Build Command**: Tự động nhận diện `turbo run build` hoặc để trống.
3. Điền các biến môi trường Production:
   - `INTERNAL_API_URL`: `https://api.coicine.vn/api`
   - `NEXT_PUBLIC_API_URL`: `/api`
   - `NEXT_PUBLIC_SOCKET_URL`: `https://api.coicine.vn`
4. Nhấn **Deploy**.
5. Sau khi build hoàn tất, vào **Settings** -> **Domains**: Thêm tên miền `coicine.vn` và `www.coicine.vn`.

---

## 5. Phương Án 2: Triển Khai Self-Hosted VPS (Docker Compose + Nginx + SSL Certbot)

### Bước 5.1: Cấu hình VPS ban đầu (Ubuntu 22.04 / 24.04 LTS)
Kết nối SSH vào máy chủ VPS và cập nhật các gói hệ thống:
```bash
ssh root@YOUR_SERVER_IP

# Cập nhật hệ điều hành
apt update && apt upgrade -y
apt install -y curl wget git ufw htop fail2ban dumb-init

# Cấu hình Firewall an toàn (chỉ mở SSH, HTTP, HTTPS)
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw default deny incoming
ufw default allow outgoing
ufw --force enable
```

### Bước 5.2: Cài đặt Docker & Docker Compose v2
```bash
# Cài đặt Docker Engine chính thức
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Cài đặt docker-compose plugin
apt install -y docker-compose-plugin

# Kiểm tra phiên bản
docker --version
docker compose version
```

### Bước 5.3: Tải mã nguồn & Tạo biến môi trường Production
```bash
# Tạo thư mục dự án
mkdir -p /var/www/cinema && cd /var/www/cinema
git clone https://github.com/Tuandaca/cinema.git .

# Tạo file môi trường production
cat << 'EOF' > .env.production
NODE_ENV=production
PORT=3006
POSTGRES_USER=cinema_admin
POSTGRES_PASSWORD=SuperStrongPassword_ChangeMe_2026!
POSTGRES_DB=coicine_prod

DATABASE_URL=postgresql://cinema_admin:SuperStrongPassword_ChangeMe_2026!@postgres:5432/coicine_prod?schema=public
REDIS_URL=redis://redis:6379

JWT_SECRET=f4d9218d098e9b46ef67f4019a2e38c94627198ba2904e57acbbdae284918e92
JWT_EXPIRES_IN=7d
CORS_ORIGINS=https://coicine.vn,https://www.coicine.vn

VIETQR_BANK_ID=970436
VIETQR_ACCOUNT_NO=1028472918
VIETQR_ACCOUNT_NAME=CONG TY TNHH COICINE VIETNAM
VIETQR_TEMPLATE=compact2

GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

INTERNAL_API_URL=http://api:3006/api
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SOCKET_URL=https://api.coicine.vn
EOF
```

### Bước 5.4: Khởi động hệ thống & Chạy Migration
Khởi chạy toàn bộ hệ thống bằng Docker Compose:
```bash
# Build và chạy ngầm các container
docker compose --env-file .env.production up -d --build

# Kiểm tra trạng thái các container
docker compose ps
```

Thực hiện đồng bộ Database Schema và nạp dữ liệu rạp/phim ban đầu:
```bash
# Chạy migration trong container API
docker compose exec api pnpm exec prisma db push

# Chạy seed dữ liệu suất chiếu và phòng rạp
docker compose exec api node dist/prisma/seed.js
```

### Bước 5.5: Cài đặt Nginx & Cấu hình Reverse Proxy WSS
Cài đặt Nginx:
```bash
apt install -y nginx certbot python3-certbot-nginx
```

Tạo file cấu hình virtual host `/etc/nginx/sites-available/coicine.conf`:
```nginx
# ========================================================
# 1. Frontend: coicine.vn & www.coicine.vn
# ========================================================
server {
    listen 80;
    server_name coicine.vn www.coicine.vn;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static Next.js assets
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        proxy_buffering on;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}

# ========================================================
# 2. Backend API & WebSocket: api.coicine.vn
# ========================================================
server {
    listen 80;
    server_name api.coicine.vn;

    # REST API Endpoints
    location / {
        proxy_pass http://127.0.0.1:3006;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket Real-time Seat Hold Connection
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3006/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Tăng timeout tránh ngắt kết nối WebSocket
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Kích hoạt cấu hình và cấp chứng chỉ SSL miễn phí:
```bash
ln -s /etc/nginx/sites-available/coicine.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Cấp chứng chỉ SSL tự động gia hạn với Certbot
certbot --nginx -d coicine.vn -d www.coicine.vn -d api.coicine.vn
```

---

## 6. Quản Lý Cơ Sở Dữ Liệu: Migration, Seed & Backup

### 6.1. Quy trình chạy Migration khi cập nhật tính năng mới
Tuyệt đối không chạy `prisma migrate reset` hoặc sửa bảng trực tiếp trên Production để tránh làm mất vé của khách hàng. Hãy làm theo quy trình:
1. Tạo migration mới trên máy Local: `pnpm --filter api exec prisma migrate dev --name feature_name`
2. Đẩy code lên GitHub.
3. Trên máy chủ Production:
   ```bash
   pnpm --filter api exec prisma migrate deploy
   ```

### 6.2. Thiết lập Cronjob sao lưu tự động hàng ngày (Automated Backup)
Trên VPS, tạo script sao lưu `/var/www/cinema/backup-db.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/coicine"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

# Dump PostgreSQL từ Docker container và nén gzip
docker compose -f /var/www/cinema/docker-compose.yml exec -T postgres pg_dump -U cinema_admin coicine_prod | gzip > "$BACKUP_DIR/coicine_backup_$TIMESTAMP.sql.gz"

# Xóa các bản sao lưu cũ hơn 14 ngày
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +14 -delete

echo "[$(date)] Sao lưu hoàn tất: coicine_backup_$TIMESTAMP.sql.gz" >> /var/log/coicine_backup.log
```

Cấp quyền thực thi và tạo Cronjob chạy lúc 2h sáng mỗi ngày:
```bash
chmod +x /var/www/cinema/backup-db.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/cinema/backup-db.sh") | crontab -
```

---

## 7. Quy Trình Kiểm Thử Khói Sau Triển Khai (Production Smoke Test)

Sau khi triển khai xong, QA hoặc DevOps cần thực hiện đầy đủ 7 bước kiểm tra sau:

```mermaid
flowchart LR
    Step1["1. Health Check API"] --> Step2["2. SSL & WSS Handshake"]
    Step2 --> Step3["3. Đăng Nhập & JWT"]
    Step3 --> Step4["4. Giữ Ghế Realtime (2 Tabs)"]
    Step4 --> Step5["5. Quét Mã VietQR Napas"]
    Step5 --> Step6["6. Vé Của Tôi & Dashboard"]
    Step6 --> Step7["7. Admin Quản Trị"]
```

| STT | Hạng mục kiểm tra | Thao tác thực hiện | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :---: | :--- | :--- | :--- |
| **1** | **Health Check** | Truy cập `https://api.coicine.vn/api/health` | Trả về HTTP 200 `{ "status": "ok", "timestamp": ... }`. |
| **2** | **SSL & WSS** | Mở F12 -> tab Network -> lọc `WS` | Kết nối WebSocket tới `https://api.coicine.vn/booking` đạt `101 Switching Protocols`, không có lỗi CORS. |
| **3** | **Weekly Showtimes** | Mở trang chi tiết phim bất kỳ | Chỉ hiển thị lịch chiếu trong 7 ngày tới; nhấn "Xem thêm suất chiếu tuần tới" tải thêm mượt mà. |
| **4** | **Khóa giờ quá khứ** | Xem các suất chiếu đã qua thời gian hiện tại | Bị làm mờ/disabled, không thể nhấp vào đặt vé; API từ chối nếu có can thiệp client. |
| **5** | **Real-time Seat Hold** | Dùng 2 trình duyệt độc lập cùng vào 1 suất chiếu | Trình duyệt A click chọn ghế -> Trình duyệt B lập tức thấy ghế chuyển sang **vàng cam phát sáng** (`othersSelecting`) và không thể chọn trùng. |
| **6** | **Thanh Toán VietQR** | Tiến hành đặt vé và chọn phương thức VietQR | Hiển thị mã QR chuẩn Napas 247, logo ngân hàng, số tiền và nội dung chuyển khoản chính xác `CC...`. |
| **7** | **Vé Của Tôi** | Click "Vé của tôi" trên thanh điều hướng | Hiển thị đúng 3 tab: Sắp chiếu, Đã xem, Đã hủy kèm thống kê chi tiêu VNĐ chính xác. |

---

## 8. Giám Sát (Monitoring), Cảnh Báo & Kế Hoạch Phục Hồi (Rollback Runbook)

### 8.1. Giám sát Uptime & Cảnh báo tức thì (Alerting)
- **Công cụ khuyến nghị**: [BetterStack](https://betterstack.com) hoặc [UptimeRobot](https://uptimerobot.com) (Cả hai đều có gói miễn phí).
- **Endpoint giám sát**:
  - `https://coicine.vn` (Frontend Check) -> Tần suất: 1 phút/lần.
  - `https://api.coicine.vn/api/health` (Backend & DB Check) -> Tần suất: 30 giây/lần.
- **Kênh nhận thông báo**: Tích hợp Telegram Bot hoặc Discord Webhook để nhận thông báo ngay khi website phản hồi > 2000ms hoặc mã lỗi 5xx.

### 8.2. Quy trình Rollback Khẩn cấp (Instant Rollback Runbook)

#### Khi sử dụng Vercel / Railway:
1. Truy cập Vercel Dashboard -> Tab **Deployments** -> Tìm phiên bản thành công gần nhất -> Nhấn menu `...` -> Chọn **Instant Rollback**.
2. Truy cập Railway Dashboard -> Tab **Deployments** -> Nhấn **Rollback** về commit trước đó.
3. Quá trình rollback hoàn tất trong chưa đầy 30 giây.

#### Khi sử dụng VPS Docker Compose:
Nếu phát hiện bản build mới có lỗi nghiêm trọng:
```bash
cd /var/www/cinema

# Quay về commit ổn định trước đó
git log --oneline -n 5
git checkout <COMMIT_HASH_ON_DINH>

# Rebuild và khởi động lại dịch vụ
docker compose --env-file .env.production up -d --build

# Kiểm tra log kiểm chứng
docker compose logs -f --tail=100 api
```

#### Khi cần khôi phục lại Database từ bản Backup:
```bash
cd /var/www/cinema
# Giải nén và nạp lại dữ liệu vào container
gunzip -c /var/backups/coicine/coicine_backup_YYYYMMDD_HHMMSS.sql.gz | docker compose exec -T postgres psql -U cinema_admin -d coicine_prod
```

---
*Tài liệu này được xác thực và bảo chứng bởi cinemaAgent. Mọi thắc mắc và yêu cầu hỗ trợ cấu hình hạ tầng vui lòng liên hệ Tuandaca (ngobongsu23@gmail.com).*
