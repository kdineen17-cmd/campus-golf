# Campus Golf

Play golf around a park, campus, or any public space — trees, benches, and
statues become tee boxes and holes. Design a course by walking it with your
phone, share it, and compete for the course record.

## Structure

- `backend/` — Express + TypeScript + Prisma (SQLite) API. Handles auth,
  course/hole storage, rounds, and leaderboards.
- `mobile/` — Expo (React Native + TypeScript) app. GPS-based course creation
  ("walk-and-drop": walk to a landmark, tap to drop a tee or hole pin),
  course browsing, scorecard-based play, and leaderboards.

## Getting started

### Backend

```bash
cd backend
npm install
npm run db:push   # create the SQLite dev database
npm run dev        # http://localhost:3000
```

### Mobile app

```bash
cd mobile
npm install
npm run start       # opens Expo dev tools; scan the QR code with Expo Go
```

By default the mobile app talks to the backend at `http://localhost:3000`.
Set `EXPO_PUBLIC_API_URL` (see `mobile/.env.example`) to point it at a
different host — e.g. your machine's LAN IP when testing on a physical
phone, since `localhost` on the phone refers to the phone itself.

## Core concepts

- **Course**: an ordered list of holes with a name and creator.
- **Hole**: a tee GPS coordinate, a "hole" GPS coordinate (the landmark/tree
  being putted at), a par, and an optional name (e.g. "The Old Oak").
- **Round**: one playthrough of a course by a user — strokes per hole, a
  total, and a duration. The **course record** is the lowest total-stroke
  round on a course.
