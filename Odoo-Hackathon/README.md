# VendorBridge

Full-stack procurement and vendor management ERP for vendors, RFQs, quotations, approvals, purchase orders, invoices, reports, and activity tracking.

## Stack

- Frontend: Next.js 16 App Router, React 19, Recharts, vanilla CSS
- Backend: Node.js, Express, PostgreSQL, JWT auth, bcrypt
- Documents: Puppeteer PDF generation
- Email: Nodemailer SMTP

## Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run migrate
npm run seed
npm run dev
```

The backend defaults to `http://localhost:5000`.

Use `DATABASE_URL` for hosted PostgreSQL, or set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` for local PostgreSQL.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend defaults to `http://localhost:3000`. Set `NEXT_PUBLIC_API_URL=http://localhost:5000/api` in `frontend/.env.local` if needed.

## Verification

```bash
cd backend
npm test

cd ../frontend
npm run build
```

## Demo Users

After seeding, all demo users use `password123`.

- Admin: `admin@vendorbridge.com`
- Officer: `officer@vendorbridge.com`
- Manager: `manager@vendorbridge.com`
- Vendor: `vendor1@example.com`

## Security Notes

Real `.env` files are ignored and should not be committed. Use `.env.example` as the template for local configuration.
