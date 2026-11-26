"use client";

import { useState } from "react";
import { useNow } from "@/hooks/useNow";
import {
  getMonthKey,
  listMonths,
  resolveActiveMonth,
  type BudgetExpense,
} from "@/services/budget";

/**
 * Current month (kept fresh via `useNow`) plus the month the person selected.
 * When the calendar month rolls over, the selection jumps to the new month.
 */
export function useBudgetMonth(expenses: readonly BudgetExpense[]) {
  const currentMonth = getMonthKey(useNow());
  const [selection, setSelection] = useState<{
    forCurrent: string;
    month: string;
  }>({ forCurrent: currentMonth, month: currentMonth });

  const selectedMonth =
    selection.forCurrent === currentMonth ? selection.month : currentMonth;
  const months = listMonths(expenses, currentMonth);
  const activeMonth = resolveActiveMonth(months, selectedMonth, currentMonth);

  const selectMonth = (month: string) =>
    setSelection({ forCurrent: currentMonth, month });

  return { currentMonth, months, activeMonth, selectMonth };
}
