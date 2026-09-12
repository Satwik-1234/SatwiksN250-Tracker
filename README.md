# 🏍️ Satwik's Bajaj Pulsar N250 Tracker

A full-stack, real-time tracking web application dedicated to the **Bajaj Pulsar N250**. Log and visualize fuel expenses, calculate accurate mileage metrics, track highway trips with cluster economy comparison, manage maintenance service records & billing invoices, and keep gear purchases organized.

Live Demo / Deployment Ready on **Vercel** with **PostgreSQL** & **Supabase Storage**.

---

## ✨ Features

- ⛽ **Fuel Logging & Analytics**:
  - Full-tank vs partial fill tracking.
  - Automatic distance-from-last, fuel cost/km, and true km/L calculation.
  - Interactive fuel economy trends, monthly spending breakdown, and brand performance charts.
- 🛣️ **Upgraded Trip Tracker (Highway & Touring)**:
  - Record trips with **From $\rightarrow$ To** locations, departure/arrival timestamps, and start/end odometers.
  - **Instrument Cluster (MID) vs Actual Fuel Economy**: Real-time comparison between what the bike's digital meter reports vs calculated fuel economy.
  - Digital Ticket Card aesthetic with elevation, weather, and distance badges.
- 🔧 **Service & Maintenance Records**:
  - Log periodic services, oil changes, chain lubrication, and repairs with center names and costs.
  - Attach bills and invoices (**PDF, HTML, PNG, JPEG, WebP** up to 25MB).
- 📱 **Universal Document & PDF Viewer (Mobile & Desktop)**:
  - **Mobile (Android & iOS)**: 1-tap launcher into your phone's native **Google Drive Offline PDF Viewer** or system default reader using Web Share API and Android Intent protocols.
  - **Desktop**: Full-fidelity **Chrome Native PDF Viewer** (`<embed>`) with multi-page navigation, zoom, rotate, search, and direct printing.
- 🛡️ **Owner Security Mode**:
  - Quick PIN authentication (`OWNER_PIN`) to protect log modifications while keeping the dashboard public for viewing.
- ⚡ **Full-Stack Next.js 16 + Serverless PostgreSQL**:
  - Runs with PostgreSQL connection pooling (`pg` with SSL) or direct Supabase client fallback.
  - Fully dynamic API routes (`/api/fuel-logs`, `/api/trips`, `/api/services`, `/api/accessories`, `/api/auth/owner`, `/api/init-db`).

---

## 🏗️ Architecture & Tech Stack

- **Framework**: [Next.js 16 (App Router + Turbopack)](https://nextjs.org/)
- **UI & Styling**: React 19, Tailwind CSS v4, Lucide Icons
- **Charts**: Recharts, Plotly.js, MUI X-Charts
- **Database**: PostgreSQL (Supabase, CockroachDB 5GB Free Tier, or Neon)
- **Object Storage**: Supabase Storage (`bike_documents_N250` public bucket)
- **Deployment**: Vercel

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Satwik-1234/SatwiksN250-Tracker.git
cd SatwiksN250-Tracker
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

Fill in your database and Supabase credentials:
```env
# 1. PostgreSQL Database Connection
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"

# 2. Owner Security PIN
OWNER_PIN="2500"

# 3. Supabase Client & Storage
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
```

### 4. Initialize Database Schema
Run the master PostgreSQL schema script in your Supabase SQL Editor:
- Open [`schema.sql`](schema.sql) and paste into the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql).
- Or run the CLI setup script:
  ```bash
  npm run db:init
  ```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view your dashboard.

---

## 📦 Vercel Deployment

1. Push your repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add the following **Environment Variables** in Vercel Project Settings:
   - `DATABASE_URL`
   - `OWNER_PIN`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy! Next.js will automatically build and deploy the full-stack serverless app.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
