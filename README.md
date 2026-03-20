# FashionFolio — Backend

Backend built with FastAPI for the FashionFolio project (clothing management, outfits, AI chat and social features).

**Main features**
- User, clothing and outfit management
- REST API for clothing / outfit CRUD
- LLM service integration for chat (app/services/llm_service.py)
- Image background removal service (app/services/remove_bg_service.py)
- AI-powered clothing recognition via Gemini Vision
- Weather integration via OpenWeatherMap
- Google Trends integration for fashion trends
- Social features: friends, posts, feed, messaging

**Prerequisites**
- Python 3.10+
- Docker & Docker Compose
- See dependencies: [requirements.txt](requirements.txt)

**Quick setup**
1. Create a virtual environment and activate it:

```bash
python -m venv .venv
source .venv/bin/activate
```

2. Copy the environment file and fill in the variables:

```bash
cp .env.example .env
```

```env
POSTGRES_USER="DB_user"
POSTGRES_PASSWORD="DB_password"
POSTGRES_DB="DB_name"
DATABASE_URL="postgresql://fashionfolio:fashionfolio@db:5432/fashionfolio"

GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="gemini-2.0-flash"
REMOVE_BG_API_KEY="your_removebg_api_key"
WEATHER_API_KEY="your_openweathermap_api_key"
SECRET_KEY="your_jwt_secret_key"
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

**Starting the application**

Build and run:
```bash
docker compose up --build
```

Or just run (if already built):
```bash
docker compose up
```

Reset all data (clears the database):
```bash
docker compose down -v
```

---

## 🗄️ Database

The database uses **PostgreSQL** (via Docker). SQLAlchemy automatically creates tables at startup.

### User model
| Field | Description |
|-------|-------------|
| `id` | Primary key |
| `email` | Unique email address |
| `password_hash` | Bcrypt-hashed password |
| `username` | Display name |
| `profile_picture` | Profile picture URL |
| `created_at` | Account creation date |

### Clothing model
| Field | Description |
|-------|-------------|
| `id` | Primary key |
| `user_id` | Foreign key → User |
| `name` | Item name |
| `type` | Item type (top, bottom, shoes...) |
| `color` | Color |
| `style` | Style (casual, formal...) |
| `pattern` | Pattern (plain, striped...) |
| `brand` | Brand name |
| `price` | Price |
| `image_url` | Original image URL |
| `image_bg_removed_url` | Background-removed image URL |
| `is_favorite` | Boolean — marked as favorite |
| `auto_detected` | Boolean — attributes detected by AI |

### Outfit model
| Field | Description |
|-------|-------------|
| `id` | Primary key |
| `user_id` | Foreign key → User |
| `haut_id` | FK → Clothing (top) |
| `bas_id` | FK → Clothing (bottom) |
| `chaussures_id` | FK → Clothing (shoes) |
| `accessoire_id` | FK → Clothing (accessory) |
| `description` | Outfit description |
| `validated` | Boolean — user approved the outfit |
| `created_at` | Generation date |

### Social models

**Friendship**
| Field | Description |
|-------|-------------|
| `user_id` | FK → User (sender) |
| `friend_id` | FK → User (receiver) |
| `status` | `pending` or `accepted` |

**OutfitPost**
| Field | Description |
|-------|-------------|
| `user_id` | FK → User |
| `outfit_data` | JSON stringified outfit |
| `caption` | Optional caption |
| `photo_url` | Optional photo URL |

**Message**
| Field | Description |
|-------|-------------|
| `sender_id` | FK → User |
| `receiver_id` | FK → User |
| `content` | Message content |

---

## 🤖 LLM Integration — Gemini

### Outfit generation flow
1. Receive the user message + city (optional, default: Paris)
2. Fetch the user's wardrobe and current weather
3. Build the prompt with wardrobe, session history and weather context
4. Call Gemini API with strict rules
5. Parse the JSON response
6. Return the structured outfit

### System prompt rules
- Generate outfits **only** from the user's wardrobe
- **Always** respond in JSON
- Never answer questions outside the fashion domain
- Never invent non-existing clothing items
- Avoid repeating outfits already suggested in the session
- Prioritize **favorite** items (`is_favorite: true`)
- Adapt outfit to **current weather**

### Expected JSON response format
```json
{
  "haut":       { "id": 1, "nom": "White t-shirt", "marque": "Zara", "image": "/uploads/..." },
  "bas":        { "id": 2, "nom": "Blue jeans", "marque": "Levi's", "image": "/uploads/..." },
  "chaussures": { "id": 3, "nom": "White sneakers", "marque": "Nike", "image": "/uploads/..." },
  "accessoire": null,
  "description": "Perfect casual outfit for the day"
}
```

---

## 📚 API Documentation

Base URL: `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

All protected routes require:
```
Authorization: Bearer <access_token>
```

---

