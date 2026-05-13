# RUNSA Digital Voting System - Frontend

The **RUNSA Digital Voting System** is a secure, premium, and modern web application built for the Redeemer's University Students' Association (RUNSA). It enables students to participate in campus-wide and departmental elections seamlessly while providing administrators with powerful tools to manage elections, candidates, and live results.

## 🚀 Features

### For Voters:
- **Secure Authentication**: Log in using your Matric Number and a secure password.
- **Role-Based Routing**: Voters are automatically directed to their eligible elections based on their assigned department.
- **Interactive Voting Booth**: A beautifully designed, glassmorphism-styled interface with sticky progress tracking and candidate manifesto insights.
- **Digital Receipts**: Receive a unique, cryptographic verification hash (SHA-256) upon casting your vote.
- **Results Portal**: View the final results of closed elections with animated progress bars and clear placement indicators.

### For Administrators:
- **Election Management**: Create and configure elections (Campus-wide or Departmental) with exact start and end dates.
- **Position & Candidate Setup**: Add positions (e.g., President, Secretary) and manage candidate profiles.
- **User Management**: Approve and assign departments to registered voters to prevent unauthorized voting.
- **Live Results Dashboard**: Monitor voting statistics in real-time.
- **Audit Logs**: View a tamper-proof cryptographic audit trail of all system activities (logins, election creations, votes cast).

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS with modern Design Tokens (CSS Variables)
- **State Management**: Zustand (with localStorage persistence)
- **Data Fetching**: React Query & Axios
- **Animations**: Framer Motion

## 🔌 Connecting to the Backend

This frontend relies on the RUNSA Voting API. Follow these steps to connect them:

1. **Clone the Backend Repository** (if not already done) and set it up according to its instructions (typically running `npm install`, setting up the `.env`, and running `npx prisma db push` or `prisma migrate`).
2. **Start the Backend API**. By default, it runs on `http://localhost:4000`.
3. **Configure the Frontend Environment Variables**:
   In the root of this frontend project, locate or create the `.env.local` file and ensure the API base URL points to your running backend:

   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
   ```
   *(If you deploy the backend to a cloud provider like Render or Heroku, replace `http://localhost:4000` with your production URL).*

4. **Install Dependencies and Run**:
   ```bash
   npm install
   npm run dev
   ```
   The frontend will now be accessible at `http://localhost:3000`.

## 🎨 UI Design System

This project features a fully custom design system focused on a premium look-and-feel. Instead of Tailwind CSS, it utilizes a strict, token-based CSS architecture (`globals.css`) that features:
- **Deep Navy & Premium Accents**: `var(--navy-900)`, `var(--navy-600)` and bright interactive states.
- **Glassmorphism**: Translucent panels with background blur and gradient mesh backgrounds.
- **Micro-Animations**: Extensive use of `framer-motion` for page transitions, button clicks, hover states, and dynamic data rendering.

## 🔒 Security

All API requests are intercepted by `axios` in `src/lib/api.ts` to attach the Bearer token stored by Zustand. If a 401 Unauthorized status is returned, the app gracefully logs the user out and redirects to the login screen.
