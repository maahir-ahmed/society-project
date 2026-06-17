import { prisma } from "./db";
import type { AuditAction } from "@prisma/client";

export async function createAuditLog({
  societyId,
  userId,
  action,
  entityType,
  entityId,
  metadata,
  ipAddress,
  userAgent,
}: {
  societyId?: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, string | number | boolean | null>;
  ipAddress?: string;
  userAgent?: string;
}) {
  await prisma.auditLog.create({
    data: {
      societyId,
      userId,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress,
      userAgent,
    },
  });
}
