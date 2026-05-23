import React, { useEffect, useState, useRef } from "react";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  query, 
  getDocs, 
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { 
  Hash, 
  Volume2, 
  Megaphone, 
  Plus, 
  Send, 
  Trash2, 
  Mic, 
  MicOff, 
  VolumeX, 
  Volume1, 
  Pin, 
  Reply, 
  Smile, 
  UserPlus, 
  CheckCircle2, 
  PhoneOff, 
  Loader2, 
  Users 
} from "lucide-react";
import { db } from "../../firebase";
import { User, WorkspaceChannel, ChannelMessage, ProjectWorkspace } from "../../types";
import { useVoiceRoom } from "../../hooks/useVoiceRoom";

interface ChannelSystemProps {
  workspace: ProjectWorkspace;
  currentUser: User;
  onPostSysMessage?: (content: string) => void;
}

export default function ChannelSystem({
  workspace,
  currentUser,
  onPostSysMessage
}: ChannelSystemProps) {
  const [channels, setChannels] = useState<WorkspaceChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>("general");
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  
  // UI Inputs
  const [messageText, setMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChannelMessage | null>(null);
  
  // Create Channel Form
  const [showCreateChan, setShowCreateChan] = useState(false);
  const [chanName, setChanName] = useState("");
  const [chanType, setChanType] = useState<WorkspaceChannel["type"]>("text");
  const [chanTopic, setChanTopic] = useState("");

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const lastSendRef = useRef<number>(0);

  // Default channels initialization helper
  useEffect(() => {
    if (!workspace.id) return;
    const chanRef = collection(db, "project_workspaces", workspace.id, "channels");
    
    // Subscribe to channels list
    return onSnapshot(query(chanRef), async (snapshot) => {
      if (snapshot.empty) {
        // Initialize default core slots
        const generalChan: WorkspaceChannel = {
          id: "general",
          name: "general",
          type: "text",
          topic: "Kênh thảo luận chung toàn dự án",
          createdBy: "system",
          createdAt: new Date().toISOString()
        };
        const announceChan: WorkspaceChannel = {
          id: "announcements",
          name: "announcements",
          type: "announcement",
          topic: "Thông báo chính thức từ chủ dự án",
          createdBy: "system",
          createdAt: new Date().toISOString()
        };
        const voiceChan: WorkspaceChannel = {
          id: "voice-lounge",
          name: "Voice Lounge",
          type: "voice",
          topic: "Kênh thoại chất lượng cao của team",
          createdBy: "system",
          createdAt: new Date().toISOString()
        };

        try {
          await setDoc(doc(db, "project_workspaces", workspace.id, "channels", "general"), generalChan);
          await setDoc(doc(db, "project_workspaces", workspace.id, "channels", "announcements"), announceChan);
          await setDoc(doc(db, "project_workspaces", workspace.id, "channels", "voice-lounge"), voiceChan);
        } catch (err) {
          console.warn("[Channels] Failed to pre-populate channels:", err);
        }
      } else {
        const list = snapshot.docs.map(d => d.data() as WorkspaceChannel);
        list.sort((a, b) => {
          // General and announcements stay on top
          if (a.id === "announcements") return -1;
          if (b.id === "announcements") return 1;
          if (a.id === "general") return -1;
          if (b.id === "general") return 1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        setChannels(list);
      }
    });
  }, [workspace.id]);

  // Subscribe to messages in current active text channel
  useEffect(() => {
    const activeChan = channels.find(c => c.id === activeChannelId);
    if (!workspace.id || !activeChannelId || (activeChan && activeChan.type === "voice")) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(
      db, 
      "project_workspaces", 
      workspace.id, 
      "channels", 
      activeChannelId, 
      "messages"
    );

    return onSnapshot(query(messagesRef), (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data() as ChannelMessage);
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(list);
      
      // Stagger scroll to bottom
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });
  }, [workspace.id, activeChannelId, channels]);

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];

  // Voice WebRTC Hook Integration
  const voiceChannelId = (activeChannel && activeChannel.type === "voice") ? activeChannel.id : null;
  const {
    participants: voiceParticipants,
    isMuted,
    isDeafened,
    activeSpeakers,
    errorMsg: voiceError,
    toggleMute,
    toggleDeafen
  } = useVoiceRoom(workspace.id, voiceChannelId, currentUser);

  // Trigger Action handlers
  const handleCreateChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chanName.trim()) return;
    const formatName = chanName.trim().toLowerCase().replace(/\s+/g, "-");
    const id = "chan-" + Date.now();
    const newChan: WorkspaceChannel = {
      id,
      name: formatName,
      type: chanType,
      topic: chanTopic.trim() || undefined,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, "project_workspaces", workspace.id, "channels", id), newChan);
    setChanName("");
    setChanTopic("");
    setChanType("text");
    setShowCreateChan(false);
    setActiveChannelId(id);
  };

  const handleDeleteChannel = async (chanId: string) => {
    if (chanId === "general" || chanId === "announcements" || chanId === "voice-lounge") return;
    if (!confirm("Bạn có chắc muốn xóa kênh này? Toàn bộ tin nhắn sẽ biến mất.")) return;
    await deleteDoc(doc(db, "project_workspaces", workspace.id, "channels", chanId));
    setActiveChannelId("general");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const now = Date.now();
    if (now - lastSendRef.current < 2000) {
      alert("Bạn đang gửi tin nhắn quá nhanh. Vui lòng dừng 2 giây giữa các lần gửi.");
      return;
    }
    lastSendRef.current = now;

    const msgId = "chnmsg-" + Date.now();

    // Settle rate limit on Firestore first
    try {
      const lockThrottleRef = doc(
        db,
        "project_workspaces",
        workspace.id,
        "channels",
        activeChannelId,
        "rate_limit",
        currentUser.id
      );
      await setDoc(lockThrottleRef, { lastSent: serverTimestamp() });
    } catch (throttleErr) {
      console.error("[Rate Limit] Cooldown checkpoint failed:", throttleErr);
      alert("Không thể gửi tin nhắn do giới hạn tần suất gửi tin.");
      return;
    }
    
    const payload: ChannelMessage = {
      id: msgId,
      channelId: activeChannelId,
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderAvatar: currentUser.avatarUrl,
      content: messageText.trim(),
      type: "text",
      createdAt: new Date().toISOString(),
      ...(replyingTo ? { replyToId: replyingTo.id } : {})
    };

    const docMsg = doc(
      db, 
      "project_workspaces", 
      workspace.id, 
      "channels", 
      activeChannelId, 
      "messages", 
      msgId
    );
    await setDoc(docMsg, payload);
    setMessageText("");
    setReplyingTo(null);
  };

  const handleDeleteMessage = async (msgId: string) => {
    const docMsg = doc(
      db, 
      "project_workspaces", 
      workspace.id, 
      "channels", 
      activeChannelId, 
      "messages", 
      msgId
    );
    await deleteDoc(docMsg);
  };

  const handleAddReaction = async (msgId: string, emoji: string) => {
    const targetMsg = messages.find(m => m.id === msgId);
    if (!targetMsg) return;

    const currentReactions = targetMsg.reactions || {};
    const shoppers = currentReactions[emoji] || [];
    let updated: string[] = [];

    if (shoppers.includes(currentUser.id)) {
      // Remove reaction
      updated = shoppers.filter(uid => uid !== currentUser.id);
    } else {
      // Add reaction
      updated = [...shoppers, currentUser.id];
    }

    const nextReactions = { ...currentReactions };
    if (updated.length === 0) {
      delete nextReactions[emoji];
    } else {
      nextReactions[emoji] = updated;
    }

    const docMsg = doc(
      db, 
      "project_workspaces", 
      workspace.id, 
      "channels", 
      activeChannelId, 
      "messages", 
      msgId
    );
    await updateDoc(docMsg, { reactions: nextReactions });
  };

  const handlePinMessage = async (msg: ChannelMessage) => {
    const isAlreadyPinned = workspace.pinnedMessageIds?.includes(msg.id);
    let nextPinned = workspace.pinnedMessageIds || [];
    if (isAlreadyPinned) {
      nextPinned = nextPinned.filter(id => id !== msg.id);
    } else {
      nextPinned = [...nextPinned, msg.id];
    }
    
    const wsRef = doc(db, "project_workspaces", workspace.id);
    await updateDoc(wsRef, { pinnedMessageIds: nextPinned });
  };

  return (
    <div className="grid h-[540px] rounded-2xl border border-slate-800 bg-slate-900/30 overflow-hidden lg:grid-cols-[240px_1fr]">
      {/* Sidebar with Channels list */}
      <div className="border-r border-slate-850 bg-slate-950/40 p-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between px-2 mb-3">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Kênh liên lạc</span>
            <button 
              onClick={() => setShowCreateChan(prev => !prev)} 
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[380px]">
            {channels.map((chan) => {
              const isActive = chan.id === activeChannelId;
              const Icon = chan.type === "voice" ? Volume2 : chan.type === "announcement" ? Megaphone : Hash;
              return (
                <div 
                  key={chan.id} 
                  className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition ${
                    isActive ? "bg-indigo-650/15 text-indigo-300 font-bold border-l-2 border-indigo-500" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                  onClick={() => {
                    setActiveChannelId(chan.id);
                    setReplyingTo(null);
                  }}
                >
                  <div className="flex items-center gap-1.5 text-xs truncate">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{chan.name}</span>
                  </div>
                  {!(chan.id === "general" || chan.id === "announcements" || chan.id === "voice-lounge") && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChannel(chan.id);
                      }} 
                      className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* User control status badge */}
        <div className="border-t border-slate-850 pt-2 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.8 truncate">
            <img src={currentUser.avatarUrl} alt={currentUser.displayName} className="h-7 w-7 rounded-lg object-cover" />
            <div className="truncate text-[11px] leading-tight">
              <span className="font-bold text-white block truncate">{currentUser.displayName}</span>
              <span className="text-[9px] text-slate-500 truncate">{currentUser.jobTitle || "Developer"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Channel Flow */}
      <div className="flex flex-col h-full overflow-hidden bg-slate-950/20">
        {/* Create Chan Form Popup */}
        {showCreateChan ? (
          <form onSubmit={handleCreateChannelSubmit} className="p-4 border-b border-slate-850 bg-slate-900/40 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Tạo kênh mới</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input 
                type="text" 
                value={chanName} 
                onChange={(e) => setChanName(e.target.value)} 
                placeholder="Tên kênh (ví dụ: gop-y-art)" 
                className="rounded-lg border border-slate-850 bg-slate-950 px-3 py-1 text-xs text-white outline-none focus:border-indigo-500" 
                required 
              />
              <select 
                value={chanType} 
                onChange={(e) => setChanType(e.target.value as WorkspaceChannel["type"])} 
                className="rounded-lg border border-slate-850 bg-slate-950 px-3 py-1 text-xs text-white"
              >
                <option value="text"># Kênh chữ (Text)</option>
                <option value="voice">🔊 Kênh thoại (Voice Voice)</option>
                <option value="announcement">📢 Thông báo (Announce)</option>
              </select>
            </div>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={chanTopic} 
                onChange={(e) => setChanTopic(e.target.value)} 
                placeholder="Chủ đề / Mô tả của kênh" 
                className="flex-1 rounded-lg border border-slate-850 bg-slate-950 px-3 py-1 text-xs text-white outline-none focus:border-indigo-500" 
              />
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg px-3 py-1 text-xs cursor-pointer">Lưu kênh</button>
            </div>
          </form>
        ) : (
          /* Active Channel Header Info */
          <div className="border-b border-slate-850 px-4 py-2.5 bg-slate-950/10 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-extrabold text-white flex items-center gap-1">
                {activeChannel && activeChannel.type === "voice" ? <Volume2 className="h-3.5 w-3.5" /> : activeChannel && activeChannel.type === "announcement" ? <Megaphone className="h-3.5 w-3.5" /> : <Hash className="h-3.5 w-3.5" />}
                {activeChannel ? activeChannel.name : "general"}
              </h2>
              {activeChannel?.topic && <span className="text-[10px] text-slate-500 mt-0.5 block truncate max-w-lg leading-none">{activeChannel.topic}</span>}
            </div>
            {workspace.pinnedMessageIds && workspace.pinnedMessageIds.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 font-mono">
                <Pin className="h-3 w-3" />
                {workspace.pinnedMessageIds.length} Pinned
              </span>
            )}
          </div>
        )}

        {/* Channel Body: Text Board vs. Voice Board */}
        {activeChannel && activeChannel.type === "voice" ? (
          /* VOICE LOUNGE PANEL */
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-6">
            <div className="rounded-full bg-indigo-500/10 border border-indigo-500/20 p-6 relative">
              <Volume2 className="h-12 w-12 text-indigo-400 animate-pulse" />
              {voiceParticipants.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white font-mono font-bold">
                  {voiceParticipants.length}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Phòng Thoại Đang Hoạt Động</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">Sử dụng WebRTC đàm thoại không gián đoạn. Kết nối tiếng ồn trực tiếp khi làm việc chung.</p>
              {voiceError && <p className="text-[11px] text-rose-400 font-bold border border-rose-500/10 bg-rose-500/5 px-3 py-1.5 rounded-lg mt-3">{voiceError}</p>}
            </div>

            {/* Speaking Participants list in Lounge */}
            <div className="w-full max-w-md flex flex-wrap justify-center gap-3">
              {voiceParticipants.map((p) => {
                const speaking = activeSpeakers[p.userId];
                return (
                  <div key={p.userId} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border transition-all duration-300 ${
                    speaking ? "border-indigo-500 ring-2 ring-indigo-500/10 scale-102" : "border-slate-800"
                  }`}>
                    <img 
                      src={p.userAvatar} 
                      alt={p.userName} 
                      className={`h-6 w-6 rounded-lg object-cover ${speaking ? "ring-2 ring-indigo-500" : ""}`} 
                    />
                    <div className="text-left text-[11px]">
                      <span className="font-bold text-white block">{p.userName}</span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {p.muted ? "Muted" : "Speaking..."}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Media controllers */}
            <div className="flex gap-3 mt-4">
              <button 
                onClick={toggleMute} 
                className={`p-3 rounded-full border transition cursor-pointer ${
                  isMuted ? "bg-rose-600 border-rose-500 text-white" : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                }`}
                title={isMuted ? "Bật Microphone" : "Tắt Microphone"}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              
              <button 
                onClick={toggleDeafen} 
                className={`p-3 rounded-full border transition cursor-pointer ${
                  isDeafened ? "bg-amber-600 border-amber-500 text-white" : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                }`}
                title={isDeafened ? "Bật Âm thanh" : "Tắt Âm thanh"}
              >
                {isDeafened ? <VolumeX className="h-5 w-5" /> : <Volume1 className="h-5 w-5" />}
              </button>
            </div>
          </div>
        ) : (
          /* TEXT CHAT FLOW BOARD */
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 p-4 space-y-3.5 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center">
                  <span className="text-2xl mb-1">💬</span>
                  <p className="text-xs font-sans">Chào đón kênh mới, hãy gửi tin nhắn khai hoang đầu tiên.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSender = msg.senderId === currentUser.id;
                  const isPinned = workspace.pinnedMessageIds?.includes(msg.id);
                  let repliedMsg: ChannelMessage | undefined;
                  if (msg.replyToId) {
                    repliedMsg = messages.find(m => m.id === msg.replyToId);
                  }

                  return (
                    <div key={msg.id} className="flex flex-col">
                      {/* Thread reference tag if found */}
                      {repliedMsg && (
                        <div className="ml-10 mb-0.5 flex items-center gap-1.5 text-[10px] text-indigo-400 font-mono">
                          <Reply className="h-3 w-3 -scale-x-100" />
                          <span className="font-bold">{repliedMsg.senderName}:</span>
                          <span className="truncate max-w-xs">{repliedMsg.content}</span>
                        </div>
                      )}

                      <div className="group flex gap-3 relative">
                        <img src={msg.senderAvatar} alt={msg.senderName} className="h-8 w-8 rounded-xl object-cover" />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[11px] font-black text-indigo-300 leading-none">{msg.senderName}</span>
                            <span className="text-[9px] text-slate-600 font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: "numeric", minute: "numeric" })}
                            </span>
                            {isPinned && <Pin className="h-2.5 w-2.5 text-amber-500" />}
                          </div>

                          <div className="mt-1 max-w-[85%] rounded-2xl border border-slate-850 bg-slate-950 p-3 relative">
                            <p className="whitespace-pre-wrap text-xs text-slate-200">{msg.content}</p>
                            
                            {/* Reactions panel display */}
                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                              <div className="mt-1.8 flex flex-wrap gap-1">
                                {Object.entries(msg.reactions).map(([emoji, uids]) => {
                                  const userIdsList = uids as string[];
                                  return (
                                    <button 
                                      key={emoji}
                                      onClick={() => handleAddReaction(msg.id, emoji)}
                                      className={`inline-flex items-center gap-1 rounded bg-slate-900 border px-1.5 py-0.5 text-[10px] font-bold ${
                                        userIdsList.includes(currentUser.id) ? "border-indigo-505 text-indigo-300" : "border-slate-800 text-slate-400"
                                      }`}
                                    >
                                      <span>{emoji}</span>
                                      <span>{userIdsList.length}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Inline micro hover menu panel */}
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1.5 items-center bg-slate-900 border border-slate-800 rounded-lg p-1 absolute top-0 right-2">
                          <button onClick={() => setReplyingTo(msg)} title="Reply" className="text-slate-400 hover:text-indigo-400 p-0.5 rounded cursor-pointer">
                            <Reply className="h-3.5 w-3.5" />
                          </button>
                          
                          <button onClick={() => handlePinMessage(msg)} title={isPinned ? "Unpin" : "Pin message"} className="text-slate-400 hover:text-amber-400 p-0.5 rounded cursor-pointer">
                            <Pin className="h-3.5 w-3.5" />
                          </button>

                          {["👍", "❤️", "🔥", "🚀"].map(emoji => (
                            <button 
                              key={emoji} 
                              onClick={() => handleAddReaction(msg.id, emoji)} 
                              className="text-[11px] hover:scale-120 transition p-0.5 cursor-pointer"
                            >
                              {emoji}
                            </button>
                          ))}

                          {(isSender || workspace.ownerId === currentUser.id) && (
                            <button onClick={() => handleDeleteMessage(msg.id)} title="Delete" className="text-slate-450 hover:text-rose-500 p-0.5 rounded cursor-pointer">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef}></div>
            </div>

            {/* Message input panel */}
            <form onSubmit={handleSendMessage} className="border-t border-slate-850 p-3 bg-slate-950/20">
              {replyingTo && (
                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl px-3 py-1.5 mb-2 flex items-center justify-between text-[10px] text-indigo-300">
                  <span className="truncate">Đang trả lời @{replyingTo.senderName}: "{replyingTo.content}"</span>
                  <button onClick={() => setReplyingTo(null)} className="font-bold text-slate-500 hover:text-white cursor-pointer select-none">Hủy</button>
                </div>
              )}
              
              <div className="flex gap-2">
                <input 
                  value={messageText} 
                  onChange={(e) => setMessageText(e.target.value)} 
                  placeholder={
                    activeChannel && activeChannel.type === "announcement" && workspace.ownerId !== currentUser.id 
                      ? "Chỉ chủ dự án mới được đăng thông báo..." 
                      : `Gửi tin nhắn vào #${activeChannel ? activeChannel.name : "general"}...`
                  } 
                  disabled={activeChannel && activeChannel.type === "announcement" && workspace.ownerId !== currentUser.id}
                  className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-50" 
                />
                <button 
                  type="submit" 
                  disabled={activeChannel && activeChannel.type === "announcement" && workspace.ownerId !== currentUser.id}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white p-2 flex items-center justify-center transition disabled:opacity-50 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
