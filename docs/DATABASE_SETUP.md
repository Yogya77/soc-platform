# Database Architecture & Setup Guide

**Cybersecurity Operations Center (SOC) Platform**  
**Database:** PostgreSQL 16  
**ORM:** Prisma ORM 6  

---

## 1. Quick Start Options

You can run PostgreSQL using any of the three options below depending on your machine setup.

---

### Option A: Docker Desktop (Recommended for Containers)

If Docker Desktop is installed on Windows:

1. **Start the database container:**
   ```powershell
   docker compose up -d
   ```
2. **Verify container is running:**
   ```powershell
   docker ps
   ```
   *(Container `soc-postgres` will be healthy on port `5432`)*.
3. **Run migrations and populate seed data:**
   ```powershell
   npm run db:migrate
   npm run db:seed
   ```

---

### Option B: Native Windows PostgreSQL Installation (No Docker Required)

If Docker is not installed on your system:

1. **Download and Install PostgreSQL for Windows:**
   - Download the official installer from EnterpriseDB:  
     👉 [https://www.enterprisedb.com/downloads/postgres-postgresql-downloads](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads) (Choose PostgreSQL 16 for Windows x86-64).
   - Alternatively, via Windows Package Manager:
     ```powershell
     winget install PostgreSQL.PostgreSQL.16
     ```
2. **During installation:**
   - Keep the default port: `5432`.
   - Set the `postgres` superuser password to: `soc_secure_password_2026`  
     *(Or choose your own password and update `DATABASE_URL` in `.env`)*.
3. **Create the SOC database:**
   - Open **pgAdmin** or **SQL Shell (psql)** from the Windows Start menu.
   - Run:
     ```sql
     CREATE DATABASE soc_platform_db;
     ```
4. **Configure `.env`:**
   Ensure `DATABASE_URL` in `.env` matches your credentials:
   ```ini
   DATABASE_URL="postgresql://postgres:soc_secure_password_2026@localhost:5432/soc_platform_db?schema=public"
   ```
5. **Apply schema & seed data:**
   ```powershell
   npm run db:migrate
   npm run db:seed
   ```

---

### Option C: Instant Cloud PostgreSQL (Zero Local Installation)

If you prefer not to install anything locally, you can use any free managed PostgreSQL instance (e.g., Supabase or Neon):

1. Create a free PostgreSQL database at [https://supabase.com](https://supabase.com) or [https://neon.tech](https://neon.tech).
2. Copy the Connection String provided in the dashboard.
3. Paste it directly into your `.env` file:
   ```ini
   DATABASE_URL="postgresql://[user]:[password]@[host]:5432/[dbname]?schema=public&sslmode=require"
   ```
4. Run migrations and seed:
   ```powershell
   npm run db:migrate
   npm run db:seed
   ```

---

## 2. Database Management Commands

| Action | Command | Description |
|---|---|---|
| **Generate Prisma Client** | `npm run db:generate` | Compiles TypeScript types matching the database schema. |
| **Apply Migrations** | `npm run db:migrate` | Applies pending migrations to the PostgreSQL database. |
| **Seed Initial Security Data** | `npm run db:seed` | Populates assets, detection rules, threat intel, events, alerts, and admin users. |
| **Launch Prisma Studio** | `npm run db:studio` | Opens an interactive web GUI at `http://localhost:5555` to browse records. |

---

## 3. Seeded Accounts & Credentials

The seed script creates the following default accounts (passwords hashed with `bcryptjs`):

| Email | Default Password | Role | Description |
|---|---|---|---|
| `admin@soc.internal` | `Admin@2026!` | `ADMIN` | Full administrative permissions, settings & rule management. |
| `sarah.jenkins@soc.internal` | `Analyst@2026!` | `LEAD_ANALYST` | Lead Incident Responder, triage, escalation, report generation. |
| `marcus.vance@soc.internal` | `Analyst@2026!` | `TIER2_ANALYST` | Detection triage, playbook approvals, host quarantine. |
| `auditor@soc.internal` | `Auditor@2026!` | `READ_ONLY` | Compliance and forensic audit log review. |

---

## 4. Backup & Restore Procedures

### Database Backup (Dump)
To generate a timestamped compressed SQL backup:
```powershell
# Using native pg_dump
pg_dump -U postgres -d soc_platform_db -F c -b -v -f "backup_soc_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump"

# Or using Docker container
docker exec -t soc-postgres pg_dump -U postgres -d soc_platform_db -F c -b -v > backup_soc.dump
```

### Database Restore
To restore from a backup file:
```powershell
# Using native pg_restore
pg_restore -U postgres -d soc_platform_db -v -c "backup_soc.dump"

# Or using Docker container
cat backup_soc.dump | docker exec -i soc-postgres pg_restore -U postgres -d soc_platform_db -v -c
```
