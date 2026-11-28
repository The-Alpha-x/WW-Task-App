# FIRESTORE_SCHEMA.md

Recommended Firestore structure for **Tasks, Events and Memories**, based on what the app actually stores today. Planning document only: nothing here has been applied, `firestore.rules` is unchanged, and the rules below are an **untested draft** that must be exercised in the Firebase Emulator before use.

---

## 0. Update after Task 03 (task feature) — read this first

The task document written by the app now differs from section 1.1 as follows. Path is unchanged (`users/{uid}/tasks/{taskId}`); no collection, index or rule changed.

| Field | Change |
|---|---|
| `type` | **new**, `"shared"` \| `"individual"`. Documents without it are read as `"individual"`. |
| `updatedAt` | **new**, ISO-8601 UTC of the last update. Missing → read as `createdAt`. |
| `updatedBy` | **new**, uid of the last editor (also set when completing a task or ticking a subtask). Missing → read as `createdBy`. |
| `time` | **no longer written** for new/edited tasks (the field is omitted, not `null`). Old documents keep theirs until edited; the parser accepts it present, `null` or absent. |
| `date` | required by the forms and must be after today for new dates. Legacy `null` dates still load. |

`visibleTo` from the proposal in section 4 was **not** added: nothing reads it yet, and shared tasks are still stored in the creator's own `users/{uid}` tree. Real partner sharing is a later, separate change.

---

## 0b. Update after Task 04A (event services) - read with section 0

Events are implemented at **`users/{uid}/events/{eventId}`** (not the `couples/...` path of section 3.3): the couple model is not built and rules are unchanged, so the existing owner-only rule covers them. Fields as in section 3.3 **except**: no `visibleTo` (same reasoning as tasks), `description`/`notes` are always written (`""` when empty), and `type` stays editable for now. `createdAt`/`updatedAt` are ISO-8601 UTC strings; `date`/`time` are local `YYYY-MM-DD` / `HH:mm`. No index needed. See `EVENT_SERVICE_REFERENCE.md`.

---

## 0e. Update after Events shared-sync implementation — read with section 0b

Events remain at `users/{uid}/events/{eventId}`. Individual events are stored only in the current user's collection. Shared events are mirrored to each other registered user collection (plus any configured `NEXT_PUBLIC_PARTNER_UID`) on create/update/delete. Switching a shared event to individual removes the mirrored copies. `firestore.rules` now has an explicit `/events/{eventId}` match following the existing shared-task authorization pattern. Deploy the current `firestore.rules` before testing shared events. This pattern intentionally mirrors the existing Tasks implementation and has the same broad shared-write trust model.

## 0f. Item Lists: top-level `List` collection

Lists (grocery lists etc.) are stored in the top-level collection **`List`**, one document per list (`List/{listId}`, id = client-generated UUID, written with `setDoc`). All access goes through `src/services/lists.ts`.

| Field | Type | Notes |
|---|---|---|
| `title` | string | trimmed, 1-100 chars |
| `type` | `"shared"` \| `"individual"` | shared = both partners, individual = creator only |
| `items` | `{ id: string; name: string; quantity: number; checked: boolean }[]` | 1-100 items; name 1-100 chars; quantity whole number 1-999; `checked` = purchased (missing on older docs → false) |
| `notes` | string | `""` when empty, max 2000 chars |
| `createdAt` | string | ISO-8601 UTC. Lists are sorted by this, newest first |
| `createdBy` | string | uid of the creator, never changes |
| `updatedAt` | string | ISO-8601 UTC of the last edit (equals `createdAt` until edited) |

**Rules** (`match /List/{listId}` in `firestore.rules`, deploy before use): signed-in users can read shared lists and their own lists; create requires `createdBy == auth.uid`; update/delete need a shared list or ownership, `createdBy`/`createdAt` cannot change and only the creator can change `type`.

**Queries / indexes**: the rules depend on the document, so the collection is never read whole. `watchLists` runs `where("type", "==", "shared")` and `where("createdBy", "==", uid)` and merges them. Both are single-field filters (no composite index); ordering is done in memory.

---

## 0c. Update after Task 05A (memory services) - read with sections 0 and 0b

