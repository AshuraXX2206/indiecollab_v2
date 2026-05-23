// ============================================================================
// seo.ts — Dynamic document title & meta description manager
// Updates <title> and <meta name="description"> as the user navigates tabs.
// Keeps crawlers and browser history accurate. No third-party deps.
// ============================================================================

const BASE_TITLE = "IndieCollab";
const BASE_DESCRIPTION =
  "IndieCollab kết nối indie game developers, pixel artists, sound designers và creators. Tìm đồng đội, đăng dự án, săn bug bounty và cùng nhau ship game.";

interface PageMeta {
  title: string;
  description: string;
}

// Per-tab metadata — shown in browser tab + search snippets
const TAB_META: Record<string, PageMeta> = {
  explore: {
    title: `Khám phá Dự Án — ${BASE_TITLE}`,
    description: "Duyệt các dự án game indie đang tìm đồng đội. Lọc theo engine, thể loại và hình thức cộng tác.",
  },
  partners: {
    title: `Tìm Đồng Đội — ${BASE_TITLE}`,
    description: "Tìm kiếm pixel artists, lập trình viên, sound designers và game designers cho dự án của bạn.",
  },
  bountymarket: {
    title: `Bug Bounty & Asset Hub — ${BASE_TITLE}`,
    description: "Săn bug có thưởng XP, mua bán sprite, sound effects, shader và các asset độc quyền.",
  },
  advisor: {
    title: `AI Pitch Advisor — ${BASE_TITLE}`,
    description: "Dùng AI để lên ý tưởng, viết pitch document và phát triển game concept của bạn.",
  },
  profile: {
    title: `Hồ Sơ — ${BASE_TITLE}`,
    description: "Xem và chỉnh sửa hồ sơ game developer. Showcase kỹ năng, tool và portfolio của bạn.",
  },
  landing: {
    title: `${BASE_TITLE} — Nền tảng cộng tác cho Indie Game Developers`,
    description: BASE_DESCRIPTION,
  },
};

/**
 * Sets document <title> and <meta name="description"> for the given tab.
 * Falls back to the landing page meta if tab not found.
 */
export function setPageMeta(tab: string): void {
  const meta = TAB_META[tab] ?? TAB_META["landing"];

  // Update document title
  document.title = meta.title;

  // Update <meta name="description">
  let descEl = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (descEl) {
    descEl.setAttribute("content", meta.description);
  }

  // Update Open Graph title + description for real-time social sharing
  const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", meta.title);

  const ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute("content", meta.description);

  // Update Twitter card
  const twTitle = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]');
  if (twTitle) twTitle.setAttribute("content", meta.title);

  const twDesc = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]');
  if (twDesc) twDesc.setAttribute("content", meta.description);
}

/**
 * Sets a fully custom title for profile/project detail pages.
 * e.g. setCustomPageTitle("@pixel_slayer", "Hồ sơ")
 */
export function setCustomPageTitle(name: string, section: string): void {
  document.title = `${name} — ${section} | ${BASE_TITLE}`;
}
