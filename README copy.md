<div align="center">
	<h1>🏸 QuickCourt</h1>
	<p><strong>Real‑time multi‑sport court discovery, booking & engagement platform.</strong></p>
	<p>
		<em>Fast search · Instant slot locking · Secure payments · Loyalty & rewards · Admin / Owner workflows</em>
	</p>
	<br/>
	<img src="public/placeholder.svg" width="120" alt="QuickCourt" />
</div>

---

## ✨ Core Features

| Domain | Capabilities |
| ------ | ------------ |
| Booking Engine | Live availability, overlap prevention (transactional), streak & points awarding |
| Payments | Razorpay (order, capture verify, refunds, webhook signature validation) |
| Auth & Security | OTP signup verification, JWT (access + refresh), role based (USER / OWNER / ADMIN) with Admin invite secret |
| Facilities | Owner submission → Admin approval workflow (approval events scaffolded) |
| Gamification | Points ledger, daily streak tracking, referral codes, badge evaluation, rewards tab in profile |
| UI / UX | Vite + React + Tailwind + shadcn/ui + Motion FX, gradient brand system, responsive nav & booking flow |
| Infrastructure | PostgreSQL (Neon serverless ready), Prisma schema & migrations, structured env config |
| Real‑time (Planned) | Socket.IO channel scaffolding for booking/facility events |

---

## 🗂 Monorepo Layout

```
root
├─ src/                # Frontend (React + Vite prototype)
├─ server/             # Backend (Express, Prisma, Neon Postgres)
│  ├─ prisma/          # Schema & migrations
│  ├─ src/modules/     # Feature modules (auth, booking, loyalty, badges, etc.)
│  └─ src/services/    # Business logic & external integrations
└─ public/             # Static assets
```

> Future: Optionally migrate `src/` to Next.js App Router for SSR / edge.

---

## 🚀 Quick Start (Local Dev)

### 1. Clone & Install
```bash
git clone <repo-url>
cd QuickCourt
pnpm install # or npm / bun (project includes bun.lockb)
```

### 2. Backend Environment
```bash
cp server/.env.example server/.env
# Fill: DATABASE_URL, ACCESS/REFRESH secrets, ADMIN_INVITE_SECRET, optional SMTP
```

### 3. Run Postgres (Local) OR Use Neon
Local Docker:
```bash
docker run --name quickcourt-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=quickcourt -p 5432:5432 -d postgres:16
```
Neon (recommended for serverless): create DB → copy pooled connection string into `DATABASE_URL` (ensure `sslmode=require`).

### 4. Migrate & Launch Backend
```bash
cd server
pnpm install   # if not already
npx prisma migrate deploy
pnpm dev       # starts on http://localhost:4000
```

### 5. Launch Frontend
In another terminal:
```bash
pnpm dev  # Vite dev server (defaults to http://localhost:5173)
```

Health Check: http://localhost:4000/health

---

## 🔐 Environment Variables (server/.env)

| Key | Purpose |
| --- | ------- |
| NODE_ENV | runtime mode |
| PORT | backend port (default 4000) |
| DATABASE_URL | Postgres / Neon pooled URI |
| ACCESS_TOKEN_SECRET | 64+ char hex secret for JWT access tokens |
| REFRESH_TOKEN_SECRET | 64+ char hex secret for refresh tokens |
| ACCESS_TOKEN_TTL | e.g. 15m |
| REFRESH_TOKEN_TTL | e.g. 7d |
| OTP_TTL_MINUTES | OTP validity window |
| CORS_ORIGIN | Allowed origin for browser requests |
| SMTP_* | Optional email provider (future transactional mail) |
| ADMIN_INVITE_SECRET | Required to create ADMIN users |

Never commit real `.env` values — they are git‑ignored (see `.gitignore`).

---

## 🧩 Backend Architecture

Layered approach:
1. Route (Express Router) → input validation (Zod) → controller
2. Controller (thin) → service for business logic
3. Service → Prisma data layer (transactions for bookings & points)
4. Cross‑cutting: error middleware, auth JWT middleware, role guard, rate limit, loyalty & badge evaluators

Key Modules:
- Auth: signup (OTP), verify, login, refresh, logout
- Booking: create booking (locks slot, computes price, awards points)
- Loyalty: points ledger retrieval, referral code generation, apply referral (UI WIP), streak tracking
- Badges: evaluation on demand, listing earned badges
- Admin / Owner: approval workflow (scaffold)

---

## 💳 Payments (Razorpay)

Implemented: order creation, signature verification, webhook intake (validation), refund path. Payment modal integrated in booking flow. Future: idempotency keys & expanded failure analytics.

---

## 🏅 Gamification

| Feature | Detail |
| ------- | ------ |
| Points | Awarded per booking (duration based) + referral bonuses |
| Streaks | Daily activity tracked; displayed in profile rewards tab |
| Referral Codes | Each user can generate & share (reward processing service) |
| Badges | Evaluated using rules (service) and cached per user |
| Rewards UI | Profile > Rewards tab (points, streak, badges, ledger, referral) |

Planned: leaderboard, live socket updates, richer badge art.

---

## 🧪 Testing (Planned Additions)

Upcoming Jest + Supertest suites for:
1. Auth lifecycle
2. Facility approval flow
3. Booking overlap & points awarding
4. Payment signature verification
5. Referral reward processing

---

## 🛡 Security Notes

- Admin signup gated via `ADMIN_INVITE_SECRET`.
- JWT rotation strategy (short access / longer refresh). Consider moving refresh to HttpOnly cookie in prod.
- OTP currently logged (stub) → swap to real email/SMS provider.
- Rate limiting & error normalization middleware present.
- Neon DB uses TLS (`sslmode=require`).

---

## 🗺 Roadmap Snapshot

| Status | Item |
| ------ | ---- |
| ✅ | Razorpay integration (core flows) |
| ✅ | Loyalty & rewards surface in UI |
| 🚧 | Referral code application UX |
| 🚧 | Leaderboard & real‑time points push |
| 🚧 | Owner analytics & dashboards |
| 🚧 | Socket event emission & subscription |
| 📝 | Migrate to Next.js (optional) |
| 🧪 | Automated test suites |

Legend: ✅ Done · 🚧 In Progress / Planned · 📝 Investigating

---

## 🤝 Contributing

1. Create a branch: `feat/<short-desc>`
2. Keep PRs focused & small; include screenshots for UI changes.
3. Use Conventional Commits (`feat:`, `fix:`, `chore:` ...).
4. Run lint & type check before pushing.

---

## 📜 License

Internal hackathon project (2025). All rights reserved. Not yet open‑sourced.

---

## 🙋 FAQ (Mini)

| Q | A |
| - | - |
| Why Vite instead of Next.js now? | Rapid iteration; migration path preserved. |
| How are overlapping bookings prevented? | Prisma transaction with time window conflict check. |
| Where do points come from? | Booking duration multipliers + referral bonuses. |
| Can I run without Razorpay keys? | Yes, flows degrade to mock until keys added. |

---

### ⭐ Tip
Generate long random secrets quickly: `openssl rand -hex 64`.

---

<sub>Built for speed, clarity & extensibility. PRs that improve DX/UX welcome once repository is opened.</sub>
