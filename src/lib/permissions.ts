import type { Role } from "@prisma/client";

export const ROLE_HIERARCHY: Record<Role, number> = {
  EXECUTIVE: 3,
  DIRECTOR: 2,
  SUBCOMMITTEE: 1,
};

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canApprove(role: Role): boolean {
  return hasRole(role, "EXECUTIVE");
}

export function canManageMembers(role: Role): boolean {
  return hasRole(role, "EXECUTIVE");
}

export function canManageSettings(role: Role): boolean {
  return hasRole(role, "EXECUTIVE");
}

export function canViewAllRequests(role: Role): boolean {
  return hasRole(role, "DIRECTOR");
}

export function canAssignRequests(role: Role): boolean {
  return hasRole(role, "DIRECTOR");
}

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
