# FashionFolio Web (fashionfoliocursor-app)

This is a Vite + React TypeScript web frontend for your existing FashionFolio backend.

## Getting started

From the repo root:

```bash
cd fashionfoliocursor-app
npm install
npm run dev
```

The app will start on `http://localhost:5173`.

## Backend API URL

The frontend expects a `VITE_API_URL` environment variable:

```bash
VITE_API_URL=http://localhost:8000
```

Create a `.env` file in `fashionfoliocursor-app/` with that variable (or adjust to wherever your backend is running).

