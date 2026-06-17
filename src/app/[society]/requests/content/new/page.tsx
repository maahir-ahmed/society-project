"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewContentRequestPage() {
  const router = useRouter();
  const params = useParams<{ society: string }>();
  const [loading, setLoading] = useState(false);
  const [rubricRequired, setRubricRequired] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const body = {
      eventName: form.get("eventName"),
      startDate: form.get("startDate"),
      endDate: form.get("endDate") || null,
      location: form.get("location"),
      keyPoints: form.get("keyPoints"),
      deadline: form.get("deadline"),
      bannerRequired: form.get("bannerRequired") === "true",
      blurbRequired: form.get("blurbRequired") === "true",
      rubricRequired: form.get("rubricRequired") === "true",
      otherNotes: form.get("otherNotes") || null,
      status: form.get("action") === "submit" ? "SUBMITTED" : "DRAFT",
    };

    const res = await fetch(`/api/societies/${params.society}/content-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      toast.success("Content request created!");
      router.push(`/${params.society}/requests/content/${data.id}`);
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Failed to create request");
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/${params.society}/requests/content`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Content Request</h1>
          <p className="text-sm text-muted-foreground">Submit a marketing or content request</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name *</Label>
              <Input id="eventName" name="eventName" placeholder="e.g. SecSoc Capture the Flag 2025" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date & Time *</Label>
                <Input id="startDate" name="startDate" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date & Time</Label>
                <Input id="endDate" name="endDate" type="datetime-local" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" name="location" placeholder="e.g. CATS Room, UNSW" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyPoints">Key Points *</Label>
              <Textarea
                id="keyPoints"
                name="keyPoints"
                placeholder="Bullet points about the event (who, what, why, prizes, etc.)"
                rows={4}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Content Deadline *</Label>
              <Input id="deadline" name="deadline" type="datetime-local" required />
              <p className="text-xs text-muted-foreground">When do you need the content ready by?</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content Required</CardTitle>
            <CardDescription>Select all types of content you need</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "bannerRequired", label: "Banner / Graphic", desc: "Social media banner or event graphic" },
              { name: "blurbRequired", label: "Event Blurb", desc: "Written description for the event" },
              { name: "rubricRequired", label: "Rubric Event", desc: "Requires executive to create a Rubric event + QR code" },
            ].map(({ name, label, desc }) => (
              <label key={name} className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  name={name}
                  value="true"
                  onChange={name === "rubricRequired" ? (e) => setRubricRequired(e.target.checked) : undefined}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </label>
            ))}

            {rubricRequired && (
              <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-800">
                <strong>Note:</strong> Selecting Rubric Event will automatically create an Executive approval task.
                An executive will need to create the Rubric event, attach the link, and generate a QR code.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              name="otherNotes"
              placeholder="Any other information, special requirements, or context..."
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" name="action" value="submit" disabled={loading}>
            {loading ? "Submitting…" : "Submit Request"}
          </Button>
          <Button type="submit" name="action" value="draft" variant="outline" disabled={loading}>
            Save as Draft
          </Button>
          <Button asChild variant="ghost">
            <Link href={`/${params.society}/requests/content`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
