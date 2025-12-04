# Pups & Rec PWA

Modern React + TypeScript + Vite + Tailwind progressive web app for tracking dog activities, journals, reminders, and achievements. The app supports Firebase Authentication (email/password) and syncs user data to Firestore while keeping a seeded localStorage experience for demo users.

## Tech Stack

- React 18 + Vite + TypeScript
- TailwindCSS & custom UI kit
- Firebase Web SDK (Auth + Firestore)
- React Router + PWA plugin

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create Firebase project (once)**
   - Enable Email/Password provider in **Authentication → Sign-in method**
   - Create a Firestore database (native mode)

3. **Configure environment variables**

   Create `.env.local` (not committed) in the project root and paste your Firebase web config:

   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

   Restart `npm run dev` whenever env variables change.

4. **Run**

   ```bash
   npm run dev     # local dev server
   npm run build   # production build + PWA assets
   ```

## Authentication & Routing

- `/login` and `/signup` provide real email/password auth.
- Auth state is provided via `AuthContext` (`useAuth()`), which exposes `user`, `isAuthReady`, `isLoading`, `login`, `signup`, and `logout`.
- A global loading screen renders while Firebase checks the session.
- Protected routes (`/`, `/activity`, `/journal`, etc.) are wrapped in `ProtectedRoute` so unauthenticated visitors are redirected to `/login`.
- Authenticated users visiting `/login` or `/signup` are sent directly to `/`.
- The Settings page surfaces the signed-in email and provides a logout button; guests stay in “demo mode.”

## Data Sync Strategy

- `AppStateContext` still seeds demo data from localStorage so the app works offline or without an account.
- When a user signs in:
  - Firestore (`users/{uid}`) becomes the source of truth.
  - The reducer hydrates from that document and persists updates back to Firestore plus localStorage (for offline cache).
- When a user signs out:
  - Local state resets to the seeded demo data so unauthenticated users see the default experience again.

## Firestore Collections (scaffolded)

The `src/lib/firestore.ts` helper exposes typed references for:

- `users/{userId}` (profile/state document used today)
- `users/{userId}/pets`
- `users/{userId}/activities`
- `users/{userId}/journal`
- `users/{userId}/reminders`
- `users/{userId}/achievements`

Only the top-level user document is persisted right now; these collections are ready for finer-grained sync work.

## Testing & Deployment

Run `npm run build` to ensure the TypeScript project compiles and that the PWA assets are generated. Deploy the contents of `dist/` (along with service worker files) to your hosting platform of choice (Vercel, Firebase Hosting, etc.).

## Notes / Next Steps

- Run `npx tsc --noEmit` or `npm run build` locally to confirm type safety after UI refactors.
- When media storage is ready, replace the placeholder photo-drop section in the Journal composer with the real media upload flow.

