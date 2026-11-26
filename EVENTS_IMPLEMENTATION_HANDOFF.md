# Events implementation handoff

## What was already present

The uploaded project already contained the Events route, add form, list, details/edit view, confirmation dialog, live Firestore hook, event type, Zod validation, date/time helpers, and Firestore CRUD service. Those components were retained rather than duplicated or redesigned.

## Changes made

- Added partner UID resolution to `src/services/events.ts`, matching the existing Tasks service approach (registered documents in `users` plus comma-separated `NEXT_PUBLIC_PARTNER_UID`).
- Creating a `shared` event now writes the event into the creator's collection and each partner's `users/{partnerId}/events/{eventId}` collection.
- Updating a shared event now writes the complete updated record to every partner copy, repairing a missing/stale copy as well.
- Changing an event from `shared` to `individual` removes the partner copies.
- Deleting a shared event removes all partner copies.
- Added an explicit Events Firestore rule matching the existing shared Tasks rule pattern.
- Upcoming-event selection now requires a strictly future time when the event date is today. The form and service validation already reject past dates and times at or before the current minute.

## Event fields

`title`, `description`, `date` (`YYYY-MM-DD` local date), `time` (`HH:mm` local time), `type` (`shared` or `individual`), `notes`, `createdAt`, `createdBy`, `updatedAt`, and `updatedBy`.

## Important Firebase step

Deploy the updated `firestore.rules` to the Firebase project before testing shared events. The rule follows the same shared-copy authorization pattern already used by Tasks. As with the existing Tasks rules, authenticated users are allowed to write a document under another user's collection when the document is marked `type: "shared"`; this is a broad trust model and should be tightened in a future security-focused change if partner membership is represented explicitly in Firestore.

## Verification status

- Source changes and route/component integration were reviewed.
- `npm run typecheck` could not complete because dependency installation (`npm ci`) timed out and left an incomplete `node_modules` directory. Re-run `npm ci`, then `npm run typecheck` and `npm run build` locally before deployment.
- No live Firebase writes were performed from this environment.
