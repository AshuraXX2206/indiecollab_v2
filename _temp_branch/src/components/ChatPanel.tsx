import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  X, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  MoreVertical, 
  Phone,
  Check,
  CheckCheck,
  Reply
} from "lucide-react";
import { ChatMessage, User } from "../types";
import { db } from "../firebase";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  updateDoc,
  doc,
  getDocs,
  limit,
  writeBatch
} from "firebase/firestore";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  otherUser?: User;
  studioId?: string;
  studioName?: string;
  initialMessage?: string;
}

const MESSAGES_PER_PAGE = 50;

export default function ChatPanel({ 
  isOpen, 
  onClose, 
  currentUser,
  otherUser,
  studioId,
  studioName,
  initialMessage
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState(initialMessage || "");
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Generate conversation ID
  const getConversationId = useCallback(() => {
    if (studioId) return `studio_${studioId}`;
    if (otherUser) {
      const ids = [currentUser.id, otherUser.id].sort();
      return `user_${ids[0]}_${ids[1]}`;
    }
    return "";
  }, [currentUser.id, otherUser, studioId]);

  const conversationId = getConversationId();
  const chatTitle = studioName || otherUser?.displayName || "Chat";
  const chatAvatar = otherUser?.avatarUrl || (studioId ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150" : "");

  // Subscribe to messages
  useEffect(() => {
    if (!isOpen || !conversationId) return;

    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("conversationId", "==", conversationId),
      where("participantIds", "array-contains", currentUser.id),
      orderBy("createdAt", "desc"),
      limit(MESSAGES_PER_PAGE)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          ...data
        } as ChatMessage);
      });
      setMessages(msgs.reverse());
      setHasMore(snapshot.docs.length === MESSAGES_PER_PAGE);
      setIsLoading(false);

      // Mark messages as read using batch updates to prevent write loops and storms (QA-005)
      const batch = writeBatch(db);
      let needsCommit = false;
      msgs.forEach((msg) => {
        if (msg.senderId !== currentUser.id && !msg.readBy?.includes(currentUser.id)) {
          const msgRef = doc(db, "messages", msg.id);
          batch.update(msgRef, {
            readBy: [...(msg.readBy || []), currentUser.id]
          });
          needsCommit = true;
        }
      });
      if (needsCommit) {
        batch.commit().catch((err) => console.error("Error committing read status batch:", err));
      }
    });

    return () => unsubscribe();
  }, [isOpen, conversationId, currentUser.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputMessage.trim() || !conversationId) return;

    const messageText = inputMessage.trim();
    setInputMessage("");
    setReplyingTo(null);

    try {
      const newMessage = {
        conversationId,
        participantIds: studioId ? [currentUser.id] : [currentUser.id, otherUser?.id].filter(Boolean),
        senderId: currentUser.id,
        senderName: currentUser.displayName,
        senderAvatar: currentUser.avatarUrl,
        content: messageText,
        type: "text",
        createdAt: new Date().toISOString(),
        readBy: [currentUser.id],
        replyTo: replyingTo?.id || null
      };

      await addDoc(collection(db, "messages"), newMessage);
    } catch (err) {
      console.error("Failed to send message:", err);
      setInputMessage(messageText); // Restore on failure
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("vi-VN", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hôm nay";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hôm qua";
    }
    return date.toLocaleDateString("vi-VN", { 
      day: "numeric", 
      month: "short" 
    });
  };

  const getReadStatus = (msg: ChatMessage) => {
    if (studioId) {
      // Group chat - show read count
      const readCount = (msg.readBy || []).length - 1; // exclude sender
      return readCount > 0 ? `Đã đọc ${readCount}` : "Đã gửi";
    }
    // 1-1 chat
    if (msg.senderId !== currentUser.id) return null;
    const isRead = (msg.readBy || []).some(id => id !== currentUser.id);
    return isRead ? <CheckCheck className="h-3 w-3 text-emerald-400" /> : <Check className="h-3 w-3 text-slate-500" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={chatAvatar} 
              alt={chatTitle}
              className="h-10 w-10 rounded-xl object-cover border border-slate-700"
            />
            {otherUser?.openToWork && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">{chatTitle}</h3>
            <p className="text-[10px] text-slate-500 font-mono">
              {studioId ? "Nhóm studio" : otherUser?.jobTitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {}}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <Phone className="h-4 w-4" />
          </button>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950">
        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        )}

        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-900/50 flex items-center justify-center mb-3">
              <Send className="h-6 w-6 text-slate-600" />
            </div>
            <p className="text-xs text-slate-500 font-mono">
              {initialMessage ? "Bắt đầu cuộc trò chuyện" : "Chưa có tin nhắn"}
            </p>
          </div>
        )}

        {/* Date separators */}
        {(() => {
          let lastDate = "";
          return messages.map((msg, idx) => {
            const msgDate = formatDate(msg.createdAt);
            const showDate = msgDate !== lastDate;
            lastDate = msgDate;

            const isMe = msg.senderId === currentUser.id;
            const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="flex justify-center py-2">
                    <span className="text-[10px] font-mono text-slate-600 bg-slate-900/50 px-2 py-0.5 rounded-full">
                      {msgDate}
                    </span>
                  </div>
                )}

                <div className={`group flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                  {!isMe && (
                    <div className="w-8 flex-shrink-0">
                      {showAvatar && (
                        <img 
                          src={msg.senderAvatar} 
                          alt={msg.senderName}
                          className="h-7 w-7 rounded-lg object-cover"
                        />
                      )}
                    </div>
                  )}
                  
                  <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                    {/* Reply reference */}
                    {msg.replyTo && (
                      <div className="mb-1 px-2 py-1 bg-slate-900/70 border-l-2 border-slate-600 rounded text-[10px] text-slate-400 truncate max-w-[200px]">
                        {messages.find(m => m.id === msg.replyTo)?.content || "Tin nhắn đã xóa"}
                      </div>
                    )}

                    <div 
                      className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                        isMe 
                          ? "bg-indigo-600 text-white rounded-br-md" 
                          : "bg-slate-800 text-slate-200 rounded-bl-md"
                      }`}
                    >
                      {!isMe && showAvatar && (
                        <p className="text-[10px] font-semibold text-indigo-400 mb-0.5">{msg.senderName}</p>
                      )}
                      <p>{msg.content}</p>
                    </div>
                    
                    <div className={`flex items-center gap-1 mt-0.5 ${isMe ? "justify-end" : ""}`}>
                      <span className="text-[9px] text-slate-600 font-mono">
                        {formatTime(msg.createdAt)}
                      </span>
                      {isMe && getReadStatus(msg)}
                    </div>
                  </div>

                  {/* Message actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-500"
                    >
                      <Reply className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </React.Fragment>
            );
          });
        })()}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Reply className="h-3 w-3" />
            <span className="truncate max-w-[200px]">{replyingTo.content}</span>
          </div>
          <button 
            onClick={() => setReplyingTo(null)}
            className="text-slate-500 hover:text-slate-300"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/30">
        <div className="flex items-end gap-2">
          <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition">
            <Paperclip className="h-4 w-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition">
            <ImageIcon className="h-4 w-4" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              rows={1}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none max-h-24"
              style={{ minHeight: "36px" }}
            />
          </div>
          
          <button 
            onClick={handleSend}
            disabled={!inputMessage.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[9px] text-slate-600 font-mono mt-1.5 text-center">
          Nhấn Enter để gửi • Shift + Enter để xuống dòng
        </p>
      </div>
    </div>
  );
}
