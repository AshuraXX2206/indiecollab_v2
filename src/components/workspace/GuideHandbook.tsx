import React, { useState } from "react";
import { 
  BookOpen, 
  Search, 
  GitBranch, 
  ShieldCheck, 
  Award, 
  PhoneCall, 
  Binary, 
  Compass, 
  ChevronDown, 
  HelpCircle,
  Clock,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { playClickSound, playHoverSound } from "../../utils/audio";

interface TutorialSection {
  id: string;
  category: "vận hành" | "kỹ thuật" | "phát triển";
  title: string;
  shortDesc: string;
  Icon: React.ComponentType<any>;
  content: string[];
  tips: string[];
}

const TUTORIAL_DATA: TutorialSection[] = [
  {
    id: "git-sync",
    category: "vận hành",
    title: "Chỉ nam Hợp tác Kho Mã Nguồn GitHub",
    shortDesc: "Cách lập branch, đẩy đẩy commits, kéo PR rà soát và gộp code hoàn toàn an toàn.",
    Icon: GitBranch,
    content: [
      "Quy trình xây nhánh nhánh (Branching standard): Luôn tạo nhánh con từ nhánh chính, ví dụ: 'feature/auth-page' hoặc 'bugfix/voice-glitch'. Hãy tránh chỉnh sửa hoặc đẩy commit trực tiếp lên nhánh 'main' để phòng trừ xung đột luồng.",
      "Kiểm rà mã nguồn (Pull Request review): Khi kéo PR, hãy gán tên người rà kiểm có liên quan trong thẻ. IndieCollab tích hợp rà quét tệp tự động giúp kiểm lỗi logic API trước khi sáp nhập.",
      "Đóng dấu an toàn (Secure Commits): Khi cam kết mã nguồn, ghi tắt mô tả đúng hành động (vd: 'commit: Sửa lỗi hiển thị avatar tab members'). Tránh gom quá nhiều file khác nhau vào chung một commit."
    ],
    tips: [
      "Đặt tần suất kéo code cập nhật (git pull origin main) trước mỗi buổi chiều làm việc để đón kịp các bản vá của đồng đội.",
      "Tuyệt đối không đẩy file chứa key cá nhân quý nhạy cảm như '.env' hay 'private-key.json' lên kho chứa công khai."
    ]
  },
  {
    id: "firebase-secure",
    category: "kỹ thuật",
    title: "Chính sách Bảo mật Dữ liệu Zero-Trust",
    shortDesc: "Cơ chế hoạt động của Firestore Security Rules để ngăn ngừa bị khai thác thông tin.",
    Icon: ShieldCheck,
    content: [
      "Bảo vệ hai chiều (Two-way authentication): Mọi truy xuất đọc/ghi dữ liệu của sảnh hay dự án đều đi qua bộ quy tắc an ninh nghiêm ngặt tại đám mây Firestore.",
      "Ràng buộc vai trò (Role-based access): Chỉ có những thành viên trong cùng một dự án mới có quyền lọc xem những thông điệp mật, xem kênh voice đàm thoại hay cột mốc lộ trình.",
      "Xác thực thời gian thực (Token Verification): Hệ thống sẽ đối chiếu chữ ký truy cập của tài khoản từng thành viên liên tục để phát hiện kịp thời các hành vi giả mạo, chèn mã độc hại hoặc decode web."
    ],
    tips: [
      "Mọi quy tắc chỉnh sửa rules đều được đồng bộ hóa nghiêm ngặt bằng file cấu hình trong dự án nên sẽ không xảy ra chuyện bị ghi đè thầm lặng.",
      "Nếu gặp lỗi 'Insufficient Permissions', hay kiểm tra tài khoản của mình đã thực sự nằm trong danh sách thành viên dự án đó chưa."
    ]
  },
  {
    id: "kanban-milestone",
    category: "vận hành",
    title: "Quản trị Đầu Việc Kanban & Sprint",
    shortDesc: "Vận dụng tối đa bảng Kanban để bám sát Sprint ngày và chặng hành trình dài.",
    Icon: Award,
    content: [
      "Gia hạn các cột mốc: Thiết lập đầy đủ ngày dứt hạn (Deadline) cho từng kế hoạch. Cột mốc sắp tới hạn sẽ tự động kích hoạt tông cảnh báo đỏ trên trang chủ của phòng sảnh.",
      "Lập phân công minh bạch: Gán công việc cụ thể cho từng thành viên chịu trách nhiệm. Sử dụng các trạng thái rõ ràng: Chuẩn bị (Todo) -> Đang chạy (In Progress) -> Đã xong (Done) để phòng ban khác không bị vướng mắc giao diện.",
      "Giới hạn khối lượng việc (WIP Limits): Đừng kích hoạt quá 3 đầu việc cùng lúc cho một người để tránh quá tải năng suất và loãng chất lượng kịch bản."
    ],
    tips: [
      "Lập thói quen cập nhật thanh trạng thái Kanban vào 15 phút đầu giờ sáng mỗi ngày để toàn đội dễ nắm bắt.",
      "Sử dụng phân loại ngắn hạn/dài hạn hợp lý để lọc bớt nhiễu khi tìm kiếm thông tin hành trình."
    ]
  },
  {
    id: "voice-presence",
    category: "vận hành",
    title: "Không gian Đàm thoại & Trực tuyến Nhóm",
    shortDesc: "Tối ưu hóa các buổi họp nhanh Scrum bằng kênh thoại và theo dõi vị trí đồng đội.",
    Icon: PhoneCall,
    content: [
      "Điểm danh trực tuyến (Teammates Presence): Hệ thống tự động đồng bộ tab làm việc của từng thành viên. Bạn dễ dàng nhìn thấy ai đang duyệt mã nguồn, ai đang soạn tài nguyên hay đang bận vẽ UI.",
      "Gọi voice không dây (Lounge Communication): Vào tab Kênh Trực Tuyến để tham gia phòng Voice không chậm trễ. Hệ thống hiển thị micro nhấp nháy động theo âm giọng nói thực.",
      "Mute & Tách âm (Privacy Controls): Hãy sử dụng cơ chế bật tắt âm lượng và mic linh hoạt khi cần trao đổi công độc lập hoặc tránh tiếng ồn gây ảnh hưởng sảnh đàm thoại."
    ],
    tips: [
      "Rê chuẩn chuột lên chấm tròn trạng thái để xem chi tiết vị trí đồng chí mình đang hỗ trợ thiết lập bên trong dự án.",
      "Hãy sử dụng tai nghe chuyên dụng để ngăn chặn tiếng vọng lặp (Echo Feedback Loop) trong các cuộc họp đông thành viên."
    ]
  },
  {
    id: "sandbox-compiler",
    category: "kỹ thuật",
    title: "Làm chủ Trình Biên Dịch Sandbox Thử Nghiệm",
    shortDesc: "Cách mượn dải tham số vật lý để kiểm tra tính nguyên vẹn của kịch bản lập trình.",
    Icon: Binary,
    content: [
      "Hạn chế rủi ro cho engine (Safe Sandbox environment): Thử nghiệm trực tiếp các thông số như độ lướt, trọng lực hành tinh và tỷ lệ giáp thủ để quan sát hành vi sườn đồi ngay tại trình duyệt.",
      "Cắt giảm lỗi nén RAM (Memory leaks control): Bản biên dịch ghi lô báo lỗi trực quan (Dynamic warnings). Ví dụ đặt sai hố đen trọng lực lớn hư cấu sẽ bị dập tắt biên dịch từ đầu.",
      "Hợp nhất tài nguyên (Integration channel): Kết xuất file bản nháp kịch bản chuẩn trực tiếp sang tài liệu của nhóm để toàn bộ kỹ sư thiết kế đều có thể nạp về thiết bị dùng."
    ],
    tips: [
      "Nếu kịch bản bị báo lỗi cấu trúc, xem kỹ dải trị giới hạn hiển thị ngay dưới biến trượt điều chỉnh.",
      "Tận dụng kịch bản C# hoặc GDScript mẫu để làm sườn phát triển nhanh dải tính năng di chuyển cốt lõi."
    ]
  },
  {
    id: "ui-safezones",
    category: "phát triển",
    title: "Tối Ưu Hoá Bố Cục UI/UX & Sprite Atlas",
    shortDesc: "Bảo toàn vùng an toàn cho game di động và gom lưới ảnh động để tăng khung hình FPS.",
    Icon: Compass,
    content: [
      "Chọn kịch bản khung hình phù hợp (Aspect ratios): Thử xoay chuyển bố cục sang khung máy dọc của Mobile để bảo đảm thanh trạng thái HP không bị đè vào rãnh camera hay tai thỏ.",
      "Tạo lập tấm bản đồ ảnh (Sprite atlas design): Định cấu trúc lưới ảnh rộng bao gồm nhiều khung chuyển động giúp thiết bị tải game mượt hơn và hạn chế đĩa nén nạp liên tục.",
      "Quy ước lũy thừa số mũ (Power of 2): Thiết lập kích cỡ ảnh theo tiêu chuẩn lũy thừa của 2 giúp tối ưu hóa nén phần cứng nhanh chóng trên mọi nền tảng di động."
    ],
    tips: [
      "Luôn để dải lưới viền (Padding) tối thiểu 2px xung quanh các ô chuyển động Sprite để tránh nhiễu dải sắc màu.",
      "Chọn phong cách tương ứng như Cyber Sci-Fi hay Green CRT để đồng điệu tông sảnh chơi."
    ]
  }
];

export default function GuideHandbook() {
  const [activeCategory, setActiveCategory] = useState<"all" | "vận hành" | "kỹ thuật" | "phát triển">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>("git-sync");

  const toggleAccordion = (id: string) => {
    playClickSound();
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  // Filter systems
  const filteredSections = TUTORIAL_DATA.filter((section) => {
    const matchesCat = activeCategory === "all" || section.category === activeCategory;
    const matchesSearch = section.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          section.shortDesc.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* ── INTERACTIVE TITLE WITH INTRO DUCTION ── */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/15 bg-gradient-to-br from-indigo-950/20 via-slate-900 to-slate-950 p-6 sm:p-7 text-left">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.02] rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono border border-indigo-500/20">Cổng Học Tập & Vận Hành Quy Chuẩn</span>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Sổ Tay Khởi Nghiệp Game & Hợp Tác Sảnh</h2>
            <p className="mt-1.5 text-xs text-slate-400 max-w-xl leading-relaxed">
              Chào mừng bạn đến với Cổng chỉ nam của IndieCollab! Nơi tụ họp toàn bộ giáo khoa thực chiến, quy ước đóng gói mã nguồn, chính sách bảo toàn thông số vật lý và mẹo tối ưu hóa đồ họa tăng FPS game.
            </p>
          </div>
          <div className="bg-[#09090b]/60 p-3 rounded-2xl border border-white/[0.04] text-center font-mono space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Thư viện bài học</span>
            <strong className="text-xl text-white block">{TUTORIAL_DATA.length} Giáo trình</strong>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER RAILS ── */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between text-left">
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Tất cả giáo khoa" },
            { id: "vận hành", label: "Sảnh vận hành" },
            { id: "kỹ thuật", label: "Kiến trúc kỹ thuật" },
            { id: "phát triển", label: "Thiết kế phát triển" }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => { playClickSound(); setActiveCategory(cat.id as any); }}
              className={`px-3.5 py-1.8 text-xs font-bold rounded-xl border select-none cursor-pointer shrink-0 transition ${
                activeCategory === cat.id 
                  ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-300" 
                  : "bg-white/[0.01] border-white/[0.03] text-slate-500 hover:text-slate-330"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="relative w-full sm:w-[260px] shrink-0">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-650" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tiêu chuẩn, từ khóa..."
            className="w-full pl-9 pr-4 py-2 bg-[#09090b]/80 border border-white/[0.05] rounded-xl text-xs text-white outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      {/* ── MAIN ACCORDIONS HUD ACCLAIMED ── */}
      <div className="space-y-4 text-left">
        {filteredSections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500 space-y-2">
            <BookOpen className="h-8 w-8 mx-auto text-slate-700 animate-pulse" />
            <p className="text-xs">Không tìm thấy bản giáo trình nào tương thích với bộ lọc.</p>
          </div>
        ) : (
          filteredSections.map((section) => {
            const isExpanded = expandedId === section.id;
            return (
              <div 
                key={section.id} 
                className={`rounded-2xl border transition duration-200 overflow-hidden ${
                  isExpanded 
                    ? "bg-[#09090b]/80 border-indigo-550/30 shadow-[0_4px_24px_rgba(79,70,229,0.02)]" 
                    : "bg-[#09090b]/40 border-white/[0.03] hover:border-white/[0.07] hover:bg-[#09090b]/60"
                }`}
              >
                
                {/* Accordion header click triggers toggle */}
                <div
                  onClick={() => toggleAccordion(section.id)}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl border shrink-0 transition-colors duration-200 ${
                      isExpanded 
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" 
                        : "bg-slate-950 border-white/[0.04] text-slate-450"
                    }`}>
                      <section.Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs font-black text-white font-sans tracking-wide sm:text-sm">
                          {section.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider border ${
                          section.category === "kỹ thuật" 
                            ? "bg-indigo-500/5 text-indigo-450 border-indigo-500/10" 
                            : section.category === "vận hành" 
                            ? "bg-teal-500/5 text-teal-450 border-teal-500/10" 
                            : "bg-cyan-500/5 text-cyan-405 border-cyan-500/10"
                        }`}>
                          {section.category}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-slate-500 line-clamp-1">{section.shortDesc}</p>
                    </div>
                  </div>

                  <button className="text-slate-500 hover:text-white transition cursor-pointer">
                    <ChevronDown className={`h-4.5 w-4.5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {/* Expanded content details */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-white/[0.03] bg-black/40"
                    >
                      <div className="p-5 sm:p-6 space-y-5 text-slate-350 text-xs">
                        
                        {/* Nested bullets list */}
                        <div className="space-y-4 pl-1 sm:pl-4 border-l-2 border-indigo-500/20">
                          {section.content.map((p, idx) => {
                            const [pTitle, pBody] = p.split(": ");
                            return (
                              <div key={idx} className="space-y-1">
                                <strong className="text-white font-sans text-[12.5px] block">{pTitle}</strong>
                                <p className="leading-relaxed leading-normal">{pBody}</p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Interactive tips list nested beautifully */}
                        <div className="bg-slate-950/80 p-4 border border-white/[0.04] rounded-xl space-y-2.5">
                          <span className="text-[10px] font-mono text-indigo-400 font-extrabold block uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4" /> BÍ QUYẾT BẤT BẠI CỦA DEV QUÂN (PRO-TIPS):
                          </span>
                          
                          <div className="space-y-2">
                            {section.tips.map((tip, i) => (
                              <div key={i} className="flex gap-2 items-start">
                                <span className="text-indigo-400 select-none">⚡</span>
                                <p className="leading-relaxed leading-normal text-[11px] text-slate-400">{tip}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })
        )}
      </div>

      {/* ── BOTTOM FAQ FOOTER DETAILS ── */}
      <div className="rounded-2xl border border-white/[0.03] bg-[#09090b]/60 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
        <div className="flex gap-3 items-center">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
            <HelpCircle className="h-4.5 w-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Bị kẹt hóc vấn đề kỹ thuật khác?</h4>
            <p className="text-[11px] text-slate-550">Khai thác sảnh chat phòng thảo luận thời gian thực hoặc tag trực tiếp trưởng nhóm của bạn!</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <span className="text-[9.5px] font-mono text-slate-705">Cập nhật lúc: 2026-05-23 BST</span>
        </div>
      </div>

    </div>
  );
}
