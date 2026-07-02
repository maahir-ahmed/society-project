// Convert a Prisma BudgetCategory (Decimal fields) into a plain JSON-safe object.
// Kept here so every route/page serialises categories the same way.
type DecimalLike = { toString(): string } | number | null;
const num = (v: DecimalLike) => (v == null ? null : Number(v));

export function serialiseCategory<T extends {
  yearlyBudget: DecimalLike; budget2024: DecimalLike; budget2024v2: DecimalLike;
  budget2025: DecimalLike; usage2025: DecimalLike; worstCase: DecimalLike;
}>(c: T) {
  return {
    ...c,
    yearlyBudget: num(c.yearlyBudget) ?? 0,
    budget2024: num(c.budget2024),
    budget2024v2: num(c.budget2024v2),
    budget2025: num(c.budget2025),
    usage2025: num(c.usage2025),
    worstCase: num(c.worstCase),
  };
}

// Summarise spend per budget category: total spent, remaining, and % of budget left.
// Amounts come in as plain numbers (callers convert Prisma Decimals first).

export interface CategoryInput {
  id: string;
  name: string;
  yearlyBudget: number;
}
export interface TxnInput {
  categoryId: string | null;
  amount: number;
}
export interface CategorySummary {
  id: string;
  name: string;
  yearlyBudget: number;
  spent: number;
  remaining: number;
  pctUsed: number; // 0..100+ (capped display is the UI's job)
  pctLeft: number; // yearlyBudget - spent as % of budget; 0 if no budget set
}

export function summariseBudget(categories: CategoryInput[], txns: TxnInput[]) {
  const spentByCat = new Map<string, number>();
  let uncategorisedSpent = 0;
  for (const t of txns) {
    if (t.categoryId == null) uncategorisedSpent += t.amount;
    else spentByCat.set(t.categoryId, (spentByCat.get(t.categoryId) ?? 0) + t.amount);
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const categorySummaries: CategorySummary[] = categories.map((c) => {
    const spent = round2(spentByCat.get(c.id) ?? 0);
    const remaining = round2(c.yearlyBudget - spent);
    const pctUsed = c.yearlyBudget > 0 ? Math.round((spent / c.yearlyBudget) * 100) : 0;
    return {
      id: c.id,
      name: c.name,
      yearlyBudget: c.yearlyBudget,
      spent,
      remaining,
      pctUsed,
      pctLeft: c.yearlyBudget > 0 ? Math.max(0, 100 - pctUsed) : 0,
    };
  });

  const totalBudget = round2(categories.reduce((s, c) => s + c.yearlyBudget, 0));
  const totalSpent = round2(txns.reduce((s, t) => s + t.amount, 0));

  return {
    categories: categorySummaries,
    uncategorisedSpent: round2(uncategorisedSpent),
    totalBudget,
    totalSpent,
    totalRemaining: round2(totalBudget - totalSpent),
  };
}
