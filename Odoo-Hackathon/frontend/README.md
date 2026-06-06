# VendorBridge Frontend

Next.js 16 App Router frontend for VendorBridge.

## Setup

```bash
npm install
npm run dev
```

Create `frontend/.env.local` when the backend API is not on the default URL:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Scripts

- `npm run dev` starts the development server.
- `npm run build` creates a production build.
- `npm run start` runs the production build.

The app expects the backend to be running and seeded before the full procurement workflow is tested.
