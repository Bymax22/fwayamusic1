"use client";

import { Bell, ChevronRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: {
    link?: string;
    title?: string;
    coverUrl?: string;
  };
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function NotificationBell() {
  const { user, getToken } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    fetchNotifications();
  }, [user]);
  
  useEffect(() => {
    let timer: any;
    const poll = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${BASE_URL}/api/v1/notifications/me/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const j = await res.json();
          const unread = typeof j.unreadCount === 'number' ? j.unreadCount : 0;
          if (unread > 0 && notifications.length === 0) {
            fetchNotifications();
          }
        }
      } catch (e) {
        // ignore polling errors
      } finally {
        timer = setTimeout(poll, 15000);
      }
    };

    if (user) poll();
    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setNotifications([]);
        return;
      }

      const response = await fetch(`${BASE_URL}/api/v1/notifications/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        setError(`Unable to load notifications: ${response.statusText || errorText}`);
        return;
      }

      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError("Unable to load notifications. Please try again.");
      console.error("Notification fetch error:", fetchError);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${BASE_URL}/api/v1/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.warn("Failed to mark notification read", id);
      } else {
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === id ? { ...notification, isRead: true } : notification
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification read:", error);
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    if (notification.data?.link) {
      window.location.href = notification.data.link;
      return;
    }

    window.location.href = "/notifications";
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="relative text-gray-400 hover:text-white transition"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex min-w-[18px] h-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-[320px] overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900">
            <div>
              <p className="text-sm font-semibold text-white">Notifications</p>
              <p className="text-xs text-slate-400">{unreadCount} unread</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white"
              aria-label="Close notifications"
            >
              <ChevronDown size={16} className="rotate-180" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="p-4 text-sm text-slate-300">Loading notifications...</div>
            )}

            {error && (
              <div className="p-4 text-sm text-red-400">{error}</div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="p-4 text-sm text-slate-400">No notifications yet.</div>
            )}

            {!loading && !error && notifications.slice(0, 5).map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left px-4 py-3 transition ${notification.isRead ? "bg-slate-950 hover:bg-slate-900" : "bg-slate-900 hover:bg-slate-800"}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 h-2.5 w-2.5 rounded-full ${notification.isRead ? "bg-slate-600" : "bg-indigo-400"}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{notification.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400 line-clamp-2">{notification.message}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-white/10 bg-slate-900 px-4 py-3">
            <Link href="/notifications" className="inline-flex w-full items-center justify-between rounded-2xl bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
              View all notifications
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