Memories are implemented at **`users/{uid}/memories/{memoryId}`** (not the `couples/...` path of section 3.4), for the same reasons as events; the existing owner-only rule covers them and `firestore.rules` is unchanged. Fields as in section 3.4 **except**: no `visibleTo`, `description`/`notes` are always written (`""` when empty), `time` is always written (`null` when not given), and `type` stays editable for now. `date`/`time` = when it happened (local strings); `createdAt`/`updatedAt` = when it was saved (ISO-8601 UTC). No index needed. See `MEMORY_SERVICE_REFERENCE.md`.

---

## 0d. Current implemented schema (after shared tasks & budgets refactor)

The live codebase and `firestore.rules` now differ from sections 0–1 as follows:

- **User profiles (`users/{uid}`)**: `AuthProvider` syncs `{ uid, email, displayName, photoURL, updatedAt }` (`merge: true`) on sign-in. Rules allow any signed-in user to read `users/{userId}` and only the owner to write it.
- **Shared tasks (`users/{uid}/tasks/{taskId}`)**: When `type === "shared"`, `services/tasks.ts` (`saveTask`, `updateTask`, `deleteTask`) mirrors writes/updates/deletes to every other user's `users/{partnerId}/tasks/{taskId}` subcollection, resolving partner UIDs from the `users` collection and `NEXT_PUBLIC_PARTNER_UID`. `firestore.rules` explicitly allow authenticated users to create, update, and delete `type == "shared"` tasks under any `users/{userId}/tasks/{taskId}` path.
- **Monthly budgets (`budgets/{userId}_{month}`)**: Budget storage moved from `users/{uid}/budgetPlanner/{expenseId}` to a top-level `budgets` collection. Each document is keyed by `{userId}_{month}` (`YYYY-MM`) and stores `{ userId: string, month: string, expenses: { id: string, title: string, amountMinor: number, completed: boolean }[] }`. `services/budget.ts` provides `watchBudgetExpenses` (`where("userId", "==", userId)`), `watchMonthBudget` (single doc listener), `createBudgetExpense` (`setDoc` with `arrayUnion`), `updateBudgetExpense`, and `deleteBudgetExpense`. `firestore.rules` enforce owner-only access via `resource.data.userId == request.auth.uid`.

---

## 1. Current structure (inspected, not assumed)

Source: `src/services/tasks.ts`, `src/services/budget.ts`, `src/types/task.ts`, `firestore.rules`, `FIREBASE_SETUP.md`.

```
users/{uid}/tasks/{taskId}            ← one doc per task, id = generateId("task") (UUID)
users/{uid}/budgetPlanner/{expenseId} ← budget expenses (unrelated to this feature)
```

There is no `users/{uid}` profile document, no `couples` collection, no top-level collections, no `orderBy`/`where` queries (each listener reads a whole collection) and therefore no composite indexes.

### 1.1 Current task document (exactly what `setTask` writes; `id` is the doc id, not a field)

| Field | Type | Notes |
|---|---|---|
| `title` | string | trimmed, ≤ 100 chars in the form |
| `description` | string | may be `""` |
| `date` | string \| null | `YYYY-MM-DD` (local date) |
| `time` | string \| null | `HH:mm` 24h (local) |
| `completed` | boolean | |
| `subtasks` | `{ id: string; title: string; done: boolean }[]` | embedded array |
| `doneBy` | string \| null | uid of the person who completed it |
| `updatedDate` | string | local `YYYY-MM-DD` of last update (used by dashboard "completed today") |
| `updatedTime` | string | local `HH:mm` of last update |
| `createdAt` | string | ISO-8601 UTC |
| `createdBy` | string | uid (`""` possible if `AddTask` ran with no user) |

### 1.2 Current rules

```
match /users/{userId}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```
Owner-only; no shape validation; everything else denied.

### 1.3 Conventions in the existing data (kept for the new entities)
- Calendar dates are **local `YYYY-MM-DD` strings**; times are **local `HH:mm` strings**; lexical comparison is valid and is what the code does.
- Audit instants are **ISO-8601 UTC strings** (`createdAt`).
- Document id = client-generated UUID, written with `setDoc` (full document).
- Parsers (`parseTask`, `parseExpense`) are strict and throw on invalid data.

---

## 2. Recommended structure

```
couples/{coupleId}                       ← the couple (2 members)
couples/{coupleId}/tasks/{taskId}
couples/{coupleId}/events/{eventId}
couples/{coupleId}/memories/{memoryId}

users/{uid}/budgetPlanner/{expenseId}    ← unchanged (out of scope, stays individual)
users/{uid}/tasks/{taskId}               ← legacy; read only by the one-off migration, then retired
```

