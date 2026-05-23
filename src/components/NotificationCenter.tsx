import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  X, 
  Check, 
  Trash2,
  UserPlus,
  Users,
  CheckCircle,
  FileText,
  MessageSquare,
  Calendar,
  Gamepad2,
  Award,
  AlertCircle
} from "lucide-react";
import { Notification } from "../types";
import { db } from "../firebase";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc,
  doc,
  deleteDoc,
  writeBatch
} from "firebase/firestore";

interface NotificationCenterProps {
  currentUserId: string;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  connection_request: UserPlus,
  connection_accepted: CheckCircle,
  studio_join_request: Users,
  studio_join_accepted: CheckCircle,
  task_assigned: FileText,
  task_completed: CheckCircle,
  bounty_claimed: Award,
  bounty_solved: Award,
  file_shared: FileText,
  build_uploaded: Gamepad2,
  calendar_event: Calendar,
  message: MessageSquare,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  connection_request: "bg-indigo-500",
  connection_accepted: "bg-emerald-500",
  studio_join_request: "bg-purple-500",
  studio_join_accepted: "bg-emerald-500",
  task_assigned: "bg-amber-500",
  task_completed: "bg-emerald-500",
  bounty_claimed: "bg-rose-500",
  bounty_solved: "bg-emerald-500",
  file_shared: "bg-cyan-500",
  build_uploaded: "bg-pink-500",
  calendar_event: "bg-blue-500",
  message: "bg-indigo-500",
};

export default function NotificationCenter({ 
  currentUserId,
  unreadCount,
  setUnreadCount
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Subscribe to notifications
  useEffect(() => {
    if (!currentUserId) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", currentUserId),
      orderBy("createdAt", "desc"),
      // limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = [];
      let unread = 0;
      snapshot.forEach((doc) => {
        const data = doc.data() as Notification;
        notifs.push({ ...data, id: doc.id });
        if (!data.read) unread++;
      });
      setNotifications(notifs);
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [currentUserId, setUnreadCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const notifRef = doc(db, "notifications", notificationId);
      await updateDoc(notifRef, {
        read: true,
        readAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach(n => {
      const notifRef = doc(db, "notifications", n.id);
      batch.update(notifRef, { read: true, readAt: new Date().toISOString() });
    });
    
    try {
      await batch.commit();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, "notifications", notificationId));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const clearAll = async () => {
    if (!confirm("Xóa tất cả thông báo?")) return;
    
    const batch = writeBatch(db);
    notifications.forEach(n => {
      batch.delete(doc(db, "notifications", n.id));
    });
    
    try {
      await batch.commit();
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString("vi-VN", { day: "numeric", month: "short" });
  };

  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-slate-800/60 transition text-slate-400 hover:text-slate-200"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 min-w-[16px] flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-slate-900 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-200">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-bold rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition"
                  title="Đánh dấu tất cả đã đọc"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 py-2 text-[11px] font-medium transition ${
                filter === "all" 
                  ? "text-indigo-400 border-b-2 border-indigo-500" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`flex-1 py-2 text-[11px] font-medium transition ${
                filter === "unread" 
                  ? "text-indigo-400 border-b-2 border-indigo-500" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-2xl bg-slate-900/50 flex items-center justify-center mb-3">
                  <Bell className="h-5 w-5 text-slate-600" />
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  {filter === "unread" ? "Không có thông báo chưa đọc" : "Chưa có thông báo nào"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {filteredNotifications.map((notif) => {
                  const Icon = NOTIFICATION_ICONS[notif.type] || AlertCircle;
                  const colorClass = NOTIFICATION_COLORS[notif.type] || "bg-slate-500";
                  
                  return (
                    <div
                      key={notif.id}
                      onClick={() => !notif.read && markAsRead(notif.id)}
                      className={`flex gap-3 p-3 hover:bg-slate-900/50 transition cursor-pointer ${
                        !notif.read ? "bg-slate-900/30" : ""
                      }`}
                    >
                      {/* Icon */}
                      <div className={`h-9 w-9 rounded-xl ${colorClass}/20 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-4 w-4 ${colorClass.replace("bg-", "text-")}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-slate-200 font-medium line-clamp-2">
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {notif.message}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[9px] text-slate-600 font-mono">
                            {formatTime(notif.createdAt)}
                          </span>
                          {notif.actorName && (
                            <span className="text-[9px] text-slate-500 flex items-center gap-1">
                              <img 
                                src={notif.actorAvatar || "https://ui-avatars.com/api/?name=" + notif.actorName} 
                                alt="" 
                                className="h-4 w-4 rounded-full"
                              />
                              {notif.actorName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="p-1 rounded hover:bg-slate-800 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-800 p-2">
              <button
                onClick={clearAll}
                className="w-full py-2 text-[11px] text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition"
              >
                Xóa tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
