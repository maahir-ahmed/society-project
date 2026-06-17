import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const account = await prisma.bankAccount.findFirst({
    where: { userId: session!.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(account ?? null);
}
