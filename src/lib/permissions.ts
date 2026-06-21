// Treasury: under $50 needs 1 exec, over $50 needs 3 execs including treasurer
export function treasuryApprovalsNeeded(amount: number): number {
  return amount < 50 ? 1 : 3;
}

export function treasuryNeedsTreasurer(amount: number): boolean {
  return amount >= 50;
}

export function isTreasuryApproved(
  amount: number,
  approvals: { isTreasurer: boolean }[]
): boolean {
  const needed = treasuryApprovalsNeeded(amount);
  if (approvals.length < needed) return false;
  if (treasuryNeedsTreasurer(amount)) {
    return approvals.some((a) => a.isTreasurer);
  }
  return true;
}
