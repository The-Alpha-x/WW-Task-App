# Memories implementation handoff

## Implemented

- `/memories` list and detail views, including edit and delete.
- `/memories/add` form with title, description, date, optional time, shared/individual type, and notes.
- Reuses the app's existing page container, inputs, textareas, buttons, badges, task type selector, auth provider, action hook, and collection hook patterns.
- Past dates and today are accepted. Future dates are rejected. If the date is today and a time is supplied, that time must not be in the future. A blank time is stored as `null`.
- `createdAt`, `createdBy`, `updatedAt`, and `updatedBy` are set by the service. Editing never changes the creation audit fields.

## Firestore storage model

Memories are stored once in the top-level collection:

`memories/{memoryId}`

This is intentionally different from tasks and events, which live under each user's document. There are no mirrored copies for memories.

- `type: "shared"`: both signed-in app users can read, edit, and delete the same document. Changes appear in both clients through Firestore listeners.
- `type: "individual"`: only the user in `createdBy` can read, edit, or delete the document.
- Changing a shared memory to individual makes it visible only to its original creator. Changing an individual memory to shared makes it visible to both users.

The security rules preserve `createdAt` and `createdBy`, and require the user making a change to set `updatedBy` to their own auth UID.

## Firebase setup

Deploy the updated root `firestore.rules` file to the Firebase project before testing the Memories page. No composite indexes are required by the current memory list/watch queries (the service combines the shared and owner queries and sorts/filters the results in the client).

## Validation

- All 101 TypeScript/TSX source files passed TypeScript transpilation with zero syntax diagnostics.
- A full `tsc --noEmit` check could not complete because `npm ci` timed out and the environment did not have the project's complete `@types` dependencies installed.
- Live Firestore security-rule behavior still needs testing with both app accounts.

## Suggested manual checks

1. Create a shared memory while signed in as account A; confirm it appears for account B.
2. Edit the same shared memory from account B; confirm the updated content and `updatedBy` appear for account A.
3. Delete a shared memory from either account; confirm it disappears from both.
4. Create an individual memory as account A; confirm account B cannot see it.
5. Try a future date; confirm it is rejected.
6. Choose today with no time; confirm it saves.
7. Choose today with a future time; confirm it is rejected.
8. Confirm `createdAt` and `createdBy` remain unchanged after editing.
