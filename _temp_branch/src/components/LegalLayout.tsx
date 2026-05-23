import React, { useState, useEffect } from "react";
import { ArrowLeft, Printer, FileText, ChevronDown } from "lucide-react";
import { termsData } from "../content/terms";

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  introduction: string;
  warning?: string;
  sections: Array<{
    id: string;
    title: string;
    content: string | string[];
  }>;
  onBackHome: () => void;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({
  title,
  subtitle,
  lastUpdated,
  introduction,
  warning,
  sections,
  onBackHome,
}) => {
  const [activeSection, setActiveSection] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Monitor scroll to update active Table of Contents section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 120;
      let current = "";

      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top) {
            current = section.id;
          }
        }
      }

      if (current) {
        setActiveSection(current);
      } else if (sections.length > 0) {
        setActiveSection(sections[0].id);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial run

    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.offsetTop - 90;
      window.scrollTo({
        top,
        behavior: "smooth",
      });
      setActiveSection(id);
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200 antialiased">
      {/* Printable Area Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-content {
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          a {
            color: black !important;
            text-decoration: underline !important;
          }
        }
      `}</style>

      {/* Sticky Navigation Header */}
      <header className="no-print sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackHome}
              className="group flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 p-2 text-slate-400 transition hover:border-slate-700 hover:text-slate-200 cursor-pointer"
              title="Quay lại trang chủ"
            >
              <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block rounded-md bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                IndieCollab Legal
              </span>
              <span className="text-sm font-medium text-slate-400">/ Trung tâm pháp lý</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-700 hover:bg-slate-900 hover:text-slate-100 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>In tài liệu</span>
            </button>
            <button
              onClick={onBackHome}
              className="hidden sm:flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              Quay lại Trang Chủ
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header Block */}
        <div className="mb-12 border-b border-slate-900 pb-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3">
            <FileText className="h-4 w-4" />
            <span>Tài liệu pháp lý chính thức</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-3xl">
            {subtitle}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span>Cập nhật lần cuối: <strong className="text-slate-300">{lastUpdated}</strong></span>
            <span className="hidden sm:inline">•</span>
            <span>Phạm vi tài phán chính: <strong className="text-slate-300">Việt Nam</strong></span>
          </div>
        </div>

        {/* Warning Callout Box */}
        {warning && (
          <div className="mb-10 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-amber-300/90 leading-relaxed shadow-sm flex gap-3.5 max-w-4xl">
            <span className="text-xl select-none">⚠️</span>
            <div>
              <strong className="text-amber-200 block mb-1">Khuyến cáo pháp lý quan trọng:</strong>
              {warning}
            </div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-start">
          {/* Mobile TOC Selector (Sticky Dropdown) */}
          <div className="no-print sticky top-[73px] z-30 mb-8 block lg:hidden w-full">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 shadow-md cursor-pointer"
            >
              <span>
                {sections.find((s) => s.id === activeSection)?.title || "Mục lục điều khoản"}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${mobileMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileMenuOpen && (
              <div className="absolute mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 py-2 shadow-xl ring-1 ring-black/5">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`block w-full px-4 py-2.5 text-left text-xs font-medium transition cursor-pointer ${
                      activeSection === section.id
                        ? "bg-indigo-600/10 text-indigo-400 font-semibold"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Table of Contents Sidebar (Sticky) */}
          <aside className="no-print sticky top-[95px] hidden lg:block lg:col-span-4 max-h-[calc(100vh-140px)] overflow-y-auto pr-4">
            <div className="border-l border-slate-900 pl-4 py-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 px-2">
                Mục lục điều khoản
              </h2>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`group block w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition cursor-pointer ${
                      activeSection === section.id
                        ? "bg-indigo-600/10 text-indigo-400 font-semibold border-l-2 border-indigo-500 -ml-[18px] pl-[16px]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Legal Content Block */}
          <div className="print-content lg:col-span-8 space-y-12 text-slate-300 leading-relaxed font-sans max-w-4xl text-[15px] sm:text-base">
            <div className="text-slate-400 italic mb-8 border-l-4 border-slate-800 pl-4 py-1">
              {introduction}
            </div>

            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 border-b border-slate-950 pb-8 last:border-b-0"
              >
                <h3 className="group flex items-center text-lg font-bold text-white mb-4 tracking-tight">
                  <a
                    href={`#${section.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(section.id);
                    }}
                    className="hover:text-indigo-400 flex items-center gap-2"
                  >
                    {section.title}
                    <span className="opacity-0 group-hover:opacity-100 text-indigo-400 text-sm transition-opacity duration-150">
                      #
                    </span>
                  </a>
                </h3>

                <div className="space-y-4">
                  {Array.isArray(section.content) ? (
                    section.content.map((paragraph, index) => {
                      if (paragraph.startsWith("-")) {
                        return (
                          <ul key={index} className="list-disc list-inside pl-4 space-y-2 mt-2 text-slate-350">
                            <li>{paragraph.substring(1).trim()}</li>
                          </ul>
                        );
                      }
                      return (
                        <p key={index} className="text-slate-300">
                          {paragraph}
                        </p>
                      );
                    })
                  ) : (
                    <p className="text-slate-300">{section.content}</p>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      <footer className="no-print mt-24 border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>© 2026 IndieCollab Vietnam. Bảo lưu mọi quyền.</p>
        <p className="mt-2 text-slate-600">
          Chương trình cộng đồng kết nối Indie Game Developers.
        </p>
      </footer>
    </div>
  );
};

export const TermsPage: React.FC<{ onBackHome: () => void }> = ({ onBackHome }) => {
  return (
    <LegalLayout
      title={termsData.title}
      subtitle={termsData.subtitle}
      lastUpdated={termsData.lastUpdated}
      introduction={termsData.introduction}
      warning={termsData.warning}
      sections={termsData.sections}
      onBackHome={onBackHome}
    />
  );
};

export const PrivacyPage: React.FC<{ onBackHome: () => void }> = ({ onBackHome }) => {
  return (
    <LegalLayout
      title="Chính Sách Quyền Riêng Tư"
      subtitle="Áp dụng cho IndieCollab — chính sách thu thập và bảo mật thông tin gamedev Việt Nam"
      lastUpdated="22/05/2026"
      introduction="Chính sách quyền riêng tư này mô tả cách chúng tôi thu thập, xử lý và bảo vệ dữ liệu cá nhân của người dùng tại Việt Nam khi tham gia IndieCollab. Chúng tôi cam kết tuyệt đối bảo vệ sự riêng tư của bạn phù hợp với Nghị định về bảo vệ dữ liệu cá nhân."
      sections={[
        {
          id: "intro",
          title: "1. Tổng quan",
          content: [
            "Chúng tôi xem trọng quyền riêng tư của bạn. Chính sách này áp dụng cho toàn bộ người dùng đăng ký hoặc truy cập IndieCollab tại thị trường Việt Nam.",
            "Bằng việc đăng ký tài khoản, bạn đồng ý cho phép thu thập và xử lý các thông tin cá nhân cần thiết để vận hành và bảo vệ dịch vụ."
          ]
        },
        {
          id: "data-collection",
          title: "2. Loại dữ liệu thu thập",
          content: [
            "Các thông tin bạn cung cấp trực tiếp:",
            "- Họ và tên hoặc tên hiển thị (Username);",
            "- Địa chỉ email (được dùng làm thông tin đăng nhập và liên hệ);",
            "- Liên kết danh mục portfolio cá nhân hoặc dự án;",
            "- Thông tin giới thiệu (Bio), kỹ năng phát triển game, công cụ sử dụng.",
            "Các thông tin hệ thống tự động ghi nhận phục vụ an toàn kỹ thuật:",
            "- Địa chỉ IP truy cập;",
            "- Loại trình duyệt và hệ điều hành thiết bị;",
            "- Nhật ký lịch sử đăng nhập và hành động tương tác chính trên hệ thống."
          ]
        },
        {
          id: "data-usage",
          title: "3. Mục đích sử dụng dữ liệu",
          content: [
            "Chúng tôi chỉ sử dụng dữ liệu cá nhân của bạn cho các hoạt động hợp pháp bao gồm:",
            "- Hiển thị hồ sơ cá nhân và kết nối bạn với các nhà phát triển game khác;",
            "- Gửi thông báo hệ thống về các dự án hợp tác, lời mời gia nhập studio hoặc tin nhắn mới;",
            "- Chống hành vi phá hoại bảo mật, spam, cheat hoặc tạo tài khoản giả mạo;",
            "- Cung cấp thông tin theo yêu cầu của cơ quan pháp luật có thẩm quyền tại Việt Nam khi có văn bản yêu cầu chính thức."
          ]
        },
        {
          id: "data-rights",
          title: "4. Quyền của bạn đối với dữ liệu",
          content: [
            "Bạn có toàn quyền kiểm soát dữ liệu cá nhân của mình, bao gồm:",
            "- Xem và chỉnh sửa thông tin cá nhân trực tiếp từ giao diện cài đặt tài khoản;",
            "- Yêu cầu khóa hoặc xóa bỏ tài khoản vĩnh viễn kèm theo toàn bộ dữ liệu lưu trữ trực tiếp của tài khoản đó khỏi hệ thống."
          ]
        },
        {
          id: "contact",
          title: "5. Thông tin liên hệ",
          content: [
            "Mọi yêu cầu hỗ trợ hoặc giải đáp về quyền riêng tư, vui lòng gửi về email: support@indiecollab.onrender.com."
          ]
        }
      ]}
      onBackHome={onBackHome}
    />
  );
};
