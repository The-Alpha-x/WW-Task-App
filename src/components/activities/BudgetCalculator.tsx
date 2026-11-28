"use client";

import {
  AnimatePresence,
  motion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowLeft, Check, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoaderScreen } from "@/components/layout/loader-screen";
import { useAction } from "@/hooks/useAction";
import { useBudgetMonth } from "@/hooks/useBudgetMonth";
import { useUserBudget } from "@/hooks/useUserBudget";
import {
  buildNewExpense,
  calculatePendingTotalMinor,
  completeBudgetExpense,
  createBudgetExpense,
  deleteBudgetExpense,
  expenseFormSchema,
  formatLkr,
  formatMonth,
  minorToInputValue,
  selectMonthExpenses,
  toAmountMinor,
  updateBudgetExpense,
  type BudgetExpense,
  type ExpenseFormValues,
} from "@/services/budget";

const HOLD_DURATION_MS = 1000;
const RING_RADIUS = 17;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface ExpenseCardProps {
  expense: BudgetExpense;
  onComplete: (id: string) => void;
  onSave: (id: string, title: string, amountMinor: number) => void;
  onDelete: (expense: BudgetExpense) => void;
}

function ExpenseCard({
  expense,
  onComplete,
  onSave,
  onDelete,
}: ExpenseCardProps) {
  const [holdProgress, setHoldProgress] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: { title: "", amount: "" },
  });
  const animationFrame = useRef<number | null>(null);

  const stopHold = () => {
    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
    setHoldProgress(0);
  };

  useEffect(
    () => () => {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);
      }
    },
    [],
  );

  const startHold = (event: PointerEvent<HTMLButtonElement>) => {
    if (
      expense.completed ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    stopHold();
    const startedAt = performance.now();

    const updateProgress = (now: number) => {
      const progress = Math.min((now - startedAt) / HOLD_DURATION_MS, 1);
      setHoldProgress(progress);

      if (progress === 1) {
        animationFrame.current = null;
        setHoldProgress(0);
        onComplete(expense.id);
        return;
      }

      animationFrame.current = requestAnimationFrame(updateProgress);
    };

    animationFrame.current = requestAnimationFrame(updateProgress);
  };

  const handleSave = form.handleSubmit((input) => {
    onSave(expense.id, input.title, toAmountMinor(input.amount));
    setIsEditing(false);
  });

  const beginEditing = () => {
    form.reset({
      title: expense.title,
      amount: minorToInputValue(expense.amountMinor),
    });
    setIsEditing(true);
  };

  return (
    <motion.div layout className="surface-card p-3">
      {isEditing ? (
        <form onSubmit={handleSave} noValidate className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Title"
              tone="dark"
              {...form.register("title")}
              error={form.formState.errors.title?.message}
              maxLength={100}
              required
            />
            <Input
              label="Amount (LKR)"
              tone="dark"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              {...form.register("amount")}
              error={form.formState.errors.amount?.message}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save changes
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            disabled={expense.completed}
            aria-label={
              expense.completed
                ? `${expense.title}, completed, ${formatLkr(expense.amountMinor)}`
                : `${expense.title}, ${formatLkr(expense.amountMinor)}`
            }
            onClick={(event) => {
              if (event.detail === 0 && !expense.completed) {
                onComplete(expense.id);
              }
            }}
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerCancel={stopHold}
            onPointerLeave={stopHold}
            onContextMenu={(event) => event.preventDefault()}
            whileTap={expense.completed ? undefined : { scale: 0.99 }}
            style={{ touchAction: "pan-y", userSelect: "none" }}
            className={`flex min-w-0 flex-1 items-center justify-between gap-4 rounded-lg p-2 text-left text-on-dark transition-colors ${expense.completed
              ? "cursor-default opacity-75"
              : "cursor-pointer hover:bg-surface-raised"
              }`}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="relative grid h-10 w-10 shrink-0 place-items-center">
                <svg
                  aria-hidden="true"
                  className="absolute inset-0"
                  viewBox="0 0 40 40"
                >
                  <g transform="rotate(-90 20 20)">
                    <circle
                      cx="20"
                      cy="20"
                      r={RING_RADIUS}
                      fill="none"
                      stroke="currentColor"
                      strokeOpacity="0.25"
                      strokeWidth="2.5"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r={RING_RADIUS}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray={RING_CIRCUMFERENCE}
                      strokeDashoffset={RING_CIRCUMFERENCE * (1 - holdProgress)}
                      className="text-lime"
                    />
                  </g>
                </svg>
                {expense.completed ? (
                  <Check aria-hidden="true" size={18} className="text-lime" />
                ) : (
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full bg-on-dark-muted"
                  />
                )}
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span
                  className={`truncate font-semibold ${expense.completed ? "line-through" : ""
                    }`}
                >
                  {expense.title}
                </span>
                <span className="shrink-0 font-semibold">
                  {formatLkr(expense.amountMinor)}
                </span>
              </span>
            </span>

          </motion.button>
          {!expense.completed && (
            <div className="flex shrink-0">
              <IconButton
                icon={Pencil}
                label={`Edit ${expense.title}`}
                variant="ghost"
                size="sm"
                onClick={beginEditing}
              />
              <IconButton
                icon={Trash2}
                label={`Delete ${expense.title}`}
                variant="ghost"
                size="sm"
                onClick={() => onDelete(expense)}
              />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export function BudgetCalculator() {
  const { expenses, loading, error: loadError, user } = useUserBudget();
  const { currentMonth, months, activeMonth, selectMonth } =
    useBudgetMonth(expenses);
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: { title: "", amount: "" },
  });
  const { run, error: actionError } = useAction("Could not save expense.");
  const [expenseToDelete, setExpenseToDelete] =
    useState<BudgetExpense | null>(null);

  const dataError = actionError || loadError;
  const monthExpenses = selectMonthExpenses(expenses, activeMonth);
  const pendingTotalMinor = calculatePendingTotalMinor(monthExpenses);

  const animatedTotal = useSpring(0, { stiffness: 160, damping: 25 });
  const formattedTotal = useTransform(animatedTotal, (value) =>
    formatLkr(value),
  );

  useEffect(() => {
    animatedTotal.set(pendingTotalMinor);
  }, [animatedTotal, pendingTotalMinor]);

  const handleAddExpense = form.handleSubmit(async (input) => {
    if (!activeMonth || !user) return;

    const expense = buildNewExpense(
      activeMonth,
      input.title,
      toAmountMinor(input.amount),
      user.uid,
    );
    const saved = await run(
      () => createBudgetExpense(user.uid, expense),
      "Could not save expense.",
    );
    if (saved) form.reset();
  });

  const completeExpense = (id: string) => {
    if (!user || !activeMonth) return;
    void run(
      () => completeBudgetExpense(user.uid, activeMonth, id),
      "Could not complete expense.",
    );
  };

  const saveExpense = (id: string, title: string, amountMinor: number) => {
    if (!user || !activeMonth) return;
    void run(
      () => updateBudgetExpense(user.uid, activeMonth, id, { title, amountMinor }),
      "Could not save expense.",
    );
  };

  const deleteExpense = async () => {
    if (!user || !expenseToDelete || expenseToDelete.completed) return;
    const deleted = await run(
      () =>
        deleteBudgetExpense(
          user.uid,
          expenseToDelete.month,
          expenseToDelete.id,
        ),
      "Could not delete expense.",
    );
    if (deleted) setExpenseToDelete(null);
  };

  const handleMonthTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    month: string,
  ) => {
    const currentIndex = months.indexOf(month);
    let nextIndex: number | null = null;

    if (event.key === "ArrowLeft") {
      nextIndex = Math.max(0, currentIndex - 1);
    } else if (event.key === "ArrowRight") {
      nextIndex = Math.min(months.length - 1, currentIndex + 1);
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = months.length - 1;
    }

    if (nextIndex === null) return;
    const nextMonth = months[nextIndex];
    if (!nextMonth) return;

    event.preventDefault();
    selectMonth(nextMonth);
    window.requestAnimationFrame(() => {
      document.getElementById(`budget-month-tab-${nextMonth}`)?.focus();
    });
  };

  if (loading || !user) {
    return <LoaderScreen messages={["Loading your budget planner"]} />;
  }

  return (
    <PageContainer className="flex flex-col gap-6">
      <header className="grid grid-cols-[3rem_1fr_3rem] items-center gap-3">
        <Link
          href="/activities"
          aria-label="Back to activities"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface text-on-dark transition-colors hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
        >
          <ArrowLeft aria-hidden="true" size={22} />
        </Link>
        <h1 className="text-center text-lg font-semibold text-on-dark">
          Budget Calculator
        </h1>
        <span aria-hidden="true" />
      </header>

      <div
        role="tablist"
        aria-label="Monthly budgets"
        className="flex w-full gap-2 overflow-x-auto pb-2"
      >
        {months.map((month) => (
          <button
            key={month}
            id={`budget-month-tab-${month}`}
            type="button"
            role="tab"
            aria-selected={month === activeMonth}
            aria-controls="budget-month-panel"
            tabIndex={month === activeMonth ? 0 : -1}
            onClick={() => selectMonth(month)}
            onKeyDown={(event) => handleMonthTabKeyDown(event, month)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              month === activeMonth
                ? "bg-lime text-ink"
                : "bg-surface text-on-dark-muted hover:bg-surface-raised"
            }`}
          >
            {formatMonth(month)}
            {month === currentMonth && (
              <span className="text-xs font-medium opacity-70">Current</span>
            )}
          </button>
        ))}
      </div>

      <div
        id="budget-month-panel"
        role="tabpanel"
        aria-labelledby={
          activeMonth ? `budget-month-tab-${activeMonth}` : undefined
        }
        tabIndex={0}
        className="flex flex-col gap-6 outline-none"
      >
      <section
        aria-labelledby="current-total-heading"
        className="py-6 text-on-dark md:py-8"
      >
        <motion.span className="mt-2 block text-3xl font-semibold tracking-tight text-lime">
          {formattedTotal}
        </motion.span>
        <p className="mt-2 font-medium text-on-dark-muted">
          Pending expenses for {activeMonth ? formatMonth(activeMonth) : "this month"}
        </p>
      </section>

      {dataError && (
        <p
          role="alert"
          className="form-alert"
        >
          {dataError}
        </p>
      )}

      <section
        aria-labelledby="expenses-heading"
        className="flex flex-col gap-4"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="expenses-heading" className="type-h3 text-on-dark">
            Expenses
          </h2>

          <span className="text-sm font-medium text-on-dark-muted">
            {monthExpenses.length}{" "}
            {monthExpenses.length === 1 ? "item" : "items"}
          </span>
        </div>
        <span className="text-sm text-on-dark-muted">
          Hold for one second to complete
        </span>

        {monthExpenses.length === 0 ? (
          <p className="surface-card type-body p-5 text-on-dark-muted">
            No expenses for {activeMonth ? formatMonth(activeMonth) : "this month"}.
            Add one below to get started.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {monthExpenses.map((expense) => (
                <motion.li
                  key={expense.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{
                    layout: { type: "spring", stiffness: 450, damping: 35 },
                    opacity: { duration: 0.16 },
                    y: { duration: 0.2 },
                  }}
                >
                  <ExpenseCard
                    expense={expense}
                    onComplete={completeExpense}
                    onSave={saveExpense}
                    onDelete={setExpenseToDelete}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      <section
        aria-labelledby="add-expense-heading"
        className="form-section"
      >
        <h2 id="add-expense-heading" className="type-h3 text-on-dark">
          Add an expense to {activeMonth ? formatMonth(activeMonth) : "this month"}
        </h2>
        <form onSubmit={handleAddExpense} noValidate className="flex flex-col gap-5">
          <Input
            label="Title"
            tone="dark"
            {...form.register("title")}
            error={form.formState.errors.title?.message}
            placeholder="e.g. Groceries"
            className="w-full"
            maxLength={100}
            required
          />
          <Input
            label="Amount (LKR)"
            tone="dark"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            {...form.register("amount")}
            error={form.formState.errors.amount?.message}
            placeholder="0.00"
            required
          />
          <Button
            type="submit"
            leftIcon={<Plus aria-hidden="true" size={18} />}
            disabled={!activeMonth}
            className="w-full"
          >
            Add expense
          </Button>
        </form>
      </section>
      </div>

      <Modal
        open={expenseToDelete !== null}
        onClose={() => setExpenseToDelete(null)}
        title="Delete expense?"
        description={
          expenseToDelete
            ? `Delete "${expenseToDelete.title}"? This will adjust the ${formatMonth(expenseToDelete.month)} total.`
            : undefined
        }
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpenseToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={deleteExpense}
              disabled={!expenseToDelete || expenseToDelete.completed}
            >
              Delete expense
            </Button>
          </>
        }
      />
    </PageContainer>
  );
}
