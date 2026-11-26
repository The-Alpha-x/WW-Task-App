import { z } from "zod";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { requireFirestore } from "@/lib/firebase";
import { generateId } from "@/lib/id";

export interface BudgetExpense {
  id: string;
  userId: string;
  title: string;
  amountMinor: number;
  completed: boolean;
  month: string;
}

type BudgetExpenseUpdates = Partial<
  Pick<BudgetExpense, "title" | "amountMinor" | "completed">
>;

/**
 * Budget service: Firestore access (collection `budgets/{id}` with `userId` and `month`),
 * money conversion and formatting, expense input validation, month helpers and
 * the pending total. Components and hooks never import firebase/firestore;
 * the calculation helpers below are pure (no React).
 *
 * Money is stored as integer minor units (1/100 LKR).
 */

const LKR_FORMATTER = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
});

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-LK", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const TITLE_REQUIRED_MESSAGE = "Enter an expense title.";
const AMOUNT_INVALID_MESSAGE = "Enter an amount greater than zero.";

/* ------------------------------------------------------------------ */
/* Firestore access                                                    */
/* ------------------------------------------------------------------ */

interface StoredBudgetExpense {
  id: string;
  title: string;
  amountMinor: number;
  completed: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStoredExpense(
  raw: unknown,
  docId: string,
  userId: string,
  month: string,
): BudgetExpense {
  if (
    !isRecord(raw) ||
    typeof raw.id !== "string" ||
    typeof raw.title !== "string" ||
    !Number.isSafeInteger(raw.amountMinor) ||
    Number(raw.amountMinor) <= 0 ||
    typeof raw.completed !== "boolean"
  ) {
    throw new Error(`Budget document "${docId}" has invalid expense item.`);
  }
  return {
    id: raw.id,
    userId,
    title: raw.title,
    amountMinor: Number(raw.amountMinor),
    completed: raw.completed,
    month,
  };
}

function parseBudgetDocument(id: string, value: DocumentData): BudgetExpense[] {
  if (
    typeof value.userId !== "string" ||
    typeof value.month !== "string" ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(value.month) ||
    !Array.isArray(value.expenses)
  ) {
    throw new Error(`Budget document "${id}" has invalid Firestore data.`);
  }
  const userId = value.userId;
  const month = value.month;
  return value.expenses.map((item) =>
    parseStoredExpense(item, id, userId, month),
  );
}

function budgetsCollection() {
  return collection(requireFirestore(), "budgets");
}

function budgetDocId(userId: string, month: string): string {
  return `${userId}_${month}`;
}

function budgetDocument(userId: string, month: string) {
  return doc(budgetsCollection(), budgetDocId(userId, month));
}

/** Live subscription to every monthly budget document of a user, flattened into expenses. */
export function watchBudgetExpenses(
  userId: string,
  onExpenses: (expenses: BudgetExpense[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const q = query(budgetsCollection(), where("userId", "==", userId));
  return onSnapshot(
    q,
    (snapshot) => {
      try {
        const expenses = snapshot.docs.flatMap((item) =>
          parseBudgetDocument(item.id, item.data()),
        );
        onExpenses(expenses);
      } catch (error) {
        onError(
          error instanceof Error
            ? error
            : new Error("Could not read budget expenses."),
        );
      }
    },
    onError,
  );
}

/** Live subscription to the single budget document for a user and month ("YYYY-MM"). */
export function watchMonthBudget(
  userId: string,
  month: string,
  onExpenses: (expenses: BudgetExpense[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    budgetDocument(userId, month),
    (snapshot) => {
      try {
        if (!snapshot.exists()) {
          onExpenses([]);
          return;
        }
        onExpenses(parseBudgetDocument(snapshot.id, snapshot.data()));
      } catch (error) {
        onError(
          error instanceof Error
            ? error
            : new Error("Could not read budget expenses."),
        );
      }
    },
    onError,
  );
}

export function createBudgetExpense(
  userId: string,
  expense: BudgetExpense,
): Promise<void> {
  const item: StoredBudgetExpense = {
    id: expense.id,
    title: expense.title,
    amountMinor: expense.amountMinor,
    completed: expense.completed,
  };
  return setDoc(
    budgetDocument(userId, expense.month),
    {
      userId,
      month: expense.month,
      expenses: arrayUnion(item),
    },
    { merge: true },
  );
}

/** Partial update of an existing expense inside the monthly budget document. */
export async function updateBudgetExpense(
  userId: string,
  month: string,
  expenseId: string,
  updates: BudgetExpenseUpdates,
): Promise<void> {
  const ref = budgetDocument(userId, month);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    throw new Error(`Budget document for "${month}" was not found.`);
  }
  const current = parseBudgetDocument(snapshot.id, snapshot.data());
  const nextExpenses: StoredBudgetExpense[] = current.map((expense) => ({
    id: expense.id,
    title: expense.id === expenseId && updates.title !== undefined ? updates.title : expense.title,
    amountMinor:
      expense.id === expenseId && updates.amountMinor !== undefined
        ? updates.amountMinor
        : expense.amountMinor,
    completed:
      expense.id === expenseId && updates.completed !== undefined
        ? updates.completed
        : expense.completed,
  }));
  await updateDoc(ref, { expenses: nextExpenses });
}

export async function deleteBudgetExpense(
  userId: string,
  month: string,
  expenseId: string,
): Promise<void> {
  const ref = budgetDocument(userId, month);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return;
  const current = parseBudgetDocument(snapshot.id, snapshot.data());
  const nextExpenses: StoredBudgetExpense[] = current
    .filter((expense) => expense.id !== expenseId)
    .map(({ id, title, amountMinor, completed }) => ({
      id,
      title,
      amountMinor,
      completed,
    }));
  await updateDoc(ref, { expenses: nextExpenses });
}

/** Marks an expense completed (the only completion transition the UI has). */
export function completeBudgetExpense(
  userId: string,
  month: string,
  expenseId: string,
): Promise<void> {
  return updateBudgetExpense(userId, month, expenseId, { completed: true });
}

/* ------------------------------------------------------------------ */
/* Money                                                               */
/* ------------------------------------------------------------------ */

export function formatLkr(amountMinor: number): string {
  return LKR_FORMATTER.format(amountMinor / 100);
}

/** Minor units -> the text shown in an amount input, e.g. 12550 -> "125.50". */
export function minorToInputValue(amountMinor: number): string {
  return (amountMinor / 100).toFixed(2);
}

/* ------------------------------------------------------------------ */
/* Expense input validation                                            */
/* ------------------------------------------------------------------ */

export const expenseFormSchema = z.object({
  title: z.string().trim().min(1, TITLE_REQUIRED_MESSAGE),
  amount: z.string().refine((raw) => {
    const parsed = Number(raw);
    const minor = Math.round(parsed * 100);
    return (
      raw.trim().length > 0 &&
      Number.isFinite(parsed) &&
      Number.isSafeInteger(minor) &&
      minor > 0
    );
  }, AMOUNT_INVALID_MESSAGE),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export function toAmountMinor(rawAmount: string): number {
  return Math.round(Number(rawAmount) * 100);
}

export function buildNewExpense(
  month: string,
  title: string,
  amountMinor: number,
  userId = "",
): BudgetExpense {
  return {
    id: generateId("expense"),
    userId,
    title,
    amountMinor,
    completed: false,
    month,
  };
}

/* ------------------------------------------------------------------ */
/* Months                                                              */
/* ------------------------------------------------------------------ */

/** "YYYY-MM" for a local date. */
export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** "YYYY-MM" -> "March 2026". */
export function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return MONTH_FORMATTER.format(
    new Date(Date.UTC(year ?? 0, (monthNumber ?? 1) - 1, 1)),
  );
}

/** Current month plus every month present in the data, newest first. */
export function listMonths(
  expenses: readonly BudgetExpense[],
  currentMonth: string,
): string[] {
  return Array.from(
    new Set([currentMonth, ...expenses.map((expense) => expense.month)]),
  )
    .filter(Boolean)
    .sort((left, right) => right.localeCompare(left));
}

/** The selected month if it is listed, otherwise the current month. */
export function resolveActiveMonth(
  months: readonly string[],
  selectedMonth: string,
  currentMonth: string,
): string {
  return months.includes(selectedMonth) ? selectedMonth : currentMonth;
}

/* ------------------------------------------------------------------ */
/* Totals                                                              */
/* ------------------------------------------------------------------ */

export function selectMonthExpenses(
  expenses: readonly BudgetExpense[],
  month: string,
): BudgetExpense[] {
  return expenses.filter((expense) => expense.month === month);
}

/** Sum of the amounts of expenses that are not completed. */
export function calculatePendingTotalMinor(
  expenses: readonly BudgetExpense[],
): number {
  return expenses.reduce(
    (total, expense) =>
      expense.completed ? total : total + expense.amountMinor,
    0,
  );
}