### 2.1 Why this shape
- **One collection per entity, one listener per entity.** Shared and individual items live side by side and are separated by a visibility field, instead of two locations per entity.
- **Mirrors the existing layout** (`<scope>/<id>/<entity>/<docId>`) so each service stays a small, familiar file.
- **The couple is a real document**, so membership is data that rules can check — there is nothing like it today.
- **No profile document is required.** The client resolves its couple with one query: `couples where memberIds array-contains <uid>`.

Alternative considered (**D12**): keep individual items in `users/{uid}/…` and only shared ones in `couples/{id}/…`. Individual privacy would be enforced by the *existing* rule (hard to get wrong). Cost: two listeners and a client-side merge per entity (6 total), two code paths in every service, and moving an item between the two locations if `type` ever becomes editable. Not recommended, but viable if you prefer the stronger isolation.

### 2.2 Couple document — `couples/{coupleId}`

Created **once**, by hand in the console (or a one-off script), after both Auth accounts exist. Clients are never allowed to write it.

```json
{
  "memberIds": ["<uidA>", "<uidB>"],
  "members": {
    "<uidA>": { "displayName": "Alex",  "photoURL": null },
    "<uidB>": { "displayName": "Sam",   "photoURL": null }
  },
  "createdAt": "2026-11-26T00:00:00.000Z"
}
```

| Field | Type | Notes |
|---|---|---|
| `memberIds` | string[2] | Source of truth for membership. Used by rules and by the client lookup query. |
| `members` | map<uid, `{displayName: string, photoURL: string \| null}`> | Denormalised on purpose: a client **cannot read another user's Firebase Auth profile**, so the partner's name/photo must be stored. |
| `createdAt` | string (ISO) | |

---

## 3. Entity schemas

All three share the same **common fields**, so one pair of builders (`buildVisibleTo`, `buildAuditFields`) serves all of them.

### 3.1 Common fields (every entity)

| Field | Type | Req. | Notes |
|---|---|---|---|
| `title` | string | ✔ | trimmed, 1–100 chars |
| `description` | string | ✔ | may be `""` |
| `type` | `"shared"` \| `"individual"` | ✔ | **immutable** after creation (D7) |
| `visibleTo` | string[] | ✔ | **derived**: shared → both `memberIds`; individual → `[createdBy]`. Drives queries and rules. |
| `createdAt` | string (ISO UTC) | ✔ | |
| `createdBy` | string (uid) | ✔ | must equal `request.auth.uid` on create |
| `updatedAt` | string (ISO UTC) | ✔ | equals `createdAt` on create |
| `updatedBy` | string (uid) | ✔ | must equal `request.auth.uid` on every write |

### 3.2 Task — `couples/{coupleId}/tasks/{taskId}`

| Field | Type | Req. | Notes |
|---|---|---|---|
| common fields | | ✔ | §3.1 |
| `date` | string `YYYY-MM-DD` \| null | ✔ (new tasks) | Proposed: future date, **today or later**, no time. `null` only for legacy docs (D4). |
| `subtasks` | `{id, title, done}[]` | ✔ | **Same embedded shape as today.** |
| `completed` | boolean | ✔ | kept (D10) — the Tasks page and dashboard depend on it |
| `doneBy` | string \| null | ✔ | uid |
| `updatedDate` | string | ✔ | **kept**; dashboard "completed today" reads it |
| `updatedTime` | string | ✔ | **kept** for parity with `getTaskUpdateFields` |
| `time` | string \| null | optional | **legacy only.** New forms stop writing it if D3 is accepted; the parser must still accept it. |

### 3.3 Event — `couples/{coupleId}/events/{eventId}`

| Field | Type | Req. | Notes |
|---|---|---|---|
| common fields | | ✔ | |
| `date` | string `YYYY-MM-DD` | ✔ | future: **today or later** on create (D5) |
| `time` | string `HH:mm` | ✔ | **required** (24h, local) |
| `notes` | string | ✔ | may be `""` |

### 3.4 Memory — `couples/{coupleId}/memories/{memoryId}`

| Field | Type | Req. | Notes |
|---|---|---|---|
| common fields | | ✔ | |
| `date` | string `YYYY-MM-DD` | ✔ | past: **today or earlier** on create (D5) |
| `time` | string `HH:mm` \| null | optional | `null` when not given (the field is always present, never absent, to keep parsing simple) |
| `notes` | string | ✔ | may be `""` |

### 3.5 Example documents

```json
// couples/c1/events/9b1d…  (shared)
{
  "title": "Dinner at the lake",
  "description": "Table for two",
  "date": "2026-12-12",
  "time": "19:30",
  "notes": "Bring the camera",
  "type": "shared",
  "visibleTo": ["<uidA>", "<uidB>"],
  "createdAt": "2026-11-26T09:00:00.000Z",
  "createdBy": "<uidA>",
  "updatedAt": "2026-11-26T09:00:00.000Z",
  "updatedBy": "<uidA>"
}
```
```json
// couples/c1/memories/4c7e…  (individual — private to Sam)
{
  "title": "First coffee together",
  "description": "",
  "date": "2024-03-02",
  "time": null,
  "notes": "",
  "type": "individual",
  "visibleTo": ["<uidB>"],
  "createdAt": "2026-11-26T09:10:00.000Z",
  "createdBy": "<uidB>",
  "updatedAt": "2026-11-26T09:10:00.000Z",
  "updatedBy": "<uidB>"
}
```

### 3.6 TypeScript shape (documentation only; not added to the code base)

```ts
type EntryType = "shared" | "individual";

interface EntryBase {
  id: string;                 // doc id, not stored as a field
  title: string;
  description: string;
  type: EntryType;
  visibleTo: readonly string[];
  createdAt: string;          // ISO UTC
  createdBy: string;
  updatedAt: string;          // ISO UTC
  updatedBy: string;
}

interface Task extends EntryBase {          // existing Task + new fields
  date: string | null;
  completed: boolean;
  subtasks: readonly Subtask[];
  doneBy: string | null;
  updatedDate: string;
  updatedTime: string;
  time?: string | null;                     // legacy
}
interface Event  extends EntryBase { date: string; time: string; notes: string }
interface Memory extends EntryBase { date: string; time: string | null; notes: string }

interface CoupleScope { coupleId: string; userId: string; memberIds: readonly [string, string] }
```

---

## 4. Visibility model

| | `type` | `visibleTo` | Who can read | Who can edit | Who can delete |
|---|---|---|---|---|---|
| Shared | `shared` | both member uids | both | **either** member | **either** member (D6) |
| Individual | `individual` | `[createdBy]` | creator only | creator only | creator only |

Rules enforce that `visibleTo` is consistent with `type` on every create, that neither can change on update, and that `updatedBy` is always the writer.

> **D1:** if "individual" should instead mean "belongs to one partner but the other can still see it", set `visibleTo` to both members for every item and treat `type`/`createdBy` as ownership (UI badge + edit rights). Same fields, simpler rules, different copy. Default here is *private*.

---

## 5. Query patterns

Same style as today (whole-collection live listener, client-side grouping), now with one filter:

```ts
// inside services/<entity>.ts (components/hooks never import firebase/firestore)
query(
  collection(requireFirestore(), "couples", scope.coupleId, "tasks"),
  where("visibleTo", "array-contains", scope.userId),
)
```

- **The `where` is mandatory**, not an optimisation: Firestore rules are evaluated against the query. An unfiltered read of the collection would return documents the user may not see, so it is rejected with `permission-denied`.
- **No `orderBy`** ⇒ no composite index. Sorting (by `date`, then `time`) stays client-side, as in `getTaskGroup` today. Adding `orderBy` to an `array-contains` query *would* require a composite index; avoid until pagination is needed.
- Couple lookup: `query(collection(db, "couples"), where("memberIds", "array-contains", uid), limit(1))`.
- **Scale note:** whole-collection listeners are fine for a two-person household. Memories accumulate for years; when a list gets large, add a `date` range + `limit` (that is when the composite index and pagination are introduced).

---

## 6. Security rules — DRAFT (not applied)

