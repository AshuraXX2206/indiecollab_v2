import React, { useState } from "react";
import GameJamTab from "./GameJamTab";
import GameStudios from "./GameStudios";
import { User, GameStudio, UserConnection, StudioJoinRequest } from "../types";
import { 
  Search, 
  Sparkles, 
  Video, 
  Contact, 
  UserPlus, 
  Copy, 
  ExternalLink, 
  Users,
  CheckCircle2,
  Mail,
  Gamepad,
  Plus,
  Trash2,
  Crown,
  LogOut,
  FolderOpen
} from "lucide-react";

interface TalentHubProps {
  users: User[];
  highlightedUserIds: string[];
  activeProjectForMatch: string | null;
  isGoogleUser: boolean;
  googleContacts: any[];
  onCreateMeetRoom: (partnerName: string) => Promise<string | null>;
  studios: GameStudio[];
  onCreateStudio: (studioPayload: Omit<GameStudio, "id" | "ownerId" | "ownerName" | "createdAt">) => void;
  onUpdateStudio: (studioId: string, updatedPayload: Partial<GameStudio>) => void;
  onDeleteStudio: (studioId: string) => void;
  currentUser: User | null;
  connections: UserConnection[];
  onSendConnectionRequest: (toUserId: string, message?: string) => void;
  onRespondConnection: (connectionId: string, response: "accepted" | "declined") => void;
  onCancelConnection: (connectionId: string) => void;
  onRequestJoinStudio: (studioId: string, message?: string) => void;
  studioJoinRequests: StudioJoinRequest[];
  pendingConnectionCount: number;
}

