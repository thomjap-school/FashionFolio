# FashionFolio Web (fashionfoliocursor-app)

This is a Vite + React TypeScript web frontend for your existing FashionFolio backend.

## Getting started

From the repo root:

```bash
cd fashionfolio-front
npm install
npm run dev
```

The app will start on `http://localhost:5173`.

## Backend API URL

The frontend expects a `VITE_API_URL` environment variable:

```bash
VITE_API_URL=http://localhost:8000
```

## **Project structure**

```
fashionfolio-front/
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Main wrapper (Navbar, Sidebar, Footer)
│   │   └── logo/               # Brand assets and logos
│   ├── pages/
│   │   ├── ChatPage.tsx        # AI Fashion Assistant interface
│   │   ├── ExplorePage.tsx     # Global fashion trends and discovery
│   │   ├── FeedPage.tsx        # Social feed with friends' outfits
│   │   ├── FriendsPage.tsx     # Social networking and friend management
│   │   ├── LoginPage.tsx       # User authentication (Sign-in)
│   │   ├── PremiumPage.tsx     # Subscription plans and extra features
│   │   ├── ProfilePage.tsx     # User settings and personal info
│   │   ├── RegisterPage.tsx    # User onboarding (Sign-up)
│   │   └── WardrobePage.tsx    # Digital closet management (CRUD)
│   ├── services/
│   │   └── api.ts              # Axios/Fetch configuration for Backend communication
│   ├── App.tsx                 # Main routing and provider setup
│   ├── main.tsx                # React application entry point
│   └── styles.css              # Global styles and layout themes
├── index.html                  # HTML entry point for Vite
├── package.json                # Project dependencies and scripts
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite bundler configuration
```