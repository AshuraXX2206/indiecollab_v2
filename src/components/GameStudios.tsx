import React, { useState } from "react";
import GameJamTab from "./GameJamTab";
import { User, GameStudio } from "../types";
import { Sparkles, Users, Plus, Trash2, Crown, LogOut, FolderOpen } from "lucide-react";

interface GameStudiosProps {
  users: User[];
  studios: GameStudio[];
  currentUser: User | null;
  onCreateStudio: (studioPayload: Omit<GameStudio, "id" | "ownerId" | "ownerName" | "createdAt">) => void;
  onUpdateStudio: (studioId: string, updatedPayload: Partial<GameStudio>) => void;
  onDeleteStudio: (studioId: string) => void;
  onRequestJoinStudio: (studioId: string, message?: string) => void;
}

export default function GameStudios({
  users,
  studios,
  currentUser,
  onCreateStudio,
  onUpdateStudio,
  onDeleteStudio,
  onRequestJoinStudio
}: GameStudiosProps) {
  const [studioActiveTabs, setStudioActiveTabs] = useState<Record<string, "overview" | "gamejam">>({});
  const [showCreateStudioForm, setShowCreateStudioForm] = useState(false);
  const [studioFormName, setStudioFormName] = useState("");
  const [studioFormAvatar, setStudioFormAvatar] = useState("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150");
  const [studioFormDesc, setStudioFormDesc] = useState("");
  const canCreateStudio = !!currentUser
    && currentUser.profileComplete === true
    && currentUser.isGuest !== true
    && (currentUser.skills || []).length > 0
    && (currentUser.tools || []).length > 0
    && !!currentUser.bio?.trim()
    && !!currentUser.howToReachMe?.trim();

  const getStudioTab = (id: string) => studioActiveTabs[id] ?? "overview";
  const setStudioTab = (id: string, tab: "overview" | "gamejam") =>
    setStudioActiveTabs(prev => ({ ...prev, [id]: tab }));

  const handleCreateStudioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateStudio) {
      alert("Bạn cần hoàn thiện hồ sơ thật đầy đủ và dùng tài khoản chính thức để lập Studio.");
      return;
    }
    if (!studioFormName || !studioFormDesc) {
      alert("Vui lòng điền đầy đủ thông tin để lập studio!");
      return;
    }
    onCreateStudio({
      name: studioFormName,
      avatarUrl: studioFormAvatar,
      description: studioFormDesc,
      members: currentUser ? [currentUser.displayName] : [],
      memberIds: currentUser ? [currentUser.id] : []
    });
    setStudioFormName("");
    setStudioFormDesc("");
    setShowCreateStudioForm(false);
  };

  const handleJoinStudio = (studio: GameStudio) => {
    if (!currentUser) return;
    if (studio.memberIds?.includes(currentUser.id) || studio.members.includes(currentUser.displayName)) return;
    onRequestJoinStudio(studio.id);
  };

  const handleLeaveStudio = (studio: GameStudio) => {
    if (!currentUser) return;
    const currentMemberIds = studio.memberIds || studio.members.map((_, index) =>
      index === 0 && studio.ownerId ? studio.ownerId : ""
    );
    const leaveIndex = currentMemberIds.findIndex(id => id === currentUser.id);
    const fallbackIndex = studio.members.findIndex(name => name === currentUser.displayName);
    const indexToRemove = leaveIndex >= 0 ? leaveIndex : fallbackIndex;
    if (indexToRemove < 0 || studio.ownerId === currentUser.id) return;

    onUpdateStudio(studio.id, {
      members: studio.members.filter((_, index) => index !== indexToRemove),
      memberIds: currentMemberIds.filter((_, index) => index !== indexToRemove).filter(Boolean)
    });
  };

  const handleKickMember = (studio: GameStudio, memberName: string) => {
    const indexToRemove = studio.members.findIndex(m => m === memberName);
    if (indexToRemove < 0) return;
    const currentMemberIds = studio.memberIds || [];
    onUpdateStudio(studio.id, {
      members: studio.members.filter((_, index) => index !== indexToRemove),
      memberIds: currentMemberIds.filter((_, index) => index !== indexToRemove)
    });
  };

  const handleDissolveStudio = (studioId: string) => {
    if (confirm("Bạn có chắc muốn giải tán Game Studio này vĩnh viễn không? Hành động này không thể hoàn tác.")) {
      onDeleteStudio(studioId);
    }
  };

  return (
    <div className="mt-8 space-y-8 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row items-center justify-between border border-slate-800 bg-slate-950 p-6 rounded-2xl gap-4">
        <div>
          <h2 className="text-sm font-black text-white flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-pink-400" />
            Thành Lập Game Studio Của Riêng Bạn
          </h2>
          <p className="text-xs text-slate-400 mt-1">Khởi tạo nhóm phát triển game chuyên nghiệp dài hạn, cùng hợp tác xây dựng thương hiệu và phát hành sản phẩm.</p>
        </div>
        {currentUser ? (
          <button
            type="button"
            onClick={() => canCreateStudio && setShowCreateStudioForm(true)}
            disabled={!canCreateStudio}
            className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 border border-pink-500/25 px-5 py-2.5 text-xs font-black text-white hover:opacity-90 active:scale-95 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-45"
          >
            + Lập Studio Mới
          </button>
        ) : (
          <span className="text-xs text-rose-400 font-mono">Hãy đăng nhập để thiết lập Studio của riêng bạn</span>
        )}
      </div>
      {currentUser && !canCreateStudio && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-100">
          Tạo Studio đang được siết quyền: tài khoản khách hoặc hồ sơ chưa đủ kỹ năng, công cụ, bio và liên hệ sẽ không thể lập Studio để tránh spam. Hãy hoàn thiện hồ sơ và dùng tài khoản chính thức trước khi tạo Studio.
        </div>
      )}

      {showCreateStudioForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 backdrop-blur-sm">
          <form onSubmit={handleCreateStudioSubmit} className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
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
              <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest">Ảnh đại diện Studio (Avatar URL)</label>
              <input
                type="text"
                required
                value={studioFormAvatar}
                onChange={(e) => setStudioFormAvatar(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest">Mô tả Studio / Tuyên ngôn sản phẩm</label>
              <textarea
                rows={3}
                required
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
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-black text-white hover:bg-indigo-500">
                Kích Hoạt Studio
              </button>
            </div>
          </form>
        </div>
      )}

      {(!studios || studios.length === 0) ? (
        <div className="text-center py-16 border border-slate-850 bg-slate-950/20 rounded-2xl text-slate-500 text-xs font-mono">
          Chưa có nhóm nào được lập. Hãy đặt nền móng và lập studio đầu tiên của bạn!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {studios.map((studio) => {
            const isOwner = currentUser && studio.ownerId === currentUser.id;
            const isMember = currentUser && (
              (studio.memberIds || []).includes(currentUser.id) ||
              (studio.members || []).includes(currentUser.displayName)
            );

            return (
              <div key={studio.id} className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-md p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/35 hover:bg-slate-900/50 flex flex-col justify-between group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent group-hover:via-indigo-500/40 transition-all duration-500" />

                <div>
                  <div className="flex items-start gap-4">
                    <img src={studio.avatarUrl} alt={studio.name || "Studio"} className="h-14 w-14 rounded-xl object-cover ring-2 ring-indigo-500/10 shrink-0" />
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
                        {tab === "overview" ? "Tổng quan" : "Game Jams"}
                      </button>
                    ))}
                  </div>

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
                            <div key={`${memName}-${i}`} className="group/avatar relative" style={{ zIndex: (studio.members || []).length - i }}>
                              <div className="relative">
                                <img
                                  src={avatarSrc}
                                  alt={memName}
                                  className={`h-9 w-9 rounded-full bg-slate-950 object-cover ring-2 transition-all duration-200 group-hover/avatar:-translate-y-1 group-hover/avatar:ring-indigo-500 ${
                                    isMemOwner ? "ring-amber-500/80" : "ring-slate-800"
                                  }`}
                                />
                                {isMemOwner && (
                                  <span className="absolute -top-1 -right-0.5 bg-amber-500 text-slate-950 rounded-full p-0.5 scale-90 border border-slate-950 shadow">
                                    <Crown className="h-2 w-2" />
                                  </span>
                                )}
                              </div>

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
                                    className="pointer-events-auto rounded bg-red-950/40 hover:bg-red-600 border border-red-900/30 hover:border-red-500 text-red-400 hover:text-white px-1.5 py-0.5 text-[9px] font-bold transition ml-1 cursor-pointer"
                                    title="Loại khỏi Studio"
                                  >
                                    Loại
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

                {getStudioTab(studio.id) === "gamejam" && (
                  <div className="mt-4">
                    <GameJamTab studio={studio} currentUser={currentUser} allUsers={users} />
                  </div>
                )}

                {getStudioTab(studio.id) === "overview" && (
                  <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-900/40">
                    <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">THÀNH LẬP: {studio.createdAt ? new Date(studio.createdAt).toLocaleDateString() : "Chưa rõ"}</span>

                    <div className="flex items-center gap-1.5">
                      {isOwner ? (
                        <button
                          type="button"
                          onClick={() => handleDissolveStudio(studio.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white px-4 py-2 text-xs font-bold transition duration-200 active:scale-95 cursor-pointer shadow-sm shadow-rose-950/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Giải Tán Studio
                        </button>
                      ) : currentUser ? (
                        isMember ? (
                          <button
                            type="button"
                            onClick={() => handleLeaveStudio(studio)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/35 text-slate-400 hover:text-rose-400 px-4 py-2 text-xs font-bold transition duration-200 active:scale-95 cursor-pointer"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            Rời Studio
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleJoinStudio(studio)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border border-indigo-500/20 px-4 py-2 text-xs font-black text-white transition duration-200 active:scale-95 cursor-pointer shadow-md shadow-indigo-950/30"
                          >
                            <Users className="h-3.5 w-3.5" />
                            Gửi Yêu Cầu Gia Nhập
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
  );
}
