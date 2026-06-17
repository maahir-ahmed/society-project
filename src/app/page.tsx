import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function RootPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // In single-society mode the middleware rewrites / → /slug/ already,
  // but if reached directly, honour the env var.
  const envSlug = process.env.SOCIETY_SLUG;
  if (envSlug) {
    redirect(`/${envSlug}/dashboard`);
  }

  // Multi-society mode: redirect to the user's first active society
  const membership = await prisma.societyMembership.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: { society: true },
  });

  if (membership) {
    redirect(`/${membership.society.slug}/dashboard`);
  }

  redirect("/setup");
}
