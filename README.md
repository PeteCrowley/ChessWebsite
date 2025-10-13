# ChessWebsite

ChessWebsite is a full-stack web application for playing, viewing, and analyzing chess games. It combines a Django backend (with Django REST Framework and Channels for realtime features) and a React + TypeScript frontend. The project includes a local Stockfish engine integration for playing against the computer, a matchmaking play queue, real-time play over WebSockets, and a small set of tools for PGN/game management.

## Public Hosting

For at least the next 30ish (til Nov 12, 2025) days while I have a free Railway trial I'm hosting the frontend on vercel here: https://chess-website-three.vercel.app/. The backend is being hosted on Railway. Note it only really seems to work well on chrome- I think there's some issue with the way safari handles csrf tokens with my setup and I spent too much time working with the very unfun authentication aspect of the app.

## Features implemented

- User accounts and session-based authentication (login/register/logout).
- Game creation and retrieval APIs (store games with PGN).
- Play vs Engine mode (backend uses Stockfish to compute moves).
- Play vs Player matchmaking queue and real-time games via Django Channels WebSockets and `react-use-websocket`.
- Game viewer component with move navigation, promotion handling, and notation display.
- Draw-offer flow (offer and accept draw events handled over WebSocket/HTTP as appropriate).
- Client-side reactive chess model (`ReactiveChess`) that extends `chess.js` to notify subscribed UI components when the Game is updated.
- Centralized `apiFetch` helper that resolves API base URL and includes cookies/CSRF handling.
- Build-time environment variable support for the React app via `dotenv-cli`.
- Docker/Dockerfile and deployment helpers for hosting the app.

## Technologies used

- Backend: Django, Django REST Framework, Django Channels (ASGI), Daphne
- Frontend: React, TypeScript
- Realtime: WebSockets via Django Channels; in-memory queue for matchmaking (would switch to redis if this was more than a hobby project)
- Chess Utilities: `python-chess`, `chess.js`, `react-chessboard` for a lot of the chess work I didn't want to do myself.
- Dev/Deployment: Docker, dotenv-cli for injecting build-time REACT_APP_* variables

## Next improvements I may (or may not implement)

- Elo system for the players
- Specific levels for playing the engine
- Switch to redis for the player queue, player vs player handling
- Make the UI a lot prettier
- Improve engine integration by running Stockfish as a long-lived process pool instead of spawning per-request.
- Allow users to request engine moves during analysis
- Rework authentication system (right now it is pretty flaky but this does not seem fun so I probably won't)

## Repo Structure

- `chesswebsite/` - Django project settings, ASGI/WGI entrypoints
- `api/` - Django app with views, serializers, consumers (channels)
- `ui/` - React frontend (TypeScript) with components, `apiFetch` helper, and build scripts

## How to setup locally
This section explains how to run the project locally (both backend and frontend) for development.

Prerequisites
- Python 3.11+ (3.13 tested here)
- Node.js 16+ / npm (or yarn)
- git

0) Clone the repo

1) Django setup

- Create and activate a virtual environment (or use `uv`):

	```bash
	cd chesswebsite
	python -m venv .venv
	source .venv/bin/activate
	```

- Install Python dependencies:

	```bash
	pip install -r requirements.txt
	```

- Environment variables

	The Django settings may read environment variables from `chesswebsite/.env` or `chesswebsite/.env.local` if present. At minimum, for local development you should set:

	- `DEBUG=True` (or omit, default is True)
	- `USE_SQLITE=True` to use the included `db.sqlite3` instead of setting up a postgres instance
    - `SECRET_KEY` set to some secret value.
	- Optionally: `STOCKFISH_PATH` (path to local stockfish binary if you want engine play)

	There is an example .env.local.default that has everything but the secret key and the stockfish path.

- Apply database migrations:

	```bash
	python manage.py migrate
	```

- Start the Django development server

	```bash
	# in chesswebsite/
	python manage.py runserver
	```

2) Frontend (React + TypeScript)

- Change into the `ui` directory and install Node dependencies:

	```bash
	cd ui
	npm install
	```

- Set up environment variables

    For local development, you can copy the `.env.local.default` file into a `.env.local.build` file. Or you can manually set the `REACT_APP_API_BASE` for local hosting.

- Run the build

    Run `npm run build`. This will bundle all assets and place them in the `build` folder. The django app is already set up to look here for static assets.

3) You're all set! Head to `127.0.0.1:8000` to see the app work. You can register a new user and then log in.