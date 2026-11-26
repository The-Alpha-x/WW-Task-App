# FEATURE_ARCHITECTURE.md

**Task 01 — Existing app audit & feature architecture** for adding three content types: **Tasks, Events, Memories**.

> Audit and planning only. No application code, UI, configuration, Firestore rules or dependencies were changed. This file, `FIRESTORE_SCHEMA.md` and `IMPLEMENTATION_PLAN.md` are the only additions.

**Method.** Static read of every file in `src/`, plus config (`package.json`, `tailwind.config.ts`, `tsconfig.json`, `firestore.rules`, `FIREBASE_SETUP.md`, `.env.example`) and the earlier `REFACTORING_*.md` notes. `npm install`, `typecheck`, `lint` and `build` were **not** run (no `node_modules`, no network). Everything below is read from source; claims that depend on runtime behaviour are marked **(verify)**.

---

## 1. Headline findings

These change the shape of the plan, so they come first.

| # | Finding | Consequence |
|---|---|---|
| 1 | **There is no couple relationship anywhere in the app or the database.** No `couple`, `partner`, `members` or `household` concept in code, types, rules or setup docs. Every document lives under one user: `users/{uid}/tasks`, `users/{uid}/budgetPlanner`. The only mention of "shared" is a stale comment in `types/task.ts` and the login copy ("Sign in to your shared workspace"). | "Shared vs individual" cannot be built on an existing relationship; **a couple model must be introduced first**. This is the biggest piece of new work. |
| 2 | **Firestore rules are owner-only:** `users/{userId}/{document=**}` allows read/write only when `auth.uid == userId`. | A partner can never read another user's tasks today. Shared data needs a new location and new rules. |
| 3 | **`Task` differs from the proposed Task.** Current: optional `date` *and* optional `time`, plus `completed`, `doneBy`, `updatedDate`, `updatedTime`. Missing: `type`, `updatedAt`, `updatedBy`. The proposal has date only (no time) and omits completion. | Needs explicit decisions (§9) rather than silent changes. |
| 4 | **Firestore services live in `src/services/`, not `src/lib/`.** `lib/` holds `firebase.ts` (the single initialisation) and pure helpers. `services/tasks.ts` and `services/budget.ts` own all Firestore I/O, and an earlier cleanup deliberately enforced "no `firebase/firestore` imports in components or hooks". | "Reuse existing services in `lib`" is interpreted as: reuse `lib/firebase.ts` + `lib/*` helpers + the `services/` pattern. New services go in `src/services/`. |
| 5 | **The floating plus button is mobile-only.** It is the centre slot of `BottomNavigation` (hidden at `lg`+) and is a plain `<Link href="/tasks/add">`. The desktop sidebar has **no** add action. | A three-way "Add" menu needs a desktop entry point too. |
| 6 | **Accounts are provisioned manually** (Email/Password, created in the Firebase console; no sign-up flow; login says "Invite-only"). | No pairing/invite UI is needed. The couple record can be created once, by hand or script. |
| 7 | **Tailwind's `theme.colors` and `theme.spacing` are replaced, not extended.** Only the token palette and spacing keys `0, px, 1–6, 8, 10, 12, 16` exist. | New UI must use token classes only. (Side effect already present in the app, see §3.10.) |

---

## 2. Project structure (current)

Next.js 15.1.6 (App Router), React 19.0.0, TypeScript 5.7.3 (`strict`, `noUncheckedIndexedAccess`), Tailwind 3.4.17, Firebase ^11.10.0, React Hook Form ^7.92.0, Zod ^4.6.7, `@hookform/resolvers` ^7.0.9, framer-motion 11.18.2, lucide-react 0.469.0. Path alias `@/* → src/*`.

```
task-03a-core-ui/
├─ firestore.rules            users/{uid} profiles, shared tasks, owner-only subcollections, budgets/{budgetId}
├─ FIREBASE_SETUP.md          setup notes (documents users/{uid}/... and budgets/{userId}_{month} paths)
├─ .env.example               NEXT_PUBLIC_FIREBASE_{API_KEY,AUTH_DOMAIN,PROJECT_ID,APP_ID}, MOVIES_DOMAIN
├─ tailwind.config.ts         thin mapping over CSS variables
└─ src/
   ├─ app/
   │  ├─ layout.tsx           Nunito font; <AuthProvider><AppShell>…
   │  ├─ globals.css          base, .btn, .app-shell/.app-bottom-nav/.app-sidebar, .stat-card, .modal (dark glass)
   │  ├─ page.tsx             → <Dashboard/>
   │  ├─ sign-in/             page + login-client
   │  ├─ add/                 page.tsx (AddSelection)
   │  ├─ tasks/               page.tsx, tasks-page-client.tsx, add/page.tsx
   │  ├─ events/              page.tsx (reads ?event=), events-page-client.tsx, add/page.tsx
   │  ├─ memories/            add/page.tsx (placeholder)
   │  └─ activities/          page.tsx, budget-calculator/page.tsx
   ├─ components/
   │  ├─ add/                 AddOptionCard, AddPlaceholder, AddSelection
   │  ├─ auth/                AuthProvider (syncs users/{uid} profile), SignOutButton
   │  ├─ layout/              AppShell, Sidebar, BottomNavigation, MobileTopBar, PageContainer, DataBoundary, loader-screen
   │  ├─ dashboard/           Dashboard, DashboardHeader, DashboardStatistics, DashboardTasks
   │  ├─ tasks/               ActiveTaskCard, AddTask, DailyProgressWidget, TaskEditForm, TaskFormFields,
   │  │                       SubtaskListField, TaskTypeField, TasksOverview, TasksHeader, TaskFilterBar,
   │  │                       TaskSection, SubtaskRow
   │  ├─ events/              AddEvent, EventForm, EventFormFields, EventDetails, EventsOverview,
   │  │                       EventList, EventCard, EventNotice, EventSavedPanel, EventSkeletons
   │  ├─ ui/                  Avatar, Badge, Button, ButtonLink, IconButton, Input, Textarea,
   │  │                       field-styles, Modal, NotificationButton, SectionHeading, StatCard
   │  ├─ activities/          ActivitiesCarousel, BudgetCalculator
   │  └─ login/               login-screen, hero-illustration
   ├─ hooks/                  useAction, useBudgetMonth, useNow, useUserCollection,
   │                          useUserTasks, useUserEvents, useUserBudget
   ├─ services/               tasks.ts, events.ts, memories.ts, budget.ts  ← all Firestore I/O
   ├─ lib/
   │  ├─ cn.ts                className joiner
   │  ├─ date-time.ts         single source of truth for local YYYY-MM-DD / HH:mm helpers
   │  ├─ errors.ts            generic & Firebase error formatting
   │  ├─ firebase.ts          single Firebase init, requireFirestore(), watchCollection()
   │  ├─ id.ts                generateId()
   │  ├─ navigation.ts        routes, NAV_ITEMS, ADD_OPTIONS, href helpers
   │  ├─ user-display.ts      getUserDisplayName()
   │  ├─ tasks/               display.ts, filters.ts, form.ts (Zod)
   │  ├─ events/              display.ts, form.ts (Zod)
   │  └─ memories/            form.ts (Zod)
   ├─ types/                  task.ts, event.ts, memory.ts
   └─ styles/                 tokens.css
```

### 2.1 Current Form, Hook & Service Architecture

- **Firestore Persistence**:
  - `users/{uid}`: User profile metadata synced by `AuthProvider` on sign-in (`uid`, `email`, `displayName`, `photoURL`, `updatedAt`).
  - `users/{uid}/tasks/{taskId}`: Individual and shared tasks. When `type === "shared"`, `services/tasks.ts` (`saveTask`, `updateTask`, `deleteTask`) mirrors writes/updates/deletes to partner users' `tasks` subcollections (resolved from `users` + `NEXT_PUBLIC_PARTNER_UID`).
  - `users/{uid}/events/{eventId}` and `users/{uid}/memories/{memoryId}`: Owner-only subcollections.
  - `budgets/{userId}_{month}`: Top-level `budgets` collection storing one document per user and month (`userId`, `month`, `expenses[]`).
- **Snapshot Watchers**: `watchCollection` in `src/lib/firebase.ts` centralizes `onSnapshot` parsing across `watchTasks`, `watchEvents`, and `watchMemories`; `services/budget.ts` uses `onSnapshot` directly for `watchBudgetExpenses` (query by `userId`) and `watchMonthBudget` (single doc).
- **Task & Dashboard UI**: Both `TasksOverview` (full-width month calendar filter on desktop) and `DashboardTasks` render `ActiveTaskCard` (with collapsible subtasks, hold-to-complete, delete, and dark glass `Modal` + `TaskEditForm` editing).
- **Navigation & Mobile Header**: `MobileTopBar` renders a fixed mobile top-right `NotificationButton` and avatar dropdown menu (`rounded-none`, glassmorphic, displays user name + Log out action). `ActivitiesCarousel` uses a staggered entrance animation matching `/add` cards.
- **Forms & Validation (React Hook Form + Zod)**: All forms (`AddTask`, `TaskEditForm`, `EventForm`, and `BudgetCalculator` add/edit forms) use `react-hook-form` with `zodResolver`. Zod schemas (`createTaskFormSchema`, `createEventFormSchema`, `createMemoryFormSchema`, `expenseFormSchema`) are shared between client forms and Firestore service writes.
- **Hooks**: `useAction` tracks pending/error state with optional per-call fallback messages; `useNow` provides a shared 1-minute clock used by `Events` and `useBudgetMonth`; `useUserCollection` powers `useUserTasks`, `useUserEvents`, and `useUserBudget`.

**Conventions worth preserving** (new work should follow them):

- Components/hooks never import `firebase/firestore` for data; services do. (Only `hooks/useUserCollection.ts` imports the `Unsubscribe` type from it.)
- Services expose `watch*` (via `watchCollection`), `create*`/`save*` (`setDoc`, document id = client-generated id), `update*` (`updateDoc`), `delete*`, and pure `select*/count*` helpers.
- Pages are thin server components; interactive logic is in a `*-client.tsx` or component. Detail views use query params (`/tasks?task=<id>`, `/events?event=<id>`).
- Styling is tokens-first (`tokens.css` → Tailwind). Components use token classes or `var(--token)`.

---

## 3. Audit by area

### 3.1 Complete project structure
See §2. 67 files under `src/` (65 `.ts`/`.tsx` plus two CSS files); `services/`, `hooks/` and `lib/` together are ~1.1k lines. Mixed CRLF/LF line endings across files (previous audit D11): new files should use **LF**.

### 3.2 Existing task creation, editing and listing

| Flow | Where | How it works |
|---|---|---|
| **Create** | `app/tasks/add/page.tsx` → `components/tasks/AddTask.tsx` | Local `useState` per field (`title`, `description`, `date`, `time`, `subtasks: string[]`). On submit: trim, require title, `buildNewTask(uid, …)` → `createTask(uid, task)` via `useAction`. Redirects to `/tasks`. Does not open a Firestore listener. |
| **Edit** | `TaskDetails` → `TaskEditForm` | `draft: Task | null` in `TaskDetails`; `TaskEditForm` is a controlled form over a whole `Task`. Save → `buildEditedTask(draft, uid)` → `saveTask` (**full-document `setDoc`**). |
| **Complete / subtask toggle** | `TaskDetails`, `TasksOverview` | `updateTaskCompletion` / `updateSubtaskCompletion` build the new task with pure `lib/task-state.ts` helpers and then full-document `saveTask`. |
| **List** | `TasksOverview` → `TaskFilterBar` + `TaskSection` + `TaskList` → `TaskCard` | Groups: `today` (date ≤ today, or time-only), `upcoming`, `completed` (`lib/task-display.getTaskGroup`). Filters/counts in `lib/task-filters.ts`. |
| **Detail** | `app/tasks/page.tsx` (reads `?task`) → `tasks-page-client` → `TaskDetails` | One live collection snapshot; the task is found in memory by id. |
| **Delete** | — | `deleteTask` exists in the service but **no UI calls it**. |

Known quirks that affect the new work (from the earlier audit, confirmed in source):

- **Add and Edit are two separate forms** with different subtask state shapes (`string[]` vs `Subtask[]`). Duplicated sections: header with back button (×4), date/time input class string (×4), subtask editor (×2).
- **Two definitions of "today"**: Dashboard "planned" = `date === today`; Tasks page "today" = `date <= today` plus time-only. (B1)
- `TaskEditForm` re-implements the "unchecking a subtask re-opens the task" rule inline instead of calling `setSubtaskDone`.
- `parseTask` **throws on any invalid document**, which fails the *entire* list (one bad doc ⇒ page-level error).
- `AddTask` falls back to `createdBy: ""` when `user` is null.

### 3.3 Existing task components and reusable form elements

Reusable **as-is**: `Input`, `Textarea` (both with `tone="dark|light"`, `error`), `field-styles`, `Button` (`primary|secondary|dark|ghost|icon`, `loading`, `leftIcon`), `IconButton`, `Badge` (`default|lime|purple|orange|outline`), `Avatar`, `SectionHeading` (title + count + action), `Modal` (native `<dialog>`: bottom sheet < `md`, centred dialog ≥ `md`, focus trap, Escape, exit animation), `NotificationButton`, `PageContainer`, `DataBoundary`, `useAction`.

Reusable **with small changes**:

| Component | What is generic | What is task-specific |
|---|---|---|
| `TaskCard` | Title, description clamp, badge row, footer slot, whole-card click target, a11y pattern | `dueLabel`/`dueVariant` naming; `TaskStatus` = pending/in-progress/completed |
| `TaskSection` | Heading + count + empty message | Name and `aria-label` text "…tasks" |
| `TaskFilterBar` | Row of `aria-pressed` buttons with counts | Typed to `TaskFilter` |
| `SubtaskRow` | Circular checkbox row | none |
| `TasksHeader` | Title, summary, "Add task" link, bell | Hard-coded link and copy |

**Missing and needed** (nothing like these exists): a shared/individual selector, a generic date field and time field (currently raw `<input>` ×4), a shared page header with back button (copy-pasted ×4), a subtask editor component, a visibility badge/avatar for "who created this".

### 3.4 Firebase Authentication and Firestore configuration

- **Single initialisation** in `lib/firebase.ts`: `getApps().length > 0 ? getApp() : initializeApp(cfg)`, guarded by `isFirebaseConfigured`; exports `firebaseAuth`, `firestore`, `requireFirestore()`. Nothing else calls `initializeApp`. **New code must import from here — no second initialisation.**
- **Auth**: `components/auth/AuthProvider.tsx` — React context with `status` (`loading | signed-in | signed-out | not-configured`), `user`, `signIn` (email/password), `signOutUser`. `AppShell` redirects client-side between `/sign-in` and `/`. No user profile document, no custom claims, no server code.
- **Firestore**: no offline persistence configured, no emulator wiring, no indexes file, no queries beyond "whole collection of a user" (so no composite indexes are needed today).
- **Rules** (`firestore.rules`): only `users/{userId}/{document=**}`, owner-only. No shape validation, no couple concept. Everything else is denied by default.
- Config: 4 public `NEXT_PUBLIC_FIREBASE_*` values + server-side `MOVIES_DOMAIN`. A real `.env` was in the uploaded ZIP; it is **not** reproduced in the audit ZIP (see the hand-off note).

### 3.5 Existing Firestore service files and hooks

| File | Role | Reuse for new work |
|---|---|---|
| `services/tasks.ts` | `watchTasks`, `setTask/saveTask/createTask`, `updateTask` (partial), `deleteTask`, `buildNewTask`, `buildEditedTask`, `updateTaskCompletion`, `updateSubtaskCompletion`, selectors, `parseTask` | Becomes the **template** for `events.ts`/`memories.ts`. Signatures take `userId` and build `users/{uid}/tasks` — **must change** to a couple scope (§5.3). |
| `services/budget.ts` | Same pattern for `users/{uid}/budgetPlanner`; money/month helpers | **Out of scope; leave untouched.** Stays individual. |
| `hooks/useUserCollection.ts` | Generic "subscribe to a watch fn for the signed-in user" with one state object | Generalise (or sibling) to pass a couple scope. Constraint already documented: `watch` must be a stable module-level function. |
| `hooks/useUserTasks.ts` | `useUserCollection(watchTasks, …)` | Renamed/reshaped; `useUserBudget` is the second consumer. |
| `hooks/useAction.ts` | pending/error wrapper around any async action | **Reuse unchanged** for all new saves. |
| `lib/id.ts` `generateId` | UUID with fallback | Reuse for ids. |
| `lib/task-time.ts` | `getLocalTaskDate`, `formatTaskDate` (**day + month, no year**), `formatTaskTime`, `getTaskUpdateFields` | Reuse for date/time. **No year in `formatTaskDate`** ⇒ ambiguous for memories; add a year-aware formatter. |
| `lib/errors.ts` | `getErrorMessage`, `describeError` | Reuse unchanged. |
| `lib/cn.ts`, `lib/user-display.ts` | classnames, display name for the *current* user only | Reuse; add a "member name by uid" helper for the partner. |

### 3.6 Existing shared / individual data handling

