# Income Chase Buddy (Income Race Tracker)

A modern, real-time group income tracking and savings web application where users create/join "races" (monthly challenges), log income, and compete on a real-time leaderboard.

Built by **King Austin** ([nworahebuka.nworahsoft.codes](https://nworahebuka.nworahsoft.codes)).

## Key Features

- **Real-Time Leaderboard**: Compete with friends or team members to hit monthly income goals.
- **Race Creation**: Easily create public/private races with customized target amounts and shareable invite codes.
- **Income Logging**: Log income details in NGN (Naira) or USD (with automatic conversion).
- **Personal Dashboard**: Track your personal monthly goals, progress percentage, and recent activities.
- **Global Feed**: View dynamic activity feeds of actions and logs across all race members.
- **Responsive Web App**: Optimized for mobile and desktop screens.

## Technology Stack

- **Frontend**: React, Vite, TypeScript
- **Backend/Database**: Supabase (Auth, Real-time PostgreSQL, Storage for profile avatars)
- **Styling**: Pure CSS custom variables

## Getting Started

1. **Clone & Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run Dev Server**:
   ```bash
   npm run dev
   ```

4. **Production Build**:
   ```bash
   npm run build
   ```

---
*Created and maintained by King Austin.*
