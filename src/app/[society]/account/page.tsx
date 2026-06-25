"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Me {
  id: string;
  name: string;
  email: string;
}

export default function AccountPage() {
  const { update } = useSession();
  const [me, setMe] = useState<Me | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe);
  }, []);

  async function handleProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingProfile(true);
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const emailChanged = me ? email.trim().toLowerCase() !== me.email : false;

    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email,
        currentPassword: form.get("currentPassword"),
      }),
    });

    setSavingProfile(false);
    if (res.ok) {
      const updated = await res.json();
      setMe(updated);
      // Refresh the JWT-backed session so the sidebar/header reflect the change.
      await update({ name: updated.name, email: updated.email });
      toast.success(emailChanged ? "Profile and email updated" : "Profile updated");
      (e.target as HTMLFormElement).reset();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Failed to update profile");
    }
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    if (form.get("newPassword") !== form.get("confirmPassword")) {
      toast.error("New passwords do not match");
      return;
    }

    setSavingPassword(true);
    const res = await fetch("/api/me/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
      }),
    });

    setSavingPassword(false);
    if (res.ok) {
      toast.success("Password changed");
      (e.target as HTMLFormElement).reset();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Failed to change password");
    }
  }

  if (!me) {
    return <div className="flex items-center justify-center h-32 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Account</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your profile, email, and password</p>
      </div>

      {/* Profile + email */}
      <form onSubmit={handleProfile}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>Changing your email requires your current password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" defaultValue={me.name} required minLength={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={me.email} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-currentPassword">Current Password</Label>
              <Input
                id="profile-currentPassword"
                name="currentPassword"
                type="password"
                placeholder="Required only to change your email"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving…" : "Save Profile"}
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* Password */}
      <form onSubmit={handlePassword}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" name="newPassword" type="password" required minLength={8} autoComplete="new-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />
            </div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? "Saving…" : "Change Password"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