**None.** Every document is implicitly individual (path includes the owner's uid). `Task.doneBy` is a uid or null; its old "or `"shared"`" comment was removed in cleanup and was never implemented. There is no way for two accounts to see the same document.

### 3.7 Existing floating plus button and navigation

- `lib/navigation.ts`: `NAV_ITEMS` = Dashboard (`/`), Tasks (`/tasks`), Activities (`/activities`), each with a sidebar `icon` and a `bottomIcon` (Tasks uses the `Search` icon for the bottom bar). `isActivePath`, `getTaskHref(id)` → `/tasks?task=<id>`.
- `components/layout/BottomNavigation.tsx` (< `lg`): a 5-column grid — Dashboard · Tasks · **Plus** · Activities · Sign-out. It reads `NAV_ITEMS` **by destructuring `[dashboard, tasks, activities]`**, so appending items to `NAV_ITEMS` does *not* add them to the bottom bar. The plus is a `<Link href="/tasks/add" aria-label="Add task">`, sized via the inline `style` using `--size-add-button` (previous audit D10).
- `components/layout/Sidebar.tsx` (≥ `lg`): maps **all** `NAV_ITEMS`, a (non-functional) Notifications row, avatar, sign-out. **No add action.**
- `TasksHeader` has a second entry point: an "Add task" link to `/tasks/add`.
- `AppShell` + `globals.css` (`.app-shell`, `.app-main`, `.app-bottom-nav`, `.app-sidebar`) switch layout at `lg`; `.app-main` reserves bottom padding for the nav.

**Implication:** with 5 bottom slots already used, Events and Memories **cannot get their own bottom-nav tabs** without dropping something. See decision D8.

### 3.8 Homepage architecture and reusable widgets

`app/page.tsx` → `Dashboard` (client). One subscription (`useUserTasks`) gates the whole page with `DataBoundary`. Layout: single column on mobile; from `xl` a two-column grid (left: `DashboardHeader` + `DashboardStatistics`; right: `DashboardTasks`).

| Widget | Notes |
|---|---|
| `DashboardHeader` | Avatar + bell on mobile; greeting; "You have N tasks planned for today". Task-only copy. |
| `DashboardStatistics` + `StatCard` | Two tiles: Completed (purple) and Planned (lime), labels passed as props but variant names/colours are task-flavoured. Notched shape is pure CSS (`.stat-card`). |
| `DashboardTasks` | `SectionHeading` (count + disabled "…" button) + a list of `TaskCard`s of all **open** tasks, click → `getTaskHref`. |

New widgets (Upcoming events, Recent memories) fit the same slot as `DashboardTasks` using `SectionHeading` + a card. Because the page is gated by one `DataBoundary`, a failure in any one collection would blank the whole dashboard — new widgets should have their **own** loading/error handling.

### 3.9 Existing Framer Motion installation and usage

Installed: `framer-motion` **11.18.2** (exact pin), imported as `"framer-motion"` (not `motion/react`). Used in 5 files:

| File | APIs |
|---|---|
| `layout/loader-screen.tsx` | `motion.*`, `AnimatePresence mode="wait"`, `useReducedMotion` |
| `login/login-screen.tsx` | `AnimatePresence`, `motion`, `useAnimationControls`, `useReducedMotion`, `Variants` |
| `login/hero-illustration.tsx` | `motion`, `useReducedMotion`, `Transition` |
| `activities/BudgetCalculator.tsx` | `AnimatePresence`, `motion` (incl. `layout`), `useSpring`, `useTransform` |
| `activities/ActivitiesCarousel.tsx` | `animate`, `motion`, drag via `useMotionValue`, `useMotionValueEvent` |

Observations:
- `useReducedMotion` is used in the loader and login files but **not** in `BudgetCalculator` or `ActivitiesCarousel`. The global CSS reduced-motion rule neutralises CSS animations/transitions only; it does **not** stop Framer Motion.
- `Modal`, nav transitions and hover states use **CSS** (`.modal` keyframes, `duration-base`/`ease-standard`), not Framer Motion.
- There is no shared motion config: durations and easings are written inline. Tokens exist in CSS (`--duration-fast/base/slow` = 120/220/400 ms, `--ease-standard` = `cubic-bezier(0.2, 0, 0, 1)`).
- Compatibility of 11.18.2 with React 19.0.0 was **not verified** here (no install run). It is already in use, so presumably fine **(verify on first `npm install` + build)**.

**No new dependency is needed** for the add-menu animation.

### 3.10 Existing theme and styling system

- `styles/tokens.css` is the single source of truth (RGB-channel colour vars, type scale, 4px spacing scale, radii, motion, component sizes). `tailwind.config.ts` maps these. Dark app (`background` 18/18/18) with **lime** (primary/CTA), **purple**, **orange**, `danger`; light surfaces `card`, `card-muted`, `border`; text `ink`, `ink-muted`, `on-dark`, `on-dark-muted`. Font: Nunito via `next/font`. Light-mode: none (dark only).
- Form pattern: dark page, a **lime sheet** for description, **light `bg-card` sheets** for schedule and subtasks.
- Custom breakpoints: `sm 480`, `md 768`, `lg 1024`, `xl 1280`.
- **Restricted theme.** `theme.colors` and `theme.spacing` are overridden, not extended. Verified by grep, two places already use classes that do not exist and are therefore silent no-ops:
  - `SignOutButton` uses `text-red-300`, `bg-red-500/10`, `border-red-500/30`, … (default palette colours are not in the theme) **(verify visually)**.
  - `Sidebar` unread dot uses `h-2.5 w-2.5` (`2.5` is not a spacing key) **(verify visually)**.
  These are pre-existing and **not** changed in this task, but they are the reason the plan insists on token-only classes.

---

## 4. Gap analysis: proposed data vs. what exists

| Requirement | Task today | Gap / action |
|---|---|---|
| `title`, `description` | ✅ | — |
| `date` **future, no time** | `date: string \| null`, plus separate `time: string \| null` | Decide whether to drop `time` and whether `date` becomes required (D3, D4). Add "future date" validation (UI + service); none exists. |
| `type` shared/individual | ❌ | New field + couple model |
| `subtasks` checklist | ✅ `Subtask[] {id,title,done}` | Reuse |
| `createdAt` | ✅ ISO UTC string | Reuse format |
| `createdBy` | ✅ uid | Reuse |
| `updatedAt` | ❌ (has local `updatedDate` + `updatedTime`) | Add ISO `updatedAt`; **keep** `updatedDate`/`updatedTime` because the dashboard's "completed today" uses `updatedDate` |
| `updatedBy` | ❌ | Add |
| *(not in proposal)* `completed`, `doneBy` | ✅ | **Keep** — the Tasks page, dashboard and status badges depend on them |
| Event / Memory | ❌ entirely | New services, hooks, pages, components |

---

## 5. Proposed architecture

### 5.1 Principles
1. **Mirror the task architecture** for events and memories: same service shape, same hook shape, same page shape (`/x`, `/x/add`, `/x?x=<id>`), same component split.
2. **One Firebase initialisation** (`lib/firebase.ts`); services own Firestore access; components and hooks do not.
3. **Introduce one new concept — the couple scope** — and thread it through services/hooks instead of `userId`.
4. **Extract shared form pieces once** (header, date/time fields, subtask editor, visibility selector) before building 6 form variants.
5. **Token-only styling**, existing `Modal`/`Button`/`Badge`/`Input` reused.

### 5.2 The couple model (summary; detail in `FIRESTORE_SCHEMA.md`)
- One `couples/{coupleId}` document holds `memberIds: [uidA, uidB]` and a small `members` map (display name / photo per uid), because the client cannot read the partner's Firebase Auth profile.
- The client finds its couple with a single query `couples where memberIds array-contains <uid>` — **no per-user profile document is needed.**
- A new `CoupleProvider` (inside `AuthProvider`) exposes `{ coupleId, memberIds, members, partnerId, status }` through `useCouple()`.
- Because accounts are provisioned manually, the couple doc is created **once** by hand/script (documented in the plan). No pairing UI.

### 5.3 Visibility: shared vs individual
- Every entity carries `type: "shared" | "individual"` **and** a derived `visibleTo: string[]` (uids allowed to read it).
  - `shared` → `visibleTo = [uidA, uidB]` (both members).
  - `individual` → `visibleTo = [createdBy]` (private to the creator).
- Clients subscribe with `where("visibleTo", "array-contains", uid)` — **one listener per entity**, no composite index needed (no `orderBy`; sorting stays client-side, as today).
- Firestore rules enforce the same invariant on every write, so the client cannot widen or narrow visibility inconsistently.
- Permissions (recommended, see D6/D7): shared items editable/deletable by either member; individual items only by the creator; `type` **immutable** after creation in v1.
- **Interpretation to confirm (D1):** "individual" = *private to the creator* (partner cannot see it). If you meant "belongs to one partner but both can see it", the schema supports it with a one-line change (`visibleTo` = both members for every item) plus an `ownerId`; the rules and UI copy change, nothing structural.

### 5.4 Service layer (new/changed, all under `src/services/`)
- **`couple.ts` (new):** `watchCouple(uid, …)`, the `CoupleScope = { coupleId, userId, memberIds }` type, collection/doc path builders (`coupleCollection(scope, "tasks"|"events"|"memories")`), and two pure builders reused by all three entities: `buildVisibleTo(type, scope)` and `buildAuditFields(userId, now)` (`createdAt/By`, `updatedAt/By`).
- **`tasks.ts` (modify):** replace `userId` with `scope` in the Firestore functions; add `type`, `visibleTo`, `updatedAt`, `updatedBy`; make `parseTask` **tolerant of legacy documents** (default `type: "individual"`, derive `updatedAt` from `updatedDate`/`updatedTime`, `updatedBy = createdBy`).
- **`events.ts`, `memories.ts` (new):** same shape as `tasks.ts` (`watch*`, `create*`, `save*`, `update*`, `delete*`, `buildNew*`, `buildEdited*`, `select*`), with strict parsers and date/time validation.
- `lib/entry-dates.ts` (new, pure): `isOnOrAfterToday`, `isOnOrBeforeToday`, year-aware date formatter; reuses `getLocalTaskDate`/`formatTaskTime` from `lib/task-time.ts` (no rename — avoids churn).

### 5.5 Hooks
- `useCouple()` — from `CoupleProvider`.
- `useCoupleCollection(watch, errorPrefix)` — successor of `useUserCollection`, passing `scope` to the service `watch*`. `useUserBudget` keeps the old hook (budget stays per-user), so **both** hooks coexist.
- `useTasks()` (renamed from `useUserTasks`), `useEvents()`, `useMemories()`.
- `useAction` unchanged.

### 5.6 Routes (mirrors tasks)

| Route | Purpose |
|---|---|
| `/tasks`, `/tasks/add`, `/tasks?task=<id>` | existing |
| `/events`, `/events/add`, `/events?event=<id>` | new |
| `/memories`, `/memories/add`, `/memories?memory=<id>` | new |

Each page is a thin server component with `metadata` and a `*-client.tsx`, exactly like `app/tasks`. Entry URL helpers (`getEventHref`, `getMemoryHref`) join `getTaskHref` in `lib/navigation.ts`.

### 5.7 The "Add" entry (floating plus)
- Replace the plus `<Link>` with a `<button aria-haspopup="dialog">` that opens an **`AddMenu`** with three choices: Task, Event, Memory → `/tasks/add`, `/events/add`, `/memories/add`.
- **Render the menu inside the existing `Modal`** (bottom sheet on mobile, dialog on desktop). That gives focus trapping, Escape, backdrop, inert background and an exit animation for free.
- **Animate with the already-installed Framer Motion**: a short staggered entrance of the three option cards with `useReducedMotion` honoured, durations/easing taken from the CSS tokens (see a small `lib/motion.ts`). Do not add a dependency.
- Add the same trigger to the **desktop sidebar** (no add action exists there today). `TasksHeader`'s "Add task" link stays as a task-specific shortcut.

### 5.8 Dashboard
- Keep `DashboardHeader`/`DashboardStatistics`/`DashboardTasks` as they are initially; add `DashboardEvents` (next N upcoming) and `DashboardMemories` (most recent / "on this day"), each wrapped in its own boundary so one failed collection does not blank the page.
- Reuse `SectionHeading` and the card component; each widget links to its list page (this is also the mobile route into `/events` and `/memories`, see D8).
- Leave the existing B1 "today" inconsistency alone in this feature work (separate refactor); do not make it worse by adding events to the "planned" count without a decision.

### 5.9 Shared UI to extract (before building 6 forms)

| New component | Replaces / reuses | Why |
|---|---|---|
| `PageHeader` (back button, title, bell) | 4 copy-pasted headers | D1 |
| `DateField`, `TimeField` | 4 raw `<input type=date/time>` with the same class string; wrap `fieldClasses` | D2; adds `min`/`max` for future/past rules |
| `SubtaskEditor` | the two subtask editors (`string[]` vs `Subtask[]`) | D3 |
| `VisibilitySelector` | new; built on the `Button` + `aria-pressed` pattern used by `TaskFilterBar` | shared/individual choice on every form |
| `VisibilityBadge` / creator `Avatar` | `Badge` + `Avatar` | show shared/individual and who created it |
| `TaskForm` (one form for add + edit) | `AddTask` + `TaskEditForm` | D4; then `EventForm`, `MemoryForm` follow the same section layout |
| `EntryCard` (thin wrapper over `TaskCard`) or a `badges` slot on `TaskCard` | `TaskCard` | "Due" wording and status are task-only |

---

## 6. Reuse map

| Existing | Reuse for | Change needed |
|---|---|---|
| `lib/firebase.ts` (`requireFirestore`) | all services | **none** — do not add another init |
| `AuthProvider` / `useAuth` | uid for scope | none (wrap with `CoupleProvider`) |
| `services/tasks.ts` | template + modify for scope | **modify** |
| `hooks/useUserCollection.ts` | pattern | add couple-aware sibling |
| `hooks/useAction.ts` | all saves | none |
| `lib/id.ts`, `lib/errors.ts`, `lib/cn.ts` | everything | none |
| `lib/task-time.ts` | dates/times | none (add year-aware formatter elsewhere) |
| `lib/task-display.ts`, `task-filters.ts`, `task-state.ts` | tasks only | small edits only if `time` is dropped |
| `ui/Input`, `Textarea`, `field-styles` | forms | none |
| `ui/Button`, `IconButton`, `Badge`, `Avatar`, `SectionHeading`, `NotificationButton` | all new UI | none |
| `ui/Modal` | AddMenu, optional delete-confirm | none |
| `ui/StatCard` | optional events/memories stat | none |
| `TaskCard`, `TaskSection`, `SubtaskRow` | events/memories lists and tasks | small generalisations |
| `TaskFilterBar` | filters for events (Upcoming/Past) and memories | type loosened |
| `layout/PageContainer`, `DataBoundary` | all new pages | none |
| `lib/navigation.ts`, `Sidebar`, `BottomNavigation` | nav + add menu | **modify** |
| `framer-motion` 11.18.2 | AddMenu animation | none (no new dependency) |

---

## 7. Files that will need modification

| File | Change | Why |
|---|---|---|
| `firestore.rules` | new couple + entity rules (draft in `FIRESTORE_SCHEMA.md`); keep `users/{uid}/**` until migration is verified | couple model |
| `FIREBASE_SETUP.md` | document `couples/…` paths, bootstrapping, migration | docs |
| `src/types/task.ts` | add `type`, `visibleTo`, `updatedAt`, `updatedBy`; possibly make `date` required, drop `time` | model |
| `src/services/tasks.ts` | scope instead of `userId`; new fields; tolerant parser | model |
| `src/hooks/useUserTasks.ts` | → `useTasks` on `useCoupleCollection` | scope |
| `src/hooks/useUserCollection.ts` | keep (budget uses it) | — |
| `src/app/layout.tsx` | wrap with `CoupleProvider` | scope |
| `src/components/layout/AppShell.tsx` | handle couple loading / "no couple" state | scope |
| `src/components/layout/BottomNavigation.tsx` | plus → opens `AddMenu` | add menu |
| `src/components/layout/Sidebar.tsx` | add "Add" action; Events/Memories nav items | add menu + nav |
| `src/lib/navigation.ts` | `NAV_ITEMS` + `getEventHref`/`getMemoryHref` | routes |
| `src/components/tasks/AddTask.tsx`, `TaskEditForm.tsx`, `TaskDetails.tsx`, `TasksOverview.tsx`, `TaskList.tsx`, `TasksHeader.tsx` | scope, visibility, forms | model |
| `src/app/tasks/tasks-page-client.tsx` | scope, hook rename | scope |
| `src/components/dashboard/Dashboard.tsx` (+ new widgets) | add events/memories | homepage |
| `src/components/tasks/TaskCard.tsx` | `badges`/visibility slot | reuse for new entities |
| `src/lib/task-display.ts`, `task-filters.ts` | only if `time` is dropped | decision D3 |

**New files:** `src/services/{couple,events,memories}.ts`, `src/types/{couple,event,memory}.ts` (+ a shared `entry.ts`), `src/lib/{entry-dates,motion}.ts`, `src/hooks/{useCouple,useCoupleCollection,useEvents,useMemories}.ts`, `src/components/couple/CoupleProvider.tsx`, `src/components/layout/AddMenu.tsx`, `src/components/forms/{PageHeader,DateField,TimeField,SubtaskEditor,VisibilitySelector}.tsx`, `src/components/{events,memories}/*`, `src/app/{events,memories}/**`.

---

## 8. Risks

1. **Migration of existing tasks** (`users/{uid}/tasks` → `couples/{id}/tasks`) is the riskiest step; it must be copy-then-verify-then-delete, never move-in-place.
2. **Rules are the real security boundary** (the auth gate is client-only). Query shape must match rules (`visibleTo array-contains uid`), or reads fail with `permission-denied`. Needs Firebase Emulator tests; the project has no test setup today.
3. **Stale `visibleTo`**: if couple membership ever changes, shared docs' `visibleTo` would not follow. Out of scope for a fixed 2-person couple; documented.
4. **Rules `get()` cost/latency**: membership checks read the couple doc; billed and cached per request **(verify against current Firebase pricing/behaviour)**.
5. **One malformed document breaks a whole list** (existing parser behaviour). Legacy tasks lacking the new fields must not trip the new parser.
6. **Local-string dates** (no timezone) — fine for one household in one time zone; two partners in different zones would see "today" differently.
7. **Cannot be verified here:** build, lint, typecheck, runtime behaviour of rules. All were read statically.

---

## 9. Open decisions (recommended default in **bold**)

| ID | Decision | Recommendation |
|---|---|---|
| **D1** | Meaning of "individual": private to creator, or "belongs to one partner, visible to both"? | **Private to creator** |
| **D2** | Where do existing tasks go? | **Migrate to the couple scope as `type: "individual"` owned by their `createdBy`** |
| **D3** | Drop `time` from tasks (proposal says "no time")? It affects `AddTask`, `TaskEditForm`, `TaskDetails`, `getTaskDue`, `getTaskGroup`. | **Drop from the UI and new writes; keep reading legacy values** |
| **D4** | Is task `date` required and must it be future? | **Required for new tasks; today or later; legacy `null`/past dates tolerated when editing** |
| **D5** | Is "today" valid for future (event/task) and past (memory) dates? | **Yes — future = `>= today`, past = `<= today`** |
| **D6** | Who may edit/delete shared items? | **Either member; individual = creator only** |
| **D7** | Can `type` change after creation? | **No in v1 (rules enforce)** |
| **D8** | How are Events/Memories reached on mobile (bottom bar is full)? | **Dashboard widgets + sidebar on desktop; revisit a "More" tab later** |
| **D9** | Timestamps: ISO strings (matches today) or `serverTimestamp()`? | **ISO strings now, for consistency with `createdAt` and the parsers** |
| **D10** | Keep `completed`/`doneBy` on tasks though not in the proposal? | **Yes** |
| **D11** | Behaviour for a signed-in user with no couple record? | **Block with a clear "set-up incomplete" screen (like `not-configured`)** |
| **D12** | Location of data: `couples/{id}/{entity}` for all, or keep individual under `users/{uid}` and only shared under `couples`? | **All under `couples/{id}` (one listener per entity). The hybrid is viable but needs two listeners per entity** |

Details and the rules draft are in `FIRESTORE_SCHEMA.md`; sequencing and acceptance criteria are in `IMPLEMENTATION_PLAN.md`.
