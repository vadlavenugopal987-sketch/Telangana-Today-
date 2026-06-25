# AdBook Chronicle – Advertiser Billing Management System
### DBMS & Software Engineering Course Project Submission

AdBook Chronicle is a centralized advertising management web application designed for newspaper and media publishers. It provides a simple, structured interface to manage advertisers, scheduling, billing invoices, partial payment tracking, and analytics logs.

---

## 🛠️ Tech Stack & Architecture
- **Frontend Core**: React 19 (TypeScript) + Vite Bundler
- **Styling**: Tailwind CSS (Minimal Black & White high-contrast theme)
- **Routing**: TanStack Router
- **State Management & Caching**: TanStack Query
- **Data Visualizations**: Recharts
- **Database Systems**: Supabase PostgreSQL (Production mode) / Browser LocalStorage Cache (Local mode fallback)

---

## 📂 Core Database Schema

The database relies on 6 relational tables (refer to [schema.sql](file:///C:/Users/VENU%20GOPAL/Downloads/first%20project%20in%20antigravity/schema.sql)):
1. **profiles**: Linked to Supabase Auth. Holds full names, emails, and user roles (`Admin`, `Manager`, `Staff`).
2. **advertisers**: Stores company profiles, contact numbers, email files, address strings, and GSTIN registration numbers.
3. **campaigns**: Tracks medium types (`Digital`, `Print`, `Radio`, `OOH`, `TV`), duration schedules, total insertions, and baseline billing amounts.
4. **invoices**: Automatically calculated subtotal, 18% standard GST tax, total billed, due dates, and payment states (`Paid`, `Pending`, `Partial`, `Overdue`).
5. **payments**: Records collection transaction dates, reference codes, payment gateways, and monetary amounts.
6. **activity_logs**: Keeps a rolling system audit trail of all database write operations.

---

## 🚀 Setup & Installation

### 1. Install Project Dependencies
Run the following package install command inside the repository root directory:
```bash
npm install
```

### 2. Run Local Development Server
Start the Vite developer environment:
```bash
npm run dev
```
Navigate to `http://localhost:5173`. By default, the application runs in **Local Database Mode**, storing all table records inside your browser's local cache.

### 3. Connect to Supabase Cloud Instance (Optional)
To run the database in live production mode:
1. Copy the SQL commands inside [schema.sql](file:///C:/Users/VENU%20GOPAL/Downloads/first%20project%20in%20antigravity/schema.sql) and execute them in your Supabase SQL editor.
2. Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. Restart the developer server (`npm run dev`). The system will automatically detect the variables and sync data with the cloud server!
