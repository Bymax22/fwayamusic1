"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Bell } from "lucide-react";
import { subscribe } from "@/lib/realtime";

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

export default function NotificationsPage() {
  const { user, getToken } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void fetchNotifications();
    let cleanup: (() => void) | undefined;
    void getToken().then((token) => subscribe('notification:new', (notification: NotificationItem) => {
      setNotifications((current) => [notification, ...current.filter((item) => item.id !== notification.id)]);
    }, token)).then((unsubscribe) => { cleanup = unsubscribe; });
    return () => cleanup?.();
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch(`${BASE_URL}/api/v1/notifications/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        setError(text || "Failed to load notifications");
        return;
      }

      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      console.error("Notifications fetch failed:", fetchError);
      setError("Unable to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (notificationId: number) => {
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch(`${BASE_URL}/api/v1/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setNotifications((current) =>
          current.map((item) =>
            item.id === notificationId ? { ...item, isRead: true } : item
          )
        );
      }
    } catch (error) {
      console.error("Mark read failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-3xl bg-purple/10 p-3 text-purple/45">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Notifications</h1>
            <p className="text-sm text-white/60">All recent activity for your account.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-charcoal p-4">
          {loading && <p className="text-white/60">Loading notifications...</p>}
          {error && <p className="text-purple/60">{error}</p>}

          {!loading && !error && notifications.length === 0 && (
            <div className="rounded-3xl border border-dashed border-white/10 bg-black p-8 text-center text-white/60">
              No notifications yet.
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-3xl border px-4 py-4 transition ${notification.isRead ? "border-white/10 bg-black" : "border-purple/30 bg-charcoal"}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{notification.title}</h2>
                      <p className="mt-1 text-sm text-white/60">{notification.message}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/60">{new Date(notification.createdAt).toLocaleString()}</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => markRead(notification.id)}
                          className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/10"
                        >
                          Mark as read
                        </button>
                        {notification.data?.link && (
                          <Link href={notification.data.link} className="rounded-full bg-purple/75 px-3 py-1 text-xs font-semibold text-white transition hover:bg-purple/60">
                            View content
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