export default function TalentHub({ 
  users, 
  highlightedUserIds, 
  activeProjectForMatch,
  isGoogleUser,
  googleContacts,
  onCreateMeetRoom,
  studios,
  onCreateStudio,
  onUpdateStudio,
  onDeleteStudio,
  currentUser,
  connections,
  onSendConnectionRequest,
  onRespondConnection,
  onCancelConnection,
  onRequestJoinStudio,
  studioJoinRequests,
  pendingConnectionCount
}: TalentHubProps) {
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [activeContactSubTab, setActiveContactSubTab] = useState<"lobby" | "google" | "studios">("lobby");

  const [connectingUserId, setConnectingUserId] = useState<string | null>(null);
  const [connectionMessage, setConnectionMessage] = useState("");

  // Track created meet rooms by userId or contact email
  const [createdMeets, setCreatedMeets] = useState<Record<string, string>>({});
  const [isMeetCreating, setIsMeetCreating] = useState<Record<string, boolean>>({});
  const [copiedMeetId, setCopiedMeetId] = useState<string | null>(null);

  // Per-studio active tab tracking (studioId -> tab)
  const [studioActiveTabs, setStudioActiveTabs] = useState<Record<string, "overview" | "gamejam">>({});
  const getStudioTab = (id: string) => studioActiveTabs[id] ?? "overview";
  const setStudioTab = (id: string, tab: "overview" | "gamejam") =>
    setStudioActiveTabs(prev => ({ ...prev, [id]: tab }));

  // Create Studio States
  const [showCreateStudioForm, setShowCreateStudioForm] = useState(false);
  const [studioFormName, setStudioFormName] = useState("");
  const [studioFormAvatar, setStudioFormAvatar] = useState("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150");
  const [studioFormDesc, setStudioFormDesc] = useState("");

  const handleCreateStudioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioFormName || !studioFormDesc) {
      alert("Vui lòng điền thông tin đầy đủ để lập studio!");
      return;
    }
    onCreateStudio({
      name: studioFormName,
      avatarUrl: studioFormAvatar,
      description: studioFormDesc,
      members: currentUser ? [currentUser.displayName] : []
    });
    setStudioFormName("");
    setStudioFormDesc("");
    setShowCreateStudioForm(false);
  };

  const handleJoinStudio = (studio: GameStudio) => {
    if (!currentUser) return;
    if (studio.members.includes(currentUser.displayName)) return;
    const updatedMembers = [...studio.members, currentUser.displayName];
    onUpdateStudio(studio.id, { members: updatedMembers });
  };

  const handleLeaveStudio = (studio: GameStudio) => {
    if (!currentUser) return;
    const updatedMembers = studio.members.filter(m => m !== currentUser.displayName);
    onUpdateStudio(studio.id, { members: updatedMembers });
  };

  const handleKickMember = (studio: GameStudio, memberName: string) => {
    const updatedMembers = studio.members.filter(m => m !== memberName);
    onUpdateStudio(studio.id, { members: updatedMembers });
  };

  const handleDissolveStudio = (studioId: string) => {
    if (confirm("Bạn có tin chắc muốn giải tán Game Studio này vĩnh viễn không? Hành động này không thể hoàn tác.")) {
      onDeleteStudio(studioId);
    }
  };

  // Job type categories for filtering - values match JobType enum string values
  const jobCategories = [
    { group: null,          value: "all",                           label: "🌟 All Roles" },
    // Programming
    { group: "💻 Code",    value: "Gameplay Programmer",           label: "🎮 Gameplay Programmer" },
    { group: "💻 Code",    value: "Engine Programmer",             label: "⚙️ Engine Programmer" },
    { group: "💻 Code",    value: "AI Programmer",                 label: "🤖 AI Programmer" },
    { group: "💻 Code",    value: "Graphics Programmer",           label: "🎨 Graphics Programmer" },
    { group: "💻 Code",    value: "Network/Multiplayer Programmer", label: "🌐 Network Programmer" },
    { group: "💻 Code",    value: "Tools Programmer",              label: "🛠️ Tools Programmer" },
    { group: "💻 Code",    value: "VR/AR Developer",               label: "🥽 VR/AR Developer" },
    { group: "💻 Code",    value: "AI Game Developer",             label: "🧠 AI Game Developer" },
    // Art
    { group: "🎨 Art",     value: "Concept Artist",                label: "✏️ Concept Artist" },
    { group: "🎨 Art",     value: "2D Character Artist",           label: "👤 2D Character Artist" },
    { group: "🎨 Art",     value: "3D Character Artist",           label: "🎭 3D Character Artist" },
    { group: "🎨 Art",     value: "Pixel Artist",                  label: "👾 Pixel Artist" },
    { group: "🎨 Art",     value: "VFX Artist",                    label: "✨ VFX Artist" },
    { group: "🎨 Art",     value: "Technical Artist",              label: "🔧 Technical Artist" },
    { group: "🎨 Art",     value: "2D Animator",                   label: "🏃 2D Animator" },
    { group: "🎨 Art",     value: "3D Animator",                   label: "🎬 3D Animator" },
    { group: "🎨 Art",     value: "UI/UX Artist",                  label: "🎯 UI/UX Artist" },
    { group: "🎨 Art",     value: "Shader Artist",                 label: "💠 Shader Artist" },
    // Audio
    { group: "🔊 Audio",   value: "Sound Designer",               label: "🔊 Sound Designer" },
    { group: "🔊 Audio",   value: "Music Composer",               label: "🎵 Music Composer" },
    { group: "🔊 Audio",   value: "Audio Director",               label: "🎚️ Audio Director" },
    // Design
    { group: "🎮 Design",  value: "Game Designer",                label: "🎮 Game Designer" },
    { group: "🎮 Design",  value: "Level Designer",               label: "🏗️ Level Designer" },
    { group: "🎮 Design",  value: "Combat Designer",              label: "⚔️ Combat Designer" },
    { group: "🎮 Design",  value: "Narrative Designer",           label: "📚 Narrative Designer" },
    { group: "🎮 Design",  value: "Economy Designer",             label: "💰 Economy Designer" },
    // Writing
    { group: "📖 Writing", value: "Narrative Writer",             label: "📖 Narrative Writer" },
    { group: "📖 Writing", value: "Quest Writer",                 label: "🗡️ Quest Writer" },
    { group: "📖 Writing", value: "World Builder",                label: "🌍 World Builder" },
    // Production
    { group: "📊 Prod",    value: "Producer",                     label: "� Producer" },
    { group: "📊 Prod",    value: "Project Manager",              label: "� Project Manager" },
    { group: "📊 Prod",    value: "QA Tester",                    label: "🐛 QA Tester" },
    { group: "📊 Prod",    value: "Community Manager",            label: "💬 Community Manager" },
    // Indie
    { group: "💡 Indie",   value: "Solo Developer (Generalist)",  label: "🚀 Solo Dev" },
    { group: "💡 Indie",   value: "Indie Developer",              label: "💡 Indie Dev" },
    { group: "💡 Indie",   value: "Modder",                       label: "🔩 Modder" },
  ];

  const handleCreateMeet = async (id: string, name: string) => {
    setIsMeetCreating(prev => ({ ...prev, [id]: true }));
    try {
      const meetLink = await onCreateMeetRoom(name);
      if (meetLink) {
        setCreatedMeets(prev => ({ ...prev, [id]: meetLink }));
      }
    } catch (err) {
      console.error(err);
      alert("Không tạo được phòng họp Meet v2. Hãy kiểm tra kết nối Google API.");
    } finally {
      setIsMeetCreating(prev => ({ ...prev, [id]: false }));
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMeetId(id);
    setTimeout(() => setCopiedMeetId(null), 2000);
  };

  // Filter indie developers
  const filteredLobbyUsers = (users || []).filter((u) => {
    if (!u) return false;
    // Exclude current user from the partners lobby list
    if (currentUser && u.id === currentUser.id) return false;
    // Only show users who have completed their profile setup
    if (!u.profileComplete) return false;

    // Filter out guest accounts
    if (u.isGuest === true) return false;
    if (u.id && u.id.startsWith("guest-")) return false;
    if (u.displayName) {
      const guestNouns = ["Pixel_Hunter", "Chibi_Artist", "Synthwave_Boss", "Engine_Knight", "Vibe_Composer", "Game_Jam_King"];
      const matchesNounPattern = guestNouns.some(noun => u.displayName.startsWith(noun + "_"));
      if (matchesNounPattern) return false;
      if (u.displayName.toLowerCase().includes("guest")) return false;
      if (u.displayName.toLowerCase().startsWith("khách")) return false;
    }

    const matchesSearch = (u.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
                          (u.bio || "").toLowerCase().includes(search.toLowerCase()) ||
                          (u.skills || []).some(s => (s || "").toLowerCase().includes(search.toLowerCase())) ||
                          (u.tools || []).some(t => (t || "").toLowerCase().includes(search.toLowerCase()));
    const matchesClass = selectedClass === "all" || (u.jobTitle || "") === selectedClass;

    return matchesSearch && matchesClass;
  });

  // Filter Google Workspace Contacts
  const filteredGoogleContacts = (googleContacts || []).filter((contact: any) => {
    if (!contact) return false;
    const name = contact.names?.[0]?.displayName || "";
    const email = contact.emailAddresses?.[0]?.value || "";
    return name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div id="talent-hub-container" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      
      {/* Visual Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg text-white">
              <Users className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-black text-white tracking-tight">
              Tìm Đồng Đội & Sảnh Họp Lịch
            </h1>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Gặp gỡ các developer, artist, designer khác và tạo nhanh cuộc họp nhóm qua Google Meet.
          </p>
        </div>

        {/* Dual navigation tabs for local Lobby vs Google Contacts */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900 self-start sm:self-center">
          <button
            onClick={() => setActiveContactSubTab("lobby")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeContactSubTab === "lobby"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-250"
            }`}
          >
            <Gamepad className="h-3.5 w-3.5" /> Thành viên
          </button>
          <button
            onClick={() => setActiveContactSubTab("studios")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeContactSubTab === "studios"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-250"
            }`}
          >
            <FolderOpen className="h-3.5 w-3.5" /> Game Studios
            {studios && studios.length > 0 && (
              <span className="h-4 px-1.5 text-[9px] bg-indigo-500 text-white rounded-full flex items-center justify-center">
                {studios.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveContactSubTab("google")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeContactSubTab === "google"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-250"
            }`}
          >
            <Contact className="h-3.5 w-3.5" /> Google Contacts (Danh bạ)
            {isGoogleUser && googleContacts && googleContacts.length > 0 && (
              <span className="h-4 px-1.5 text-[9px] bg-indigo-500 text-white rounded-full flex items-center justify-center">
                {googleContacts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* AI Recommendation notification banner */}
      {activeProjectForMatch && highlightedUserIds && highlightedUserIds.length > 0 && activeContactSubTab === "lobby" && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-indigo-500/20 bg-indigo-950/25 p-3 text-xs text-indigo-300">
          <Sparkles className="h-4.5 w-4.5 animate-pulse" />
          <span>
            AI gợi ý những đồng đội tiềm năng có thể hợp cạ với dự án của bạn! Những ai có viền sáng là người có kỹ năng bạn đang cần.
          </span>
        </div>
      )}

      {/* Controls & searching options */}
      {activeContactSubTab !== "studios" && (
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder={
                activeContactSubTab === "lobby"
                  ? "Tìm kiếm kỹ năng (Pixel art, Physics...) hoặc công cụ (Godot, FMOD)..."
                  : "Tìm kiếm bạn bè qua tên hoặc email từ danh bạ Google..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-900 bg-slate-900/60 pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none transition animate-fade-in"
            />
          </div>

          {activeContactSubTab === "lobby" && (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white cursor-pointer focus:border-indigo-500 focus:outline-none min-w-[180px]"
            >
              <option value="all">🌟 All Roles</option>
              <optgroup label="💻 Programming">
                {jobCategories.filter(j => j.group === "💻 Code").map(j => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </optgroup>
              <optgroup label="🎨 Art & Visual">
                {jobCategories.filter(j => j.group === "🎨 Art").map(j => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </optgroup>
              <optgroup label="🔊 Audio">
                {jobCategories.filter(j => j.group === "🔊 Audio").map(j => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </optgroup>
              <optgroup label="🎮 Design">
                {jobCategories.filter(j => j.group === "🎮 Design").map(j => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </optgroup>
              <optgroup label="📖 Writing">
                {jobCategories.filter(j => j.group === "📖 Writing").map(j => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </optgroup>
              <optgroup label="📊 Production">
                {jobCategories.filter(j => j.group === "📊 Prod").map(j => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </optgroup>
              <optgroup label="💡 Indie">
                {jobCategories.filter(j => j.group === "💡 Indie").map(j => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </optgroup>
            </select>
          )}
        </div>
      )}

      {/* LOBBY ACTIVE DEV CARDS */}
      {activeContactSubTab === "lobby" && (
        filteredLobbyUsers.length === 0 ? (
          <div className="mt-12 text-center text-slate-500 text-xs py-10">
            Không tìm thấy thành viên game dev nào khớp với bộ lọc.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLobbyUsers.map((user) => {
              const isAIRecommended = highlightedUserIds && highlightedUserIds.includes(user.id);
              const hasMeet = createdMeets[user.id];
              const isCreating = isMeetCreating[user.id];

              return (
                <div
                  key={user.id}
                  className={`group relative overflow-hidden rounded-2xl border bg-slate-900/30 p-5 transition-all duration-300 hover:-translate-y-1 ${
                    isAIRecommended 
                      ? "border-indigo-500 bg-indigo-950/10 shadow-lg shadow-indigo-500/5" 
                      : "border-slate-900 hover:border-slate-800 hover:bg-slate-900/60"
                  }`}
                >
                  {isAIRecommended && (
                    <div className="absolute top-0 right-0 rounded-bl-xl bg-gradient-to-r from-pink-500 to-indigo-500 px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider text-white flex items-center gap-1 shadow-md">
                      <Sparkles className="h-3 w-3" /> Gợi ý quan trọng
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="h-13 w-13 rounded-xl object-cover ring-2 ring-slate-850 group-hover:ring-indigo-500/30 transition"
                      />
                      {user.openToWork && (
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white font-mono leading-none border border-slate-950 shadow" title="Đang tìm đồng đội">
                          ✓
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-100 group-hover:text-indigo-400 transition">
                        {user.displayName}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {(() => {
                          const job = jobCategories.find(j => j.value === user.jobTitle);
                          const groupColors: Record<string, string> = {
                            "💻 Code":    "bg-blue-950/40 text-blue-300 border-blue-800/40",
                            "🎨 Art":     "bg-pink-950/40 text-pink-300 border-pink-800/40",
                            "🔊 Audio":   "bg-purple-950/40 text-purple-300 border-purple-800/40",
                            "🎮 Design":  "bg-amber-950/40 text-amber-300 border-amber-800/40",
                            "📖 Writing": "bg-teal-950/40 text-teal-300 border-teal-800/40",
                            "📊 Prod":    "bg-emerald-950/40 text-emerald-300 border-emerald-800/40",
                            "💡 Indie":   "bg-orange-950/40 text-orange-300 border-orange-800/40",
                          };
                          const color = job?.group ? (groupColors[job.group] || "bg-indigo-950/40 text-indigo-300 border-indigo-800/40") : "bg-slate-800 text-slate-400 border-slate-700";
                          return (
                            <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[9px] font-bold ${color}`}>
                              {job ? job.label : user.jobTitle}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-[11.5px] leading-relaxed text-slate-400 min-h-[44px] line-clamp-3">
                    "{user.bio || "Thành viên sảnh IndieCollab."}"
                  </p>

                  <div className="mt-4 space-y-2 border-t border-slate-900 pt-3">
                    <div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Kỹ năng / Roles:</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(user.skills || []).map((skill, i) => (
                          <span key={i} className="rounded-md bg-slate-950 border border-slate-900 px-1.8 py-0.5 text-[9px] text-slate-400 font-mono">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-1">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Tech Stack / Tools:</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(user.tools || []).map((tool, i) => (
                          <span key={i} className="rounded-md bg-pink-950/10 border border-pink-900/10 px-1.8 py-0.5 text-[9px] text-pink-300 font-mono">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Connection Actions Block */}
                  {currentUser && (
                    <div className="mt-4 border-t border-slate-900 pt-3">
                      {(() => {
                        const conn = (connections || []).find(
                          c => (c.fromUserId === currentUser.id && c.toUserId === user.id) ||
                               (c.fromUserId === user.id && c.toUserId === currentUser.id)
                        );

                        if (!conn) {
                          return (
                            <button
                              onClick={() => {
                                setConnectingUserId(user.id);
                                setConnectionMessage("");
                              }}
                              className="w-full text-[10.5px] bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition active:scale-[98%] cursor-pointer border border-indigo-500/20"
                            >
                              <UserPlus className="h-3.5 w-3.5" /> Kết nối đồng đội
                            </button>
                          );
                        }

                        if (conn.status === "pending") {
                          if (conn.fromUserId === currentUser.id) {
                            return (
                              <div className="flex items-center justify-between bg-slate-950 border border-slate-850 rounded-lg p-2">
                                <span className="text-[10px] text-slate-400 font-mono">Đang chờ phản hồi...</span>
                                <button
                                  onClick={() => onCancelConnection(conn.id)}
                                  className="text-[9.5px] bg-red-950/40 hover:bg-red-650 border border-red-900/30 hover:border-red-500 text-red-400 hover:text-white px-2.5 py-1 rounded font-bold cursor-pointer transition"
                                >
                                  Hủy yêu cầu
                                </button>
                              </div>
                            );
                          } else {
                            return (
                              <div className="flex flex-col gap-2.5 bg-slate-950 border border-slate-850 rounded-xl p-3 text-left">
                                <span className="text-[10px] text-indigo-400 font-bold font-mono">Lời mời kết nối mới!</span>
                                {conn.message && (
                                  <div className="relative rounded-lg bg-slate-900 border border-slate-850 p-2.5 text-[10.5px] text-slate-350 shadow-inner">
                                    <div className="absolute -top-1 left-4 h-2 w-2 rotate-45 border-t border-l border-slate-850 bg-slate-900" />
                                    <p className="italic leading-relaxed font-sans">"{conn.message}"</p>
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => onRespondConnection(conn.id, "accepted")}
                                    className="flex-1 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-2 rounded cursor-pointer transition"
                                  >
                                    Chấp nhận
                                  </button>
                                  <button
                                    onClick={() => onRespondConnection(conn.id, "declined")}
                                    className="flex-1 text-[10px] bg-red-950/40 hover:bg-red-650 border border-red-900/30 hover:border-red-500 text-red-400 hover:text-white py-1 px-2 rounded cursor-pointer transition"
                                  >
                                    Từ chối
                                  </button>
                                </div>
                              </div>
                            );
                          }
                        }

                        if (conn.status === "accepted") {
                          return (
                            <div className="flex items-center justify-between bg-emerald-950/10 border border-emerald-500/20 rounded-lg p-2">
                              <span className="text-[10px] text-emerald-400 font-bold font-mono flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Đã kết nối
                              </span>
                              <button
                                onClick={() => onCancelConnection(conn.id)}
                                className="text-[9.5px] bg-red-950/40 hover:bg-red-650 border border-red-900/30 hover:border-red-500 text-red-400 hover:text-white px-2.5 py-1 rounded font-bold cursor-pointer transition"
                              >
                                Hủy kết nối
                              </button>
                            </div>
                          );
                        }

                        if (conn.status === "declined") {
                          if (conn.fromUserId === currentUser.id) {
                            return (
                              <div className="flex items-center justify-between bg-slate-950 border border-slate-850 rounded-lg p-2">
                                <span className="text-[10px] text-red-400 font-mono">Bị từ chối</span>
                                <button
                                  onClick={() => onCancelConnection(conn.id)}
                                  className="text-[9.5px] border border-slate-800 hover:bg-slate-800 px-2 py-1 rounded text-slate-300 cursor-pointer"
                                >
                                  Thử lại
                                </button>
                              </div>
                            );
                          } else {
                            return (
                              <div className="flex items-center justify-between bg-slate-950 border border-slate-850 rounded-lg p-2">
                                <span className="text-[10px] text-slate-500 font-mono">Đã từ chối</span>
                                <button
                                  onClick={() => onCancelConnection(conn.id)}
                                  className="text-[9.5px] border border-slate-800 hover:bg-slate-800 px-2 py-1 rounded text-slate-300 cursor-pointer"
                                >
                                  Xóa
                                </button>
                              </div>
                            );
                          }
                        }

                        return null;
                      })()}
                    </div>
                  )}

                  {/* Active Google Meet Integration Block on Card */}
                  <div className="mt-4 border-t border-slate-900 pt-3.5 space-y-2.5">
                    {hasMeet ? (
                      <div className="bg-emerald-950/20 border border-emerald-500/25 rounded-lg p-2 flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> PHÒNG MEET SẴN SÀNG
                        </span>
                        <div className="flex gap-1.5">
                          <a
                            href={hasMeet}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-2 rounded-md flex items-center justify-center gap-1"
                          >
                            Tham gia Meet <ExternalLink className="h-3 w-3" />
                          </a>
                          <button
                            onClick={() => copyToClipboard(hasMeet, user.id)}
                            className="text-[10px] border border-slate-800 hover:bg-slate-800 px-2 py-1.5 rounded-md font-mono text-slate-300 cursor-pointer"
                          >
                            {copiedMeetId === user.id ? "Đã chép" : "Copy"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCreateMeet(user.id, user.displayName)}
                        disabled={isCreating}
                        className="w-full text-[10px] bg-slate-950 hover:bg-slate-900 border border-slate-855 text-indigo-300 font-mono font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition hover:text-white cursor-pointer active:scale-[98%]"
                      >
                        <Video className="h-3.5 w-3.5" />
                        {isCreating ? "Đang kết nối..." : "Tạo phòng Google Meet họp nhanh"}
                      </button>
                    )}

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>Lobby ID: {(user.id || "").substring(0, 10)}</span>
                      <span>{(user.howToReachMe || "").split(", ")[0]}</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )
      )}

      {/* GOOGLE CONTACTS TAB */}
      {activeContactSubTab === "google" && (
        !isGoogleUser ? (
          <div className="mt-8 rounded-2xl border border-slate-900 bg-slate-900/20 p-8 text-center max-w-lg mx-auto">
            <Contact className="mx-auto h-12 w-12 text-slate-500 animate-pulse" />
            <h3 className="mt-4 text-sm font-bold text-slate-200">Bạn chưa liên kết Google Workspace</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Hãy đăng xuất tài khoản cục bộ hiện tại và đăng nhập bằng <b>Google Sign-In</b> ngoài trang chủ để kết kết danh bạ và đồng nghiệp Workspace cực nhanh.
            </p>
          </div>
        ) : filteredGoogleContacts.length === 0 ? (
          <div className="mt-12 text-center text-slate-500 text-xs py-10 bg-slate-900/10 rounded-2xl border border-dashed border-slate-850">
            <Users className="mx-auto h-8 w-8 text-slate-600 mb-3" />
            Không tìm thấy địa chỉ liên lạc nào trong danh bạ Google của bạn, hoặc bạn không có contacts nào phù hợp với từ khóa.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGoogleContacts.map((contact: any, index: number) => {
              const name = contact.names?.[0]?.displayName || "Google Contacts Friend";
              const email = contact.emailAddresses?.[0]?.value || "No Email listed";
              const photoUrl = contact.photos?.[0]?.url || `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`;
              const contactKey = `google-contact-${index}`;
              const hasMeet = createdMeets[contactKey];
              const isCreating = isMeetCreating[contactKey];

              return (
                <div key={contactKey} className="rounded-xl border border-slate-900 bg-slate-900/35 p-4 flex flex-col justify-between hover:border-slate-800 transition">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={photoUrl}
                      alt={name}
                      referrerPolicy="no-referrer"
                      className="h-11 w-11 rounded-full object-cover ring-2 ring-slate-800/80 shrink-0"
                    />
                    <div className="text-left overflow-hidden">
                      <h4 className="text-xs font-bold text-slate-100 truncate">{name}</h4>
                      <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                        <Mail className="h-3 w-3 shrink-0 text-slate-500" /> {email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-900 space-y-2">
                    {hasMeet ? (
                      <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-lg p-2.5 space-y-1.5">
                        <span className="text-[9.5px] font-bold text-indigo-400 font-mono flex items-center gap-1">
                          ✓ LINK MEETING LOBBY KHỞI TẠO
                        </span>
                        <div className="flex gap-2">
                          <a
                            href={hasMeet}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-[10px] bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold py-1.5 px-2 rounded flex items-center justify-center gap-1"
                          >
                            Vào phòng họp tiến độ nhóm <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <button
                            onClick={() => copyToClipboard(hasMeet, contactKey)}
                            className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-1 hover:bg-slate-900 rounded font-mono text-slate-300 cursor-pointer"
                          >
                            {copiedMeetId === contactKey ? "Chép" : "Copy"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCreateMeet(contactKey, name)}
                          disabled={isCreating}
                          className="flex-1 text-[10px] bg-slate-950 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-indigo-300 font-mono py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-[98%]"
                        >
                          <Video className="h-3.5 w-3.5 text-indigo-400" />
                          {isCreating ? "Connecting..." : "Tạo phòng Meet họp nhanh"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {activeContactSubTab === "studios" && (
        <GameStudios
          users={users}
          studios={studios}
          currentUser={currentUser}
          onCreateStudio={onCreateStudio}
          onUpdateStudio={onUpdateStudio}
          onDeleteStudio={onDeleteStudio}
          onRequestJoinStudio={onRequestJoinStudio}
        />
      )}

      {/* Legacy studio markup retained but disabled; GameStudios is now shared with Profile. */}
      {false && activeContactSubTab === "studios" && (
        <div className="mt-8 space-y-8 animate-fade-in text-left">
          {/* Create Studio trigger bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between border border-slate-800 bg-slate-950 p-6 rounded-2xl gap-4">
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-pink-400" />
                Thành Lập Game Studio Của Riêng Bạn
              </h2>
              <p className="text-xs text-slate-400 mt-1">Khởi tạo nhóm phát triển game chuyên nghiệp dài hạn, cùng hợp tác xây dựng thương hiệu và phát hành các sản phẩm chất lượng cao.</p>
            </div>
            {currentUser ? (
              <button
                type="button"
                onClick={() => setShowCreateStudioForm(true)}
                className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 border border-pink-500/25 px-5 py-2.5 text-xs font-black text-white hover:opacity-90 active:scale-95 transition cursor-pointer"
              >
                + Lập Studio Mới
              </button>
            ) : (
              <span className="text-xs text-rose-450 font-mono">Hãy đăng nhập để thiết lập Studio của riêng bạn</span>
            )}
          </div>

          {/* Create Studio Form Overlay */}
          {showCreateStudioForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 backdrop-blur-sm">
              <form 
                onSubmit={handleCreateStudioSubmit}
                className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4"
              >
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    Khởi Tạo Game Studio Mới
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Lập nhóm làm game, chiến dự án dài hạn cùng nhau.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest">Tên Studio</label>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    placeholder="e.g. Pixel Odyssey Collective"
                    value={studioFormName}
                    onChange={(e) => setStudioFormName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest">Ảnh đại diện Studio (Avatar Image URL)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. https://images.unsplash.com/... hoặc ảnh bất kỳ"
                    value={studioFormAvatar}
                    onChange={(e) => setStudioFormAvatar(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStudioFormAvatar("https://images.unsplash.com/photo-1618055182384-a83a8bd57fbe?w=150")}
                      className="text-[9.5px] bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-slate-400 hover:text-white"
                    >
                      Mẫu Space Abstract
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudioFormAvatar("https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=150")}
                      className="text-[9.5px] bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-slate-400 hover:text-white"
                    >
                      Mẫu Cyberpunk Liquid
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest">Mô tả Studio / Tuyên ngôn sản phẩm</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Nhóm tâm huyết tạo ra game RPG 2D nghệ thuật cao, ứng dụng phong cách Zelda cổ truyền."
                    value={studioFormDesc}
                    onChange={(e) => setStudioFormDesc(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateStudioForm(false);
                      setStudioFormName("");
                      setStudioFormDesc("");
                    }}
                    className="rounded-lg border border-slate-800 px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-black text-white hover:bg-indigo-500"
                  >
                    Kích Hoạt Studio
                  </button>
                </div>
              </form>
            </div>
          )}
          {/* List of active independent Studios */}
          {(!studios || studios.length === 0) ? (
            <div className="text-center py-16 border border-slate-850 bg-slate-950/20 rounded-2xl text-slate-500 text-xs font-mono">
              Chưa có nhóm nào được lập. Hãy đặt nền móng và lập studio đầu tiên của bạn!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {studios.map((studio) => {
                const isOwner = currentUser && studio.ownerId === currentUser.id;
                const isMember = currentUser && (studio.members || []).includes(currentUser.displayName);

                return (
                  <div key={studio.id} className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-md p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/35 hover:bg-slate-900/50 flex flex-col justify-between group">
                    {/* Top glassmorphic gradient bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent group-hover:via-indigo-500/40 transition-all duration-500" />
                    
                    <div>
                      <div className="flex items-start gap-4">
                        <img 
                          src={studio.avatarUrl} 
                          alt={studio.name || "Studio"} 
                          className="h-14 w-14 rounded-xl object-cover ring-2 ring-indigo-500/10 shrink-0" 
                        />
                        <div className="text-left overflow-hidden">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="text-sm font-black text-white tracking-tight">{studio.name || "Tên Studio"}</h3>
                            {isOwner && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[8.5px] font-bold text-amber-400 uppercase font-mono tracking-wider">
                                <Crown className="h-2.5 w-2.5" />
                                Nhà Sáng Lập
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-1">
                            <span>Founder:</span>
                            <span className="inline-flex items-center gap-1 text-indigo-400 font-bold bg-indigo-950/30 border border-indigo-900/30 rounded px-1.5 py-0.5">
                              <Crown className="h-3 w-3 text-amber-400" />
                              {studio.ownerName || "Ẩn danh"}
                            </span>
                          </p>
                          <p className="text-xs text-slate-350 mt-3 leading-relaxed whitespace-pre-line">{studio.description || ""}</p>
                        </div>
                      </div>

                        {/* Studio sub-tabs: Overview / Game Jams */}
                    <div className="flex mt-5 border-b border-white/[0.06] gap-0">
                      {(["overview", "gamejam"] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setStudioTab(studio.id, tab)}
                          className={`px-4 py-2 text-[11px] font-bold border-b-2 transition cursor-pointer ${
                            getStudioTab(studio.id) === tab
                              ? "border-violet-500 text-violet-300"
                              : "border-transparent text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          {tab === "overview" ? "Tổng quan" : "🏆 Game Jams"}
                        </button>
                      ))}
                    </div>

                  {/* Member roster list as Avatar Stack */}
                      <div className="mt-6 pt-4 border-t border-slate-900/60 text-left">
                        <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2.5">
                          Thành viên Studio ({(studio.members || []).length})
                        </h4>
                        {(studio.members || []).length === 0 ? (
                          <p className="text-xs text-slate-600 italic font-mono">Studio này chưa có thành viên.</p>
                        ) : (
                          <div className="flex items-center -space-x-2.5 overflow-visible py-1">
                            {(studio.members || []).map((memName, i) => {
                              const avatarSeed = encodeURIComponent(memName);
                              const avatarSrc = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${avatarSeed}`;
                              const isMemOwner = memName === studio.ownerName;
                              
                              return (
                                <div 
                                  key={i} 
                                  className="group/avatar relative"
                                  style={{ zIndex: (studio.members || []).length - i }}
                                >
                                  <div className="relative">
                                    <img
                                      src={avatarSrc}
                                      alt={memName}
                                      className={`h-9 w-9 rounded-full bg-slate-950 object-cover ring-2 transition-all duration-200 group-hover/avatar:-translate-y-1 group-hover/avatar:ring-indigo-500 ${
                                        isMemOwner ? "ring-amber-500/80" : "ring-slate-800"
                                      }`}
                                    />
                                    {/* Small owner badge on their avatar */}
                                    {isMemOwner && (
                                      <span className="absolute -top-1 -right-0.5 bg-amber-500 text-slate-950 rounded-full p-0.5 scale-90 border border-slate-950 shadow">
                                        <Crown className="h-2 w-2" />
                                      </span>
                                    )}
                                  </div>

                                  {/* Tooltip name */}
                                  <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-[10px] font-medium text-slate-200 opacity-0 shadow-xl transition-all duration-200 group-hover/avatar:pointer-events-auto group-hover/avatar:opacity-100 flex items-center gap-1.5">
                                    <span className="truncate max-w-[100px]">{memName}</span>
                                    {isMemOwner && <span className="text-[9px] text-amber-400 font-bold font-mono">(Founder)</span>}
                                    {isOwner && memName !== currentUser?.displayName && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleKickMember(studio, memName);
                                        }}
                                        className="pointer-events-auto rounded bg-red-950/40 hover:bg-red-650 border border-red-900/30 hover:border-red-500 text-red-400 hover:text-white px-1.5 py-0.5 text-[9px] font-bold transition ml-1 cursor-pointer"
                                        title="Kick khỏi Studio"
                                      >
                                        Sút
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Game Jams Tab */}
                    {getStudioTab(studio.id) === "gamejam" && (
                      <div className="mt-4">
                        <GameJamTab
                          studio={studio}
                          currentUser={currentUser}
                          allUsers={users}
                        />
                      </div>
                    )}

                    {/* Join / Leave / Dissolve actionable buttons — only show on overview tab */}
                    {getStudioTab(studio.id) === "overview" && (
                    <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-900/40">
                      <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">THÀNH LẬP: {studio.createdAt ? new Date(studio.createdAt).toLocaleDateString() : "Chưa rõ"}</span>
                      
                      <div className="flex items-center gap-1.5">
                        {isOwner ? (
                          <button
                            type="button"
                            onClick={() => handleDissolveStudio(studio.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-550 text-rose-400 hover:text-white px-4 py-2 text-xs font-bold transition duration-200 active:scale-95 cursor-pointer shadow-sm shadow-rose-950/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Giải Tán Studio
                          </button>
                        ) : currentUser ? (
                          isMember ? (
                            <button
                              type="button"
                              onClick={() => handleLeaveStudio(studio)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/35 text-slate-400 hover:text-rose-400 px-4 py-2 text-xs font-bold transition duration-200 active:scale-95 cursor-pointer"
                            >
                              <LogOut className="h-3.5 w-3.5" />
                              Rời Studio
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleJoinStudio(studio)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-650 to-purple-650 hover:from-indigo-600 hover:to-purple-600 border border-indigo-500/20 px-4 py-2 text-xs font-black text-white transition duration-200 active:scale-95 cursor-pointer shadow-md shadow-indigo-950/30"
                            >
                              <Users className="h-3.5 w-3.5" />
                              Gia Nhập Studio
                            </button>
                          )
                        ) : null}
                      </div>
                    </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* Custom connection greeting modal */}
      {connectingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4 text-left">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-400" />
                Gửi lời mời kết nối đồng đội
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Hãy để lại một lời nhắn ngắn gọn (tối đa 200 ký tự) để tự giới thiệu bản thân và tăng cơ hội được chấp nhận kết nối!
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-2">
                Chọn mẫu nhanh theo vai trò
              </label>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <button
                  type="button"
                  onClick={() => setConnectionMessage("Chào bạn, mình là Dev. Rất ấn tượng với kỹ năng của bạn, hi vọng có cơ hội hợp tác code cùng nhau trong các dự án sắp tới!")}
                  className="rounded bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/30 px-2 py-1 text-[9.5px] text-slate-300 font-mono transition cursor-pointer"
                >
                  Lập trình viên
                </button>
                <button
                  type="button"
                  onClick={() => setConnectionMessage("Hi! Mình là Artist. Mình rất thích định hướng sản phẩm của bạn. Mong rằng chúng ta có thể kết nối để cùng vẽ nên những thế giới game tuyệt vời!")}
                  className="rounded bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/30 px-2 py-1 text-[9.5px] text-slate-300 font-mono transition cursor-pointer"
                >
                  Họa sĩ 2D/3D
                </button>
                <button
                  type="button"
                  onClick={() => setConnectionMessage("Chào đồng đội! Mình là Game Designer. Mình thấy các dự án của bạn có tiềm năng thiết kế rất lớn. Rất vui được kết nối để bàn sâu hơn về gameplay!")}
                  className="rounded bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/30 px-2 py-1 text-[9.5px] text-slate-300 font-mono transition cursor-pointer"
                >
                  Thiết kế game
                </button>
                <button
                  type="button"
                  onClick={() => setConnectionMessage("Chào bạn, mình là Sound Designer & Composer. Mình muốn kết nối để xem có thể thổi hồn âm nhạc và sound effect chất lượng cao vào dự án của bạn không.")}
                  className="rounded bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/30 px-2 py-1 text-[9.5px] text-slate-300 font-mono transition cursor-pointer"
                >
                  Âm thanh/Nhạc sĩ
                </button>
                <button
                  type="button"
                  onClick={() => setConnectionMessage("Chào bạn, mình rất muốn kết nối và học hỏi thêm từ kinh nghiệm làm game của bạn. Rất mong được làm đồng đội và chia sẻ đam mê!")}
                  className="rounded bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/30 px-2 py-1 text-[9.5px] text-slate-300 font-mono transition cursor-pointer"
                >
                  Chung chung
                </button>
              </div>

              <textarea
                rows={3}
                maxLength={200}
                placeholder="Viết lời nhắn của bạn ở đây... (Ví dụ: Mình rất muốn kết nối để cùng làm game!)"
                value={connectionMessage}
                onChange={(e) => setConnectionMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none placeholder-slate-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 px-1">
                <span>Tối đa 200 ký tự</span>
                <span>{connectionMessage.length}/200</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-900">
              <button
                type="button"
                onClick={() => {
                  setConnectingUserId(null);
                  setConnectionMessage("");
                }}
                className="rounded-lg border border-slate-850 px-3.5 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onSendConnectionRequest(connectingUserId || "", connectionMessage);
                  setConnectingUserId(null);
                  setConnectionMessage("");
                }}
                className="rounded-lg bg-indigo-650 px-4 py-1.5 text-xs font-black text-white hover:bg-indigo-600 cursor-pointer"
              >
                Gửi Lời Mời
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
