# Group massal_j 1071814
# FashionFolio — Backend

Small backend built with FastAPI for the FashionFolio project (clothing management, outfits and chat/assistant).

**Main features**
- User, clothing and outfit management
- REST API for clothing / outfit CRUD
- LLM service integration for chat (app/services/llm_service.py)
- Image background removal service (app/services/remove_bg_service.py)
- Image storage in `uploads/clothing`

**Prerequisites**
- Python 3.10+ (or 3.9 depending on the environment)
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
GEMINI_MODEL="your_gemini_model"
REMOVE_BG_API_KEY="your_removebg_api_key"
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

**Starting the application**

From the repository root folder:

Build:
```bash
docker compose up --build
```
Or just run:
```bash
docker compose up
```

---

## 🗄️ Database

The database uses **PostgreSQL** (via Docker). SQLAlchemy automatically translates Python classes into SQL tables at application startup.

### User model
| Field | Description |
|-------|-------------|
| `id` | Primary key |
| `email` | Unique email address |
| `password_hash` | Bcrypt-hashed password |
| `username` | Display name |
| `bio` | User biography |
| `photo_url` | Profile picture URL |
| `created_at` | Account creation date |

> Relations: one User owns multiple `Clothing` items and multiple `Outfit` records.

### Clothing model
| Field | Description |
|-------|-------------|
| `id` | Primary key |
| `user_id` | Foreign key → User |
| `type` | Item type (top, bottom, shoes...) |
| `color` | Color |
| `style` | Style (casual, formal...) |
| `pattern` | Pattern (plain, striped...) |
| `brand` | Brand name |
| `price` | Price |
| `image_url` | Original image URL |
| `image_bg_removed_url` | Background-removed image URL |

> These attributes are used by the LLM to compose coherent outfits.

### Outfit model
| Field | Description |
|-------|-------------|
| `id` | Primary key |
| `user_id` | Foreign key → User |
| `items` | Full outfit stored as JSON |
| `session_id` | Chat session identifier |
| `validated` | Boolean — user approved the outfit |
| `created_at` | Generation date |

> The `items` field stores the complete outfit as JSON: `{ top, bottom, shoes, accessory }`.

---

## 🤖 LLM Integration — Gemini

### Configuration
The API key is stored in the `.env` file and loaded via `python-dotenv`:
```env
GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="your_gemini_model"
```

### Outfit generation flow
1. Receive the user message and fetch their wardrobe from the database
2. Build the prompt with the wardrobe and session history
3. Call the Gemini API with strict rules (system prompt)
4. Parse the JSON response returned by Gemini
5. Return the structured outfit to the `/chat` endpoint

### System prompt rules
The system prompt defines strict LLM behavior:
- Generate outfits **only** from items in the user's wardrobe
- **Always** respond in JSON (`top`, `bottom`, `shoes`, `accessory`, `description`)
- Never answer questions outside the fashion domain
- Never invent clothing items that don't exist in the wardrobe
- Avoid repeating outfits already suggested in the current session

### Expected JSON response format
```json
{
  "top":       { "id": 1, "name": "White t-shirt", "brand": "Zara" },
  "bottom":    { "id": 2, "name": "Blue jeans",    "brand": "Levi's" },
  "shoes":     { "id": 3, "name": "White sneakers", "brand": "Nike" },
  "accessory": null,
  "description": "Perfect casual outfit for the day"
}
```

### Session memory management
The LLM has no native memory. The history of already-suggested outfits is injected into each prompt to avoid repetitions. Session history is cleared via `DELETE /chat/{session_id}`.

---

# 📚 API Documentation — FashionFolio

Base URL: `http://localhost:8000`

All protected routes require the following header:
```
Authorization: Bearer <access_token>
```

---

## 🔐 Auth — `/auth`

### `POST /auth/register` — Register
Creates a user account and returns a JWT token.

**Body (JSON):**
```json
{
  "email": "alice@example.com",
  "username": "alice",
  "password": "mypassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGci..."
}
```

---

### `POST /auth/login` — Login
Authenticates a user and returns a JWT token.

**Body (JSON):**
```json
{
  "email": "alice@example.com",
  "password": "mypassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGci..."
}
```

---

## 👤 Users — `/users`

### `GET /users/me` — Current user profile
Returns the information of the currently authenticated user.

> 🔒 Protected

**Response:**
```json
{
  "id": 1,
  "email": "alice@example.com",
  "username": "alice"
}
```

---

## 👗 Clothing — `/clothing`

> 🔒 All routes are protected

### `POST /clothing/` — Add a clothing item (without image)
Creates an item with an already hosted image URL.

**Body (JSON):**
```json
{
  "name": "White shirt",
  "type": "top",
  "color": "white",
  "style": "casual",
  "pattern": "plain",
  "brand": "Uniqlo",
  "price": 29.99,
  "description": "Light summer shirt",
  "image_url": "https://example.com/image.jpg"
}
```

**Response:** `ClothingResponse` object (see bottom of section)

---

### `POST /clothing/upload` — Add a clothing item with image
Upload an image file + metadata via `multipart/form-data`. Background removal is applied automatically.

**Form fields:**
| Field | Type | Required |
|-------|------|----------|
| `file` | image file | ✅ |
| `name` | string | ✅ |
| `type` | string | ✅ |
| `color` | string | ✅ |
| `style` | string | ❌ |
| `pattern` | string | ❌ |
| `brand` | string | ❌ |
| `price` | float | ❌ |
| `description` | string | ❌ |

