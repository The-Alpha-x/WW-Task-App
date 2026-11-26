import type { Metadata } from "next";
import { BudgetCalculator } from "@/components/activities/BudgetCalculator";

export const metadata: Metadata = { title: "Budget Calculator" };

export default function BudgetCalculatorPage() {
  return <BudgetCalculator />;
}
