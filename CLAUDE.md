# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**Income Chase Buddy** — a group savings/income tracking web app where users create "races" (monthly challenges), log income, and compete on a real-time leaderboard. Members join via shareable invite links.

The `Income Chase Buddy-print-bundle.html` file is the original design export (9 screens). The Vite app in `src/` is the live implementation based on that design.

## Commands

```bash
npm run dev       # Dev server (localhost:5173)
npm run build     # Type-check + production build → dist/
npm run preview   # Preview production build
```

## Architecture

**Stack:** Vite + React + TypeScript, Supabase (auth, PostgreSQL, real-time, storage), React Router v6, pure CSS custom properties (no CSS framework).

**Entry:** `src/main.tsx` → `src/App.tsx` (router + auth gate) → screens

**Auth gate:** `AuthGate` component in `App.tsx` wraps all protected routes. Unauthenticated users are redirected to `/login`. Invite page (`/join/:code`) is public — stores invite code in `sessionStorage` and redirects to login, then joins after auth.

**Screens** (`src/screens/`):
- `Login` — sign-in / sign-up with profile creation
- `Dashboard` — monthly progress, active races summary, recent income
- `AddIncome` — log a single income record
- `Settings` — update username, monthly goal, avatar (Supabase Storage)
- `RacesList` — browse joined races, "+ New" button
- `RaceDetail` — leaderboard with real-time updates, invite code, owner controls (remove member, delete race), leave button
- `CreateRace` — form; generates a 6-char uppercase invite code
- `MemberProfile` — view another member's monthly progress and history
- `FeedScreen` — activity feed from all race members
- `InvitePage` — public join page at `/join/:inviteCode`

**Hooks** (`src/hooks/`):
- `useAuth` — session, signUp, signIn, signOut
- `useProfile` — fetch/update profile, uploadAvatar to Supabase Storage
- `useRaces` — list races, createRace, joinByCode, leaveRace, deleteRace
- `useRaceDetail` — race data + leaderboard aggregation + real-time Supabase channel subscription
- `useIncome` — records, addRecord, monthTotal calculation
- `useFeed` — activity feed across all race members

**Design tokens** are in `src/index.css` as CSS variables (`--bg`, `--green`, `--amber`, `--font-serif`, `--font-mono`, etc.).

**Supabase type pattern:** The project uses `supabase` without a Database generic. Query results are cast after awaiting: `const data = res.data as Profile | null`.

## Environment

Create `.env` with:
```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Supabase Setup

Run in Supabase SQL editor (`src/types/database.ts` documents the schema):
- Tables: `profiles`, `races`, `race_members`, `income_records`
- Storage bucket: `avatars` (public), with authenticated upload policy
- Enable Realtime on `income_records` table for live leaderboard updates
- Row Level Security is required on all tables (see plan file for policies)