**curl example:**
```bash
curl -X POST http://localhost:8000/clothing/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@shirt.jpg" \
  -F "name=Blue shirt" \
  -F "type=top" \
  -F "color=blue"
```

---

### `GET /clothing/` — Wardrobe list
Returns all items belonging to the authenticated user.

**Response:** `list[ClothingResponse]`

---

### `GET /clothing/{clothing_id}` — Item detail

**URL parameter:** `clothing_id` (int)

**Response:** `ClothingResponse`

---

### `PUT /clothing/{clothing_id}` — Update an item

**Body (JSON, all fields are optional):**
```json
{
  "name": "New name",
  "color": "red",
  "price": 49.99
}
```

---

### `DELETE /clothing/{clothing_id}` — Delete an item

**Response:** `204 No Content`

---

### `ClothingResponse` model
```json
{
  "id": 1,
  "user_id": 1,
  "name": "White shirt",
  "type": "top",
  "color": "white",
  "style": "casual",
  "pattern": "plain",
  "brand": "Uniqlo",
  "price": 29.99,
  "description": "Light summer shirt",
  "image_url": "/uploads/clothing/1/abc123_shirt.jpg",
  "image_bg_removed_url": "/uploads/clothing/1/abc123_shirt_nobg.png"
}
```

---

## 💬 Chat — `/chat`

> 🔒 Protected

### `POST /chat/` — Generate an outfit via AI
Sends a message to the LLM which suggests an outfit based on the user's wardrobe.

**Body (JSON):**
```json
{
  "message": "I want a casual outfit to go to the cinema",
  "session_id": "abc-123"
}
```
> `session_id` is optional. If not provided, a new UUID is generated.

**Response:**
```json
{
  "session_id": "abc-123",
  "message": "Here's a casual look I'd suggest...",
  "outfit": {
    "top": { "id": 3, "name": "Grey t-shirt" },
    "bottom": { "id": 7, "name": "Blue slim jeans" }
  },
  "occasion": "casual"
}
```

---

### `DELETE /chat/{session_id}` — Reset a chat session

**URL parameter:** `session_id` (string)

**Response:** `204 No Content`

---

## 👥 Social — `/social`

> 🔒 All routes are protected

### `POST /social/friends/request/{friend_id}` — Send a friend request

**URL parameter:** `friend_id` (int)

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "friend_id": 2,
  "status": "pending"
}
```

---

### `POST /social/friends/accept/{friend_id}` — Accept a friend request

**URL parameter:** `friend_id` (int — the user who sent the request)

**Response:** friendship object with `status: "accepted"`

---

### `GET /social/friends` — Friends list
Returns the accepted friendships of the authenticated user.

**Response:** `list[FriendRequestResponse]`

---

### `POST /social/posts` — Share an outfit

**Body (JSON):**
```json
{
  "outfit_id": 5,
  "caption": "Outfit of the day 🔥"
}
```

**Response:** `OutfitPostResponse`

---

### `GET /social/feed` — News feed
Returns posts from accepted friends, sorted by descending date.

**Response:** `list[OutfitPostResponse]`

---

### `DELETE /social/posts/{post_id}` — Delete a post

**Response:**
```json
{
  "message": "Post deleted"
}
```

---

### `POST /social/messages/{receiver_id}` — Send a message

**URL parameter:** `receiver_id` (int)

**Body (JSON):**
```json
{
  "content": "Hey, I love your outfit!"
}
```

**Response:** `MessageResponse`

---

### `GET /social/messages/{receiver_id}` — Conversation with a user
Returns all messages exchanged between the authenticated user and `receiver_id`, sorted by ascending date.

**Response:** `list[MessageResponse]`

---

## 🧪 Quick testing with curl

```bash
# 1. Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"test","password":"test123"}'

# 2. Login and retrieve the token
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 3. View your profile
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/users/me

# 4. View your wardrobe
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/clothing/

# 5. Chat with the AI
curl -X POST http://localhost:8000/chat/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Suggest an outfit for work"}'
```

---

## ⚠️ Common error codes

| Code | Meaning |
|------|---------|
| `400` | Invalid data (email already used, empty wardrobe, etc.) |
| `401` | Missing or invalid token |
| `404` | Resource not found |
| `503` | LLM service unavailable |

---

> 💡 Interactive documentation available at `http://localhost:8000/docs` (Swagger UI)

---

**Reset data**

Delete the **volumes** created by Docker Compose:
```bash
docker compose down -v
```

## **Project structure (essentials)**

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
│   │   ├── users.py             # GET /users/me
│   │   ├── clothing.py          # CRUD /clothing + image upload
│   │   ├── chat.py              # POST /chat + DELETE /chat/{session_id}
│   │   └── social.py            # Friends, posts, feed, messages
│   ├── schemas/
│   │   ├── user.py              # UserCreate, UserLogin
│   │   ├── clothing.py          # ClothingCreate, ClothingResponse
│   │   ├── chat.py              # ChatRequest, ChatResponse
│   │   └── social.py            # Friendship, OutfitPost, Message schemas
│   └── services/
│       ├── llm_service.py       # Gemini integration + session memory
│       └── remove_bg_service.py # Background removal via remove.bg
├── uploads/                     # User uploaded images
├── main.py                      # FastAPI entry point
├── requirements.txt             # Python dependencies
├── Dockerfile                   # Docker image
├── docker-compose.yml           # API + PostgreSQL services
├── .env                         # Environment variables (git ignored)
└── .env.example                 # Environment variables template
```