# UNO Online – Modern Multiplayer Card Game

Production-quality UNO card game with modern UI, smooth animations, AI opponents, and real-time multiplayer.

## Features

- **Single Player** – 1–3 AI opponents (Easy / Medium / Hard)
- **Online Multiplayer** – Private rooms, quick matchmaking, room codes
- **Official UNO Rules** – Skip, Reverse, Draw Two, Wild, Wild Draw Four, UNO call
- **House Rules** – Stack +2/+4, Jump In, Seven Swap, Zero Rotation, Progressive Draw
- **Modern UI** – Glassmorphism, dark mode, Framer Motion animations, particle background
- **Authentication** – JWT register/login with MongoDB profiles
- **Statistics & Leaderboards** – Wins, streaks, weekly/monthly boards
- **Accessibility** – Color blind mode, high contrast, adjustable font size, keyboard support
- **Docker Deployment** – Full stack with Nginx reverse proxy

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Framer Motion, Zustand |
| Backend | Node.js, Express, Socket.IO |
| Database | MongoDB |
| Shared | TypeScript game engine (client + server) |

## Project Structure

```
uno-game/
├── client/          # React frontend
├── server/          # Express + Socket.IO backend
├── shared/          # Game engine, types, validators
├── docker/          # Docker configs
├── nginx/           # Nginx config
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB (optional for auth/stats; single-player works without it)

### Development

```bash
# Install dependencies
npm install

# Build shared package
npm run build -w shared

# Start dev servers (client + server)
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001
- API: http://localhost:3001/api

### Environment Variables

Copy `server/.env.example` to `server/.env`:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/uno-online
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:5173
```

## Docker Deployment

```bash
docker-compose up --build
```

Access the app at http://localhost (Nginx proxies to client and API).

## Game Modes

| Mode | Description |
|------|-------------|
| Single Player | Play vs 1–3 AI with difficulty settings |
| Create Room | Private 6-char room code, invite friends |
| Join Room | Enter room code to join lobby |
| Quick Match | Public matchmaking for 4 players |
| Practice Mode | Hints enabled, no timer |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get profile + stats |
| GET | `/api/stats` | Get statistics |
| GET | `/api/leaderboard` | Leaderboard (period: all/weekly/monthly) |
| GET | `/api/friends` | Friend list |
| GET | `/api/admin/status` | Server status |

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `room:create` | Client → Server | Create room |
| `room:join` | Client → Server | Join by code |
| `game:start` | Client → Server | Host starts game |
| `game:play` | Client → Server | Play card |
| `game:draw` | Client → Server | Draw card |
| `game:call_uno` | Client → Server | Call UNO |
| `game:state` | Server → Client | Game state update |
| `room:updated` | Server → Client | Lobby update |

## Testing

```bash
npm run test -w shared
```

## Architecture

```
┌─────────────┐     WebSocket      ┌─────────────┐
│   Client    │◄──────────────────►│   Server    │
│  (React)    │     REST API       │ (Express)   │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       └──────────┬───────────────────────┘
                  │
           ┌──────▼──────┐
           │   shared/   │
           │ Game Engine │
           └─────────────┘
```

All game rules are validated server-side. The shared package contains the pure TypeScript engine used by both client (single-player/AI) and server (multiplayer validation).

## License

MIT