Keep the existing `users/{userId}/{document=**}` block until migration is verified. Add:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── existing, unchanged ──────────────────────────────────────────
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // ── helpers ──────────────────────────────────────────────────────
    function signedIn() { return request.auth != null; }
    function me() { return request.auth.uid; }

    function coupleData(coupleId) {
      return get(/databases/$(database)/documents/couples/$(coupleId)).data;
    }
    function isMember(coupleId) {
      return signedIn() && me() in coupleData(coupleId).memberIds;
    }

    function validDate(s) {
      return s is string && s.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$');
    }
    function validTime(s) {
      return s is string && s.matches('^([01][0-9]|2[0-3]):[0-5][0-9]$');
    }
    function validTitle(s) { return s is string && s.size() > 0 && s.size() <= 100; }

    // visibleTo must match type
    function visibilityOk(coupleId, d) {
      return (d.type == 'shared'
                && d.visibleTo.toSet() == coupleData(coupleId).memberIds.toSet())
          || (d.type == 'individual'
                && d.visibleTo == [d.createdBy]);
    }

    function canRead(coupleId) {
      return isMember(coupleId) && me() in resource.data.visibleTo;
    }
    function canCreate(coupleId) {
      let d = request.resource.data;
      return isMember(coupleId)
          && d.createdBy == me()
          && d.updatedBy == me()
          && visibilityOk(coupleId, d);
    }
    function canUpdate(coupleId) {
      let d = request.resource.data;
      let old = resource.data;
      return isMember(coupleId)
          && me() in old.visibleTo
          && d.type == old.type
          && d.visibleTo == old.visibleTo
          && d.createdBy == old.createdBy
          && d.createdAt == old.createdAt
          && d.updatedBy == me()
          && (old.type == 'shared' || old.createdBy == me());
    }
    function canDelete(coupleId) {
      return isMember(coupleId)
          && me() in resource.data.visibleTo
          && (resource.data.type == 'shared' || resource.data.createdBy == me());
    }

    // ── couple: members can read; nobody writes from the client ──────
    match /couples/{coupleId} {
      allow get, list: if signedIn() && me() in resource.data.memberIds;
      allow write: if false;

      // ── tasks ─────────────────────────────────────────────────────
      function validTask(d) {
        return d.keys().hasAll(['title','description','date','completed','subtasks','doneBy',
                                'type','visibleTo','createdAt','createdBy','updatedAt','updatedBy',
                                'updatedDate','updatedTime'])
            && d.keys().hasOnly(['title','description','date','completed','subtasks','doneBy',
                                 'type','visibleTo','createdAt','createdBy','updatedAt','updatedBy',
                                 'updatedDate','updatedTime','time'])
            && validTitle(d.title) && d.description is string
            && (d.date == null || validDate(d.date))
            && d.completed is bool && d.subtasks is list;
      }
      match /tasks/{taskId} {
        allow read:   if canRead(coupleId);
        allow create: if canCreate(coupleId) && validTask(request.resource.data);
        allow update: if canUpdate(coupleId) && validTask(request.resource.data);
        allow delete: if canDelete(coupleId);
      }

      // ── events ────────────────────────────────────────────────────
      function validEvent(d) {
        return d.keys().hasOnly(['title','description','date','time','notes',
                                 'type','visibleTo','createdAt','createdBy','updatedAt','updatedBy'])
            && d.keys().hasAll(['title','description','date','time','notes',
                                'type','visibleTo','createdAt','createdBy','updatedAt','updatedBy'])
            && validTitle(d.title) && d.description is string && d.notes is string
            && validDate(d.date) && validTime(d.time);
      }
      match /events/{eventId} {
        allow read:   if canRead(coupleId);
        allow create: if canCreate(coupleId) && validEvent(request.resource.data);
        allow update: if canUpdate(coupleId) && validEvent(request.resource.data);
        allow delete: if canDelete(coupleId);
      }

      // ── memories ──────────────────────────────────────────────────
      function validMemory(d) {
        return d.keys().hasOnly(['title','description','date','time','notes',
                                 'type','visibleTo','createdAt','createdBy','updatedAt','updatedBy'])
            && d.keys().hasAll(['title','description','date','time','notes',
                                'type','visibleTo','createdAt','createdBy','updatedAt','updatedBy'])
            && validTitle(d.title) && d.description is string && d.notes is string
            && validDate(d.date) && (d.time == null || validTime(d.time));
      }
      match /memories/{memoryId} {
        allow read:   if canRead(coupleId);
        allow create: if canCreate(coupleId) && validMemory(request.resource.data);
        allow update: if canUpdate(coupleId) && validMemory(request.resource.data);
        allow delete: if canDelete(coupleId);
      }
    }
  }
}
```

Notes on the draft:
- **"Future"/"past" is checked in the app and service, not in rules.** Rules only validate the *format* of the date. Comparing to "today" in rules would need `request.time` and a time zone, which is unreliable for local-date strings, and would wrongly block edits of old items.
- `get()` in rules is billed and counted toward rule-call limits; confirm the current behaviour for list queries before relying on the cost estimate **(verify)**.
- Whether `users/{userId}/{document=**}` also matches the `users/{userId}` document itself is not needed for this design (no profile doc), so it is deliberately not relied upon.
- Function declarations inside `match` blocks and `let` bindings are valid rules syntax, but the whole draft is **unexecuted**; run it in the Emulator with tests for: member reads shared, partner cannot read individual, non-member denied, cannot spoof `createdBy`/`updatedBy`, cannot change `type`/`visibleTo`, query without `where` is denied.

---

## 7. Indexes

None required for the recommended queries (single `array-contains`, no `orderBy`). No `firestore.indexes.json` exists today and none is proposed.

---

## 8. Concurrency (new with shared data)

Today a task is only ever written by its owner, and completion toggles do a **full-document `setDoc`** built from the client's in-memory copy. With shared tasks, two people can toggle different subtasks nearly simultaneously; a full-document write from a stale copy would silently overwrite the partner's change.

Recommendation: for completion and subtask toggles use the existing partial **`updateTask`** (`updateDoc`) with only the fields that change (`completed`, `doneBy`, `subtasks`, `updatedAt`, `updatedBy`, `updatedDate`, `updatedTime`). That narrows the conflict window to the `subtasks` array. A transaction on the one document is the next step if that proves insufficient. Full-form edits can remain `setDoc`/`updateDoc` of the whole editable field set.

---

## 9. Migration of existing tasks (`users/{uid}/tasks` → `couples/{coupleId}/tasks`)

Copy-then-verify-then-delete; never move in place. Runs once, outside the app (an Admin SDK script run locally by the developer; service-account credentials must not be committed). Idempotent: it reuses the same document ids, so re-running overwrites the same targets.

| Legacy field | New field |
|---|---|
| all current fields | copied as is (`title`, `description`, `date`, `time`, `completed`, `subtasks`, `doneBy`, `updatedDate`, `updatedTime`, `createdAt`) |
| `createdBy` | the **owner uid from the path** (use it even when the stored value is `""`; log mismatches) |
| — | `type: "individual"` (D2) |
| — | `visibleTo: [ownerUid]` |
| — | `updatedBy: ownerUid` |
| — | `updatedAt`: ISO from `updatedDate` + `updatedTime` (local → ISO); fall back to `createdAt` if unparsable |

Steps:
1. Create the couple document (§2.2).
2. Deploy the new rules **alongside** the old block.
3. Run the copy for both users; compare per-user document counts and spot-check fields.
4. Switch the app to the couple path (feature branch / release).
5. After a verification period, delete `users/{uid}/tasks` and remove nothing else (budget stays).
6. **Rollback** before step 5: redeploy the previous app version; the legacy data is untouched.

Until step 4, the new parser must also tolerate documents lacking `type`/`visibleTo`/`updatedAt`/`updatedBy` (defaults: `individual`, `[createdBy]`, derived from `updatedDate`/`updatedTime`, `createdBy`), because a single invalid document currently fails an entire list.

---

## 10. Setup documentation to update (`FIREBASE_SETUP.md`)

Add: the `couples/{coupleId}` structure; how to create the couple document (uids from Authentication → Users); publishing the new rules; the migration procedure; a reminder that the couple document is **not** writable from the client.


## Memories (shared top-level collection)

Memories are stored once at `memories/{memoryId}` rather than duplicated under each user.

Fields: `title`, `description`, `date` (`YYYY-MM-DD`, today or earlier), `time` (`HH:mm` or `null`), `type` (`shared` or `individual`), `notes`, `createdAt`, `createdBy`, `updatedAt`, and `updatedBy`.

- Shared memories are readable and editable by either signed-in partner. Both clients subscribe to the same document, so edits and deletions appear immediately without mirrored copies.
- Individual memories are readable only by the user in `createdBy`.
- The creator and creation timestamp are immutable. The user making an edit updates `updatedBy` and `updatedAt`.
- Memories describe when an event happened (`date`/optional `time`); audit timestamps describe when the memory was saved or edited.
