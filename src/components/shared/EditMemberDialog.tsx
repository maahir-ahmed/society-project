"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";

interface Department { id: string; name: string }
interface SocietyTitle { id: string; name: string; roleLevel: string }

interface EditMemberDialogProps {
  societySlug: string;
  membershipId: string;
  memberName: string;
  memberPhone: string | null;
  currentRole: string;
  currentTitle: string | null;
  currentDepartmentId: string | null;
  departments: Department[];
}

export function EditMemberDialog({
  societySlug,
  membershipId,
  memberName,
  memberPhone,
  currentRole,
  currentTitle,
  currentDepartmentId,
  departments,
}: EditMemberDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [titles, setTitles] = useState<SocietyTitle[]>([]);
  const [role, setRole] = useState(currentRole);
  const [title, setTitle] = useState(currentTitle ?? "__none__");
  const [departmentId, setDepartmentId] = useState(currentDepartmentId ?? "__none__");
  const [phone, setPhone] = useState(memberPhone ?? "");

  useEffect(() => {
    if (open) {
      fetch(`/api/societies/${societySlug}/titles`)
        .then((r) => r.json())
        .then(setTitles)
        .catch(() => {});
    }
  }, [open, societySlug]);

  function handleRoleChange(newRole: string) {
    setRole(newRole);
    setTitle("__none__");
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/societies/${societySlug}/members/${membershipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role,
        title: title === "__none__" ? null : title,
        departmentId: departmentId === "__none__" ? null : departmentId,
        phone: phone.trim() || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Member updated");
      setOpen(false);
      router.refresh();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Failed to update member");
    }
  }

  async function handleRemove() {
    if (!confirm(`Remove ${memberName} from this society?`)) return;
    setRemoving(true);
    const res = await fetch(`/api/societies/${societySlug}/members/${membershipId}`, { method: "DELETE" });
    setRemoving(false);
    if (res.ok) {
      toast.success(`${memberName} removed`);
      setOpen(false);
      router.refresh();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Failed to remove member");
    }
  }

  const titleOptions = titles.filter((t) => t.roleLevel === role);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit {memberName}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={handleRoleChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SUBCOMMITTEE">Subcommittee</SelectItem>
                <SelectItem value="DIRECTOR">Director</SelectItem>
                <SelectItem value="EXECUTIVE">Executive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Select value={title} onValueChange={setTitle}>
              <SelectTrigger><SelectValue placeholder="Select a title…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— No title —</SelectItem>
                {titleOptions.map((t) => (
                  <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {departments.length > 0 && (
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger><SelectValue placeholder="Select a department…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— No department —</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Phone (contact details)</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+61 4xx xxx xxx"
              type="tel"
            />
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button" variant="destructive" size="sm"
            onClick={handleRemove} disabled={removing}
            className="sm:mr-auto"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            {removing ? "Removing…" : "Remove Member"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
