"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface HeaderProps {
  societySlug: string;
  onMobileMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
}

export function Header({ societySlug, onMobileMenuToggle, mobileMenuOpen }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {}
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-4 gap-4 flex-shrink-0">
      {/* Mobile menu toggle */}
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMobileMenuToggle}>
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <div className="flex-1" />

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 border-0">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <DropdownMenuSeparator />
          {notifications.length === 0 ? (
            <div className="px-3 py-4 text-sm text-center text-muted-foreground">No notifications</div>
          ) : (
            notifications.slice(0, 8).map((n) => (
              <DropdownMenuItem key={n.id} asChild>
                <Link
                  href={n.link ? `/${societySlug}${n.link}` : "#"}
                  className={`flex flex-col gap-0.5 px-3 py-2 cursor-pointer ${!n.isRead ? "bg-blue-50" : ""}`}
                >
                  <span className="text-sm font-medium leading-tight">{n.title}</span>
                  <span className="text-xs text-muted-foreground line-clamp-1">{n.body}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                </Link>
              </DropdownMenuItem>
            ))
          )}
          {notifications.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/${societySlug}/notifications`} className="text-center text-sm text-blue-600 w-full justify-center">
                  View all
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
