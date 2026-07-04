# PowerDesk Discord Bot

A Discord bot that lets you query live office device state and power usage directly from Discord. The bot is a thin client that talks to a backend REST API and WebSocket event stream — it holds zero business logic or device state.

## Prerequisites

- Node.js 18 or later
- A Discord bot token (from the [Discord Developer Portal](https://discord.com/developers/applications))
- A running backend server (the bot connects to `BACKEND_BASE_URL`)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | Yes | Bot token from Discord Developer Portal |
| `CLIENT_ID` | Yes | Bot application client ID |
| `GUILD_ID` | Yes | Discord server ID for slash command registration |
| `ALERT_CHANNEL_ID` | Yes | Channel ID where proactive alerts are posted |
| `BACKEND_BASE_URL` | Yes | Backend REST API base URL (e.g. `http://localhost:3000`) |
| `BACKEND_WS_URL` | Yes | Backend WebSocket URL (e.g. `ws://localhost:3000`) |
| `COMMAND_PREFIX` | No | Prefix for message commands (default: `!`) |
| `OPENAI_API_KEY` | No | OpenAI API key for humanized responses (leave blank to disable) |
| `OPENAI_MODEL` | No | Model for humanization (default: `gpt-4o-mini`) |

### 3. Register slash commands

Run this once to register `/status`, `/room`, and `/usage` with your Discord server:

```bash
npm run register
```

### 4. Start the bot

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

## Commands

### Prefix commands

| Command | Description |
|---|---|
| `!status` | Shows on/off state of all office devices |
| `!room <name>` | Shows device status for a specific room |
| `!usage` | Shows current power usage and estimated daily consumption |

### Slash commands

| Command | Description |
|---|---|
| `/status` | Shows on/off state of all office devices |
| `/room name:<room>` | Shows device status for a specific room |
| `/usage` | Shows current power usage and estimated daily consumption |

### Valid room names

- `drawing` — Drawing Room
- `work1` — Work Room 1
- `work2` — Work Room 2

## Running Tests

```bash
npm test
```

## Type Checking

```bash
npm run typecheck
```

## Architecture

```
Discord User
     │
     │  slash command / prefix command
     ▼
Discord.js Client
     │
     ├─── CommandRouter
     │         │
     │         ├─── /status   ──► GET /api/devices
     │         ├─── /room     ──► GET /api/devices?room=X
     │         └─── /usage    ──► GET /api/power/summary
     │
     └─── WebSocket Listener  ──► ws://backend/events
               │
               └─── on("alert") ──► Post to #alerts channel
```

## Error Handling

The bot gracefully handles all failure modes:

- **Backend offline** — "The office system is offline right now. Try again in a moment."
- **Backend 5xx error** — "Got an unexpected error from the office server. The team has been notified."
- **Invalid room name** — "I don't recognize that room name. Valid options: drawing, work1, work2."
- **LLM failure** — Silent fallback to template formatter (no user-visible error)
- **WebSocket disconnect** — Automatic reconnection with exponential backoff

## LLM Humanization

When `OPENAI_API_KEY` is set, responses are passed through an LLM for a warmer, more conversational tone. When unset or on failure, the bot falls back to template formatters — it is 100% functional without the LLM layer.
