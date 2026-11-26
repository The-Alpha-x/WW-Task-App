# Firebase setup

1. Create a Firebase project and register a web app.
2. Enable **Authentication → Sign-in method → Email/Password**.
3. Create user accounts from the Firebase console. This app intentionally has
   no sign-up flow.
4. Copy `.env.example` to `.env.local`, fill in the web app configuration, and
   restart the Next.js server.
5. Create a Cloud Firestore database and publish `firestore.rules`.

The app stores records in Cloud Firestore:

- `users/{uid}` — user profile metadata synced on sign-in (readable by signed-in users for shared-task discovery)
- `users/{uid}/tasks/{taskId}` — tasks (owner-only for individual tasks; mirrored across users for `shared` tasks)
- `users/{uid}/events/{eventId}` — events (owner-only)
- `memories/{memoryId}` — memories (visible to both)
- `budgets/{userId}_{month}` — monthly budget documents containing an `expenses` array (owner-only via `userId`)

Firebase Authentication manages its own session persistence; application task, event, memory, and budget data is stored in Firestore.
