import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { formatDate } from "@/lib/utils";
import { Plus, FileText, Image, AlignLeft, QrCode } from "lucide-react";

interface Props {
  params: Promise<{ society: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function ContentRequestsPage({ params, searchParams }: Props) {
  const { society: societySlug } = await params;
  const { status } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.societyMembership.findFirst({
    where: { userId: session.user.id, society: { slug: societySlug }, isActive: true },
  });
  if (!membership) redirect("/");

  const canSeeAll = membership.role === "EXECUTIVE" || membership.role === "DIRECTOR";

  const requests = await prisma.contentRequest.findMany({
    where: {
      societyId: membership.societyId,
      ...(status ? { status: status as any } : {}),
      ...(!canSeeAll ? { submittedById: session.user.id } : {}),
    },
    include: {
      submittedBy: { select: { id: true, name: true, avatarUrl: true } },
      assignedTo: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const statuses = ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "AWAITING_INFORMATION", "AWAITING_EXECUTIVE_ACTION", "COMPLETED", "CANCELLED"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Requests</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Marketing & promotional requests
          </p>
        </div>
        <Button asChild>
          <Link href={`/${societySlug}/requests/content/new`}>
            <Plus className="h-4 w-4 mr-2" /> New Request
          </Link>
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        <Link href={`/${societySlug}/requests/content`}>
          <Button variant={!status ? "default" : "outline"} size="sm">All</Button>
        </Link>
        {statuses.map((s) => (
          <Link key={s} href={`/${societySlug}/requests/content?status=${s}`}>
            <Button variant={status === s ? "default" : "outline"} size="sm">
              {s.split("_").map(w => w[0] + w.slice(1).toLowerCase()).join(" ")}
            </Button>
          </Link>
        ))}
      </div>

      {/* Request list */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-3">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No content requests found.</p>
            <Button asChild size="sm">
              <Link href={`/${societySlug}/requests/content/new`}>Create your first request</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Link key={r.id} href={`/${societySlug}/requests/content/${r.id}`}>
              <Card className="hover:border-blue-300 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <UserAvatar name={r.submittedBy.name} avatarUrl={r.submittedBy.avatarUrl} size="sm" className="mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{r.eventName}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span>📅 {formatDate(r.startDate)}</span>
                          <span>📍 {r.location}</span>
                          <span>⏰ Deadline: {formatDate(r.deadline)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {r.bannerRequired && (
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                              <Image className="h-3 w-3" /> Banner
                            </span>
                          )}
                          {r.blurbRequired && (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                              <AlignLeft className="h-3 w-3" /> Blurb
                            </span>
                          )}
                          {r.rubricRequired && (
                            <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                              <QrCode className="h-3 w-3" /> Rubric
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <StatusBadge status={r.status} />
                      {r.assignedTo && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Assigned to</span>
                          <UserAvatar name={r.assignedTo.name} avatarUrl={r.assignedTo.avatarUrl} size="sm" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
