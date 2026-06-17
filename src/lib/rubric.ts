import { prisma } from "@/lib/db";

export interface RubricCredentials {
  sessionId: string;
  societyId: string;
  unionSessionId?: string | null;
}

export async function getRubricCredentials(societyId: string): Promise<RubricCredentials | null> {
  const society = await prisma.society.findUnique({
    where: { id: societyId },
    select: { rubricSessionId: true, rubricSocietyId: true, rubricUnionSessionId: true },
  });
  if (!society?.rubricSessionId || !society?.rubricSocietyId) return null;
  return {
    sessionId: society.rubricSessionId,
    societyId: society.rubricSocietyId,
    unionSessionId: society.rubricUnionSessionId,
  };
}
