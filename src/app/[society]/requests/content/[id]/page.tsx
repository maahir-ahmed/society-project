import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ThreadView } from "@/components/requests/ThreadView";
import { StatusUpdater } from "@/components/requests/StatusUpdater";
import { RubricForm } from "./RubricForm";
import { SubmitToRubricDialog } from "@/components/requests/SubmitToRubricDialog";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ArrowLeft, Calendar, MapPin, Clock, QrCode, ExternalLink, Send } from "lucide-react";
import type { ContentRequestStatus } from "@prisma/client";

interface Props {
  params: Promise<{ society: string; id: string }>;
}

export default async function ContentRequestDetailPage({ params }: Props) {
  const { society: societySlug, id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.societyMembership.findFirst({
    where: { userId: session.user.id, society: { slug: societySlug }, isActive: true },
  });
  if (!membership) redirect("/");

  const request = await prisma.contentRequest.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { id: true, name: true, avatarUrl: true, email: true } },
      assignedTo: { select: { id: true, name: true, avatarUrl: true } },
      thread: {
        include: {
          comments: {
            include: { author: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!request || request.societyId !== membership.societyId) notFound();

  const isExec = membership.role === "EXECUTIVE";
  const isOwner = request.submittedById === session.user.id;

  const STATUSES: ContentRequestStatus[] = [
    "DRAFT", "SUBMITTED", "ASSIGNED", "IN_PROGRESS",
    "AWAITING_INFORMATION", "AWAITING_EXECUTIVE_ACTION", "COMPLETED", "CANCELLED",
  ];

  const execMembers = isExec
    ? await prisma.societyMembership.findMany({
        where: { societyId: membership.societyId, role: "EXECUTIVE", isActive: true },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      })
    : [];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/${societySlug}/requests/content`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold truncate">{request.eventName}</h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Submitted by {request.submittedBy.name} · {formatDateTime(request.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span><strong>Date:</strong> {formatDate(request.startDate)}{request.endDate ? ` – ${formatDate(request.endDate)}` : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span><strong>Location:</strong> {request.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span><strong>Deadline:</strong> {formatDateTime(request.deadline)}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Key Points</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{request.keyPoints}</p>
              </div>
              {request.otherNotes && (
                <div>
                  <p className="text-sm font-medium mb-1">Additional Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{request.otherNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Content Required</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 flex-wrap">
                {request.bannerRequired && (
                  <span className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">Banner / Graphic</span>
                )}
                {request.blurbRequired && (
                  <span className="bg-green-50 text-green-700 text-sm px-3 py-1 rounded-full">Event Blurb</span>
                )}
                {request.rubricRequired && (
                  <span className="bg-orange-50 text-orange-700 text-sm px-3 py-1 rounded-full">Rubric Event</span>
                )}
                {!request.bannerRequired && !request.blurbRequired && !request.rubricRequired && (
                  <span className="text-muted-foreground text-sm">None specified</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rubric section */}
          {request.rubricRequired && (
            <Card className={request.rubricEventLink ? "border-green-200 bg-green-50/30" : "border-orange-200 bg-orange-50/30"}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <QrCode className="h-4 w-4" /> Rubric Event
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Submitted to Rubric via platform */}
                {request.rubricSubmittedAt && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <Send className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Submitted to Rubric on {formatDateTime(request.rubricSubmittedAt)}.
                      Check your Rubric portal for the live event link.
                    </span>
                  </div>
                )}

                {/* Manual link attachment */}
                {request.rubricEventLink ? (
                  <div className="space-y-3">
                    <a href={request.rubricEventLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <ExternalLink className="h-4 w-4" /> View Rubric Event
                    </a>
                    {request.rubricQrCodeUrl && (
                      <div>
                        <p className="text-sm font-medium mb-2">QR Code</p>
                        <img src={request.rubricQrCodeUrl} alt="Rubric QR Code" className="h-32 w-32 object-contain border rounded" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {!request.rubricSubmittedAt && (
                      <div className="text-sm text-orange-700">
                        <p className="font-medium">Awaiting Executive Action</p>
                        <p className="text-muted-foreground mt-0.5">Submit to Rubric directly or attach an existing event link.</p>
                      </div>
                    )}
                    {isExec && (
                      <div className="space-y-3">
                        <SubmitToRubricDialog
                          societySlug={societySlug}
                          contentRequestId={request.id}
                          defaultEventName={request.eventName}
                          defaultDescription={request.keyPoints}
                          defaultAddress={request.location}
                          defaultStartDate={request.startDate}
                          defaultEndDate={request.endDate}
                          alreadySubmitted={request.rubricSubmittedAt}
                        />
                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Or attach an existing Rubric event link manually
                          </summary>
                          <div className="mt-2">
                            <RubricForm requestId={request.id} societySlug={societySlug} />
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Thread */}
          <ThreadView
            threadId={request.thread?.id}
            comments={request.thread?.comments ?? []}
            requestType="content-request"
            requestId={request.id}
            societySlug={societySlug}
            currentUserId={session.user.id}
            isExec={isExec}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Submitted by</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <UserAvatar name={request.submittedBy.name} avatarUrl={request.submittedBy.avatarUrl} />
                <div>
                  <p className="text-sm font-medium">{request.submittedBy.name}</p>
                  <p className="text-xs text-muted-foreground">{request.submittedBy.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {(isExec || membership.role === "DIRECTOR") && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                {request.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <UserAvatar name={request.assignedTo.name} avatarUrl={request.assignedTo.avatarUrl} />
                    <p className="text-sm font-medium">{request.assignedTo.name}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Unassigned</p>
                )}
              </CardContent>
            </Card>
          )}

          {isExec && (
            <StatusUpdater
              requestId={request.id}
              currentStatus={request.status}
              statuses={STATUSES}
              apiPath={`/api/societies/${societySlug}/content-requests/${request.id}`}
              members={execMembers.map((m) => m.user)}
              assignedToId={request.assignedToId}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// RubricForm is defined in RubricForm.tsx (client component)
