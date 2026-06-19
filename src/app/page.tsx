import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function RootPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Single-society mode: redirect to the clean /dashboard. The middleware rewrites
  // /dashboard → /slug/dashboard internally, so the browser URL stays slug-free.
  // (Redirecting to /slug/dashboard here would bounce off the middleware's clean-URL
  // redirect and loop.)
  const envSlug = process.env.SOCIETY_SLUG;
  if (envSlug) {
    redirect("/dashboard");
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
