# Mini ATM Predict — Agent Guide

Laravel 12 + React 18 SPA for BRI Link agents. Tracks cash/digital balance and predicts next-day cash needs via Single Exponential Smoothing (SES).

## Project architecture

- **Backend**: Laravel 12, PHP ^8.2, MySQL (local) / SQLite `:memory:` (tests)
- **Frontend**: React 18 SPA (no Inertia), Vite, Tailwind CSS, Recharts, React Router, Lucide React
- **Auth**: API token via Sanctum (Bearer token stored in localStorage)
- **Key packages**: `barryvdh/laravel-dompdf` (PDF), `maatwebsite/excel` (XLSX), `laravel/sanctum`

### Directory ownership

| Path | What |
|---|---|
| `app/Http/Controllers/Api/` | All API controllers (Auth, Transaction, Prediction, Dashboard, Cash, Report) |
| `app/Http/Controllers/Api/AuthController.php` | API auth (login, register, logout, user) via Sanctum tokens |
| `app/Services/SESService.php` | Core prediction logic (SES, MAPE, optimal alpha search) |
| `app/Exports/TransactionsExport.php` | Excel export |
| `resources/views/app.blade.php` | Root HTML shell for React SPA (single `<div id="root">`) |
| `resources/views/pdf/` | Blade PDF template for dompdf |
| `resources/js/main.jsx` | React entry point |
| `resources/js/App.jsx` | Router setup (React Router) |
| `resources/js/api/client.js` | Axios instance with Bearer token interceptor |
| `resources/js/context/AuthContext.jsx` | Auth state management (login, logout, register) |
| `resources/js/Pages/` | Route-level page components (Login, Register, Dashboard, Transactions, Prediction) |
| `resources/js/Components/` | Reusable React components (Sidebar, Layout, StatsCard, etc.) |

### Key models

- `Transaction` — all cash movements. `jenis` enum: `tarik_tunai`, `setor_tunai`, `transfer`, `ppob`, `topup_digital`, `restock_kas`
- `CashHistory` — table exists, model exists, **not referenced by any controller** (dead code)
- `User` — has `role` attribute (`owner` checked via `isOwner()`)

## API endpoints (all in `routes/api.php`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/login` | No | Login, returns Bearer token |
| POST | `/api/register` | No | Register, returns Bearer token |
| POST | `/api/logout` | Sanctum | Revoke current token |
| GET | `/api/user` | Sanctum | Get authenticated user |
| PUT | `/api/user` | Sanctum | Update profile |
| GET | `/api/dashboard/summary` | Sanctum | Dashboard summary stats + liquidity status |
| GET | `/api/dashboard/transactions-last-30-days` | Sanctum | Daily grouped transaction data for chart |
| GET | `/api/transactions` | Sanctum | All transactions (desc order) |
| POST | `/api/transactions` | Sanctum | Create transaction |
| GET | `/api/prediction/current` | Sanctum | Current SES prediction & recommendations |
| GET | `/api/prediction/chart` | Sanctum | Chart data (actuals + forecasts) |
| POST | `/api/topup-digital` | Sanctum | Topup digital balance (min Rp50k) |
| POST | `/api/restock-kas` | Sanctum | Restock cash balance (min Rp100k) |
| GET | `/api/export/excel` | Sanctum | Download Excel export |
| GET | `/api/export/pdf` | Sanctum | Download PDF export |

## Commands

```bash
# Dev server (concurrent: artisan serve, queue:listen, pail logs, Vite HMR)
composer run dev

# Full tests (runs `config:clear` first)
composer run test
# Or directly:
php artisan test
php artisan test --filter=TestName

# Full setup from scratch (creates .env, generates key, migrates, builds frontend)
composer run setup

# Seed 60 dummy transactions (30 days of tarik_tunai + transfer)
php artisan db:seed --class=TransactionSeeder
# Reset everything:
php artisan migrate:fresh --seed

# Frontend dev (Vite HMR on :5173, proxies `/api` to :8000)
npm run dev
# Production build
npm run build
```

## Important quirks

- **Frontend is standalone React SPA** (no Inertia). Served via catch-all route in `routes/web.php`.
- **`.env` uses MySQL** (set `DB_CONNECTION=mysql`). `.env.example` defaults to SQLite. Tests always use SQLite `:memory:` (set in `phpunit.xml`).
- **Auth flow**: Login returns a Sanctum Bearer token stored in `localStorage`. All API calls attach `Authorization: Bearer <token>`. On 401, token is cleared and redirect to `/login`.
- **Session, Cache, Queue** all use `database` driver.
- **ReportController** has an unregistered `profitLoss()` method (no route bound).
- **Default initial balances**: Kas = Rp5,000,000, Digital = Rp3,000,000 (hardcoded in `TransactionController::store`).
- **SES prediction** uses alpha search over [0.1–0.9], picks lowest MAPE, adds 20% buffer on recommendations.
- **Liquidity thresholds**: `kritis` (Kas < 2M or Digital < 1M), `warning` (Kas < 4M or Digital < 2M), `aman`.
- **Minimum transaction amounts**: regular = Rp1,000; `topup_digital` = Rp50,000; `restock_kas` = Rp100,000.
- **Tests are sparse** — only Laravel Breeze auth tests + boilerplate ExampleTest. No tests exist for Transaction, Prediction, or SES logic.
- **`phpunit.xml` defines** SQLite in-memory, disables Pulse/Telescope/Nightwatch for tests.

## Conventions

- All monetary values stored as `decimal(15,2)` in DB, cast to `decimal:2` in models.
- IDR formatting: `new Intl.NumberFormat("id-ID")` in JS, `number_format(x, 0, ',', '.')` in PHP.
- All controllers return JSON with `{ success: bool, data/message }` envelope.
- Exports (Excel/PDF) use `fetch()` with Bearer token + blob download (not direct `<a href>`).