## 🔐 Auth — `/auth`

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/auth/register` | Register — returns JWT |
| `POST` | `/auth/login` | Login — returns JWT |

---

## 👤 Users — `/users`

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/users/me` | Current user profile |
| `GET` | `/users/search?username=xxx` | Search users by username |

---

## 👗 Clothing — `/clothing`

> 🔒 All routes protected

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/clothing/` | Add clothing item (no image) |
| `POST` | `/clothing/upload` | Upload image + auto AI recognition |
| `GET` | `/clothing/` | Get wardrobe |
| `GET` | `/clothing/stats` | Wardrobe statistics |
| `GET` | `/clothing/{id}` | Get item detail |
| `PUT` | `/clothing/{id}` | Update item |
| `PATCH` | `/clothing/{id}/favorite` | Toggle favorite |
| `DELETE` | `/clothing/{id}` | Delete item |

### AI Recognition on upload
When uploading an image, Gemini Vision automatically detects:
- Item type, color, style, pattern, brand
- Fields are only filled if not provided manually

---

## 💬 Chat — `/chat`

> 🔒 Protected

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/chat/` | Generate outfit via AI |
| `GET` | `/chat/history/{session_id}` | Get session history |
| `DELETE` | `/chat/{session_id}` | Reset session |

**Body for `POST /chat/`:**
```json
{
  "message": "I want a casual outfit for today",
  "session_id": "abc-123",
  "city": "Paris"
}
```

---

## 👥 Social — `/social`

> 🔒 All routes protected

### Friends
| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/social/friends/request/{friend_id}` | Send friend request |
| `POST` | `/social/friends/accept/{friend_id}` | Accept friend request |
| `DELETE` | `/social/friends/request/{friend_id}/cancel` | Cancel sent request |
| `DELETE` | `/social/friends/request/{friend_id}/decline` | Decline received request |
| `GET` | `/social/friends` | Friends list (user profiles) |
| `GET` | `/social/friends/pending` | Pending friend requests |
| `DELETE` | `/social/friends/{friend_id}` | Remove friend |

### Posts & Feed
| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/social/posts` | Share an outfit (with optional photo) |
| `GET` | `/social/feed` | Friends' posts feed |
| `DELETE` | `/social/posts/{post_id}` | Delete a post |
| `POST` | `/social/posts/{post_id}/clone` | Clone a friend's outfit with your wardrobe |

### Messages
| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/social/messages/{receiver_id}` | Send a message |
| `GET` | `/social/messages/{receiver_id}` | Get conversation |

---

## 🌤️ External — `/external`

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/external/trends` | Current fashion trends via Google Trends |

---

## ❤️ Health — `/health`

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/health` | API + database health check |

---

## ⚠️ Common error codes

| Code | Meaning |
|------|---------|
| `400` | Invalid data (email already used, empty wardrobe, etc.) |
| `401` | Missing or invalid token |
| `404` | Resource not found |
| `422` | Validation error (invalid email format, etc.) |
| `503` | LLM service unavailable |

---

## **Project structure**

```
fashionfolio/
├── app/
│   ├── core/
│   │   ├── database.py          # PostgreSQL connection + session
│   │   └── security.py          # Password hashing + JWT creation
│   ├── dependencies/
│   │   └── auth.py              # JWT middleware (get_current_user)
│   ├── models/
│   │   ├── user.py              # Users table
│   │   ├── clothing.py          # Clothing table
│   │   ├── outfit.py            # Outfits table
│   │   └── social.py            # Friendship, posts, messages tables
│   ├── routes/
│   │   ├── auth.py              # POST /auth/register, /auth/login
│   │   ├── users.py             # GET /users/me, /users/search
│   │   ├── clothing.py          # CRUD /clothing + upload + stats + favorite
│   │   ├── chat.py              # POST /chat + history + DELETE
│   │   ├── social.py            # Friends, posts, feed, messages, clone
│   │   ├── trends.py            # GET /external/trends
│   │   └── health.py            # GET /health
│   ├── schemas/
│   │   ├── user.py              # UserCreate, UserLogin, UserResponse
│   │   ├── clothing.py          # ClothingCreate, ClothingResponse, ClothingUpdate
│   │   ├── chat.py              # ChatRequest, ChatResponse
│   │   └── social.py            # Friendship, OutfitPost, Message schemas
│   └── services/
│       ├── llm_service.py       # Gemini integration + session memory
│       ├── remove_bg_service.py # Background removal via remove.bg
│       ├── image_recognition.py # AI clothing attribute detection
│       ├── weather_service.py   # OpenWeatherMap integration
│       └── trends_service.py    # Google Trends via pytrends
├── uploads/                     # User uploaded images
├── main.py                      # FastAPI entry point
├── requirements.txt             # Python dependencies
├── Dockerfile                   # Docker image
├── docker-compose.yml           # API + PostgreSQL services
├── .env                         # Environment variables (git ignored)
└── .env.example                 # Environment variables template
```
