export interface LegalSection {
  id: string;
  title: string;
  content: string | string[];
}

export const CURRENT_TERMS_VERSION = "VN-2026-05-22";
export const CURRENT_PRIVACY_VERSION = "VN-2026-05-22";

export const termsData = {
  title: "Điều Khoản Dịch Vụ",
  subtitle: "Áp dụng cho IndieCollab — nền tảng cộng tác cho Indie Game Developers",
  lastUpdated: "22/05/2026",
  introduction: "Chào mừng bạn đến với IndieCollab — nền tảng cộng tác dành cho Indie Game Developers. Khi truy cập hoặc sử dụng website, bạn đồng ý tuân thủ các điều khoản dưới đây.",
  warning: "Tài liệu này là điều khoản vận hành nền tảng và không thay thế tư vấn pháp lý chuyên nghiệp. Khi mở rộng quy mô, thương mại hóa hoặc xử lý dữ liệu lớn, IndieCollab nên tham khảo ý kiến luật sư tại Việt Nam.",
  sections: [
    {
      id: "platform-purpose",
      title: "1. Mục đích nền tảng",
      content: [
        "IndieCollab cung cấp môi trường để các indie game developers, artists, designers, writers, composers và cộng tác viên khác kết nối, tìm kiếm dự án, chia sẻ hồ sơ và hợp tác phát triển game.",
        "IndieCollab không phải là bên tuyển dụng, nhà đầu tư, đại diện pháp lý hoặc bên trung gian bảo đảm cho mọi thỏa thuận giữa người dùng."
      ]
    },
    {
      id: "user-accounts",
      title: "2. Tài khoản người dùng",
      content: [
        "Người dùng chịu trách nhiệm bảo mật tài khoản, mật khẩu và mọi hoạt động phát sinh từ tài khoản của mình.",
        "Bạn không được phép:",
        "- Sử dụng thông tin giả mạo;",
        "- Mạo danh cá nhân, studio hoặc tổ chức khác;",
        "- Tạo nhiều tài khoản để spam hoặc lạm dụng hệ thống;",
        "- Chia sẻ tài khoản cho người khác sử dụng trái phép.",
        "IndieCollab có quyền tạm khóa hoặc xóa tài khoản nếu phát hiện hành vi vi phạm."
      ]
    },
    {
      id: "accepted-behavior",
      title: "3. Hành vi được chấp nhận",
      content: [
        "Người dùng cần tương tác với tinh thần tôn trọng, minh bạch và hợp tác.",
        "Bạn được phép:",
        "- Đăng hồ sơ cá nhân hoặc studio;",
        "- Giới thiệu kỹ năng, dự án game, portfolio;",
        "- Tìm kiếm cộng tác viên;",
        "- Trao đổi ý tưởng và cơ hội hợp tác;",
        "- Tham gia dự án theo thỏa thuận tự nguyện giữa các bên."
      ]
    },
    {
      id: "prohibited-behavior",
      title: "4. Hành vi bị cấm",
      content: [
        "Người dùng không được thực hiện các hành vi sau:",
        "- Spam tin nhắn, bình luận hoặc lời mời cộng tác;",
        "- Quấy rối, xúc phạm, đe dọa hoặc công kích người khác;",
        "- Đăng nội dung lừa đảo, giả mạo hoặc gây hiểu nhầm;",
        "- Phát tán malware, virus, script độc hại hoặc link phishing;",
        "- Khai thác lỗi bảo mật, tấn công hệ thống hoặc vượt quyền truy cập;",
        "- Thu thập dữ liệu người dùng trái phép;",
        "- Đăng nội dung vi phạm pháp luật, bản quyền hoặc quyền riêng tư của bên thứ ba;",
        "- Sử dụng bot hoặc automation gây ảnh hưởng đến hiệu năng hoặc an toàn hệ thống;",
        "- Lợi dụng nền tảng để lừa đảo tuyển dụng, cộng tác hoặc chia sẻ doanh thu."
      ]
    },
    {
      id: "user-content",
      title: "5. Nội dung người dùng",
      content: [
        "Người dùng giữ quyền sở hữu đối với nội dung mình đăng tải, bao gồm hồ sơ, mô tả dự án, hình ảnh, link portfolio và thông tin liên quan.",
        "Khi đăng nội dung lên IndieCollab, bạn cho phép chúng tôi lưu trữ, hiển thị và xử lý nội dung đó nhằm mục đích vận hành và quảng bá nền tảng hợp lý.",
        "Bạn cam kết rằng nội dung bạn đăng:",
        "- Thuộc quyền sở hữu của bạn hoặc bạn có quyền sử dụng hợp pháp;",
        "- Không vi phạm bản quyền, nhãn hiệu hoặc quyền riêng tư của bất kỳ bên thứ ba nào;",
        "- Không chứa nội dung độc hại, xúc phạm hoặc bất hợp pháp.",
        "IndieCollab có quyền ẩn hoặc xóa nội dung vi phạm mà không cần báo trước."
      ]
    },
    {
      id: "intellectual-property",
      title: "6. Quyền sở hữu trí tuệ giữa người dùng",
      content: [
        "IndieCollab không sở hữu ý tưởng, source code, asset, concept art, âm thanh, kịch bản hoặc tài liệu dự án do người dùng trao đổi riêng với nhau.",
        "Các bên tham gia cộng tác cần tự thỏa thuận rõ ràng và tự chịu trách nhiệm về các vấn đề sau:",
        "- Quyền sở hữu source code;",
        "- Quyền sở hữu asset (hình ảnh, âm thanh, 3D model, v.v.);",
        "- Phương án chia sẻ doanh thu (revenue share);",
        "- Ghi nhận đóng góp (credit) trong sản phẩm game;",
        "- Quyền phát hành và phân phối game;",
        "- Quyền tiếp tục phát triển hoặc sử dụng sản phẩm nếu dự án dừng lại.",
        "IndieCollab không chịu trách nhiệm giải quyết tranh chấp sở hữu trí tuệ giữa người dùng, nhưng có thể hỗ trợ xử lý báo cáo vi phạm bản quyền trên nền tảng (ví dụ: gỡ bỏ nội dung vi phạm hiển thị công khai)."
      ]
    },
    {
      id: "collaboration-responsibility",
      title: "7. Trách nhiệm khi cộng tác",
      content: [
        "Mọi thỏa thuận hợp tác giữa các người dùng là trách nhiệm riêng của các bên liên quan.",
        "IndieCollab không đảm bảo rằng:",
        "- Một người dùng bất kỳ trên nền tảng là đáng tin cậy;",
        "- Một dự án được đăng tuyển chắc chắn sẽ hoàn thành;",
        "- Doanh thu sẽ được phân chia đúng cam kết giữa các bên;",
        "- Kỹ năng hoặc thông tin hiển thị trên hồ sơ của người dùng là hoàn toàn chính xác.",
        "Người dùng nên tự kiểm tra thông tin đối tác, trao đổi kỹ lưỡng và lập thỏa thuận bằng văn bản pháp lý trước khi chia sẻ tài sản quan trọng hoặc đóng góp công sức lớn."
      ]
    },
    {
      id: "personal-data",
      title: "8. Dữ liệu cá nhân",
      content: [
        "Chúng tôi thu thập và xử lý dữ liệu cá nhân của bạn tuân thủ các quy định pháp luật hiện hành về bảo vệ dữ liệu cá nhân tại Việt Nam.",
        "Các loại dữ liệu có thể được thu thập bao gồm:",
        "- Họ tên hoặc username tự chọn;",
        "- Địa chỉ email liên hệ;",
        "- Ảnh đại diện (avatar);",
        "- Liên kết danh mục sản phẩm (portfolio link);",
        "- Thông tin mô tả hồ sơ cá nhân/studio, kỹ năng, công cụ sử dụng;",
        "- Nội dung dự án, yêu cầu tuyển dụng do người dùng tự đăng tải;",
        "- Nhật ký kỹ thuật (IP, thiết bị, log hoạt động) phục vụ mục đích bảo mật hệ thống.",
        "Mục đích xử lý dữ liệu cá nhân:",
        "- Tạo lập, quản lý và vận hành tài khoản người dùng;",
        "- Kết nối cộng tác viên và hiển thị thông tin hồ sơ theo cài đặt công khai của bạn;",
        "- Bảo đảm an toàn hệ thống, ngăn chặn các hành vi tấn công mạng, spam hoặc lạm dụng;",
        "- Hỗ trợ kỹ thuật và giải quyết các khiếu nại, báo cáo vi phạm;",
        "- Nghiên cứu cải thiện tính năng và trải nghiệm dịch vụ trên website.",
        "Quyền của người dùng đối với dữ liệu cá nhân:",
        "- Người dùng có quyền truy cập, yêu cầu chỉnh sửa hoặc tự cập nhật thông tin bất cứ lúc nào qua trang cá nhân;",
        "- Người dùng có quyền yêu cầu xóa dữ liệu cá nhân của mình trong phạm vi pháp luật cho phép bằng cách liên hệ với ban quản trị hoặc chọn xóa tài khoản."
      ]
    },
    {
      id: "system-security",
      title: "9. Bảo mật và an toàn hệ thống",
      content: [
        "Người dùng không được cố gắng truy cập trái phép vào server, database, API, tài khoản hoặc dữ liệu của người khác.",
        "Các hành vi như tấn công brute force, DDoS, bypass authentication, scan lỗ hổng hệ thống hoặc khai thác lỗi bảo mật trái phép đều bị nghiêm cấm.",
        "Nếu phát hiện lỗi bảo mật trên website, vui lòng báo cáo ngay cho chúng tôi qua kênh liên hệ thay vì khai thác hoặc công khai lỗi đó ra cộng đồng."
      ]
    },
    {
      id: "api-resources",
      title: "10. API, rate limit và tài nguyên hệ thống",
      content: [
        "Người dùng phải sử dụng các API, tính năng tương tác với backend đúng mục đích và không được lạm dụng tài nguyên hệ thống.",
        "Chúng tôi áp dụng các hạn mức tần suất yêu cầu (rate limit) để bảo vệ hệ thống.",
        "IndieCollab giữ quyền giới hạn, chặn hoặc thu hồi quyền truy cập API/website đối với tài khoản hoặc địa chỉ IP có hành vi spam request, gây ảnh hưởng đến hiệu năng, bảo mật hoặc trải nghiệm của người dùng khác."
      ]
    },
    {
      id: "vietnam-regulations",
      title: "11. Quy định riêng cho thị trường Việt Nam",
      content: [
        "Người dùng khi tham gia IndieCollab cam kết tuân thủ đầy đủ các quy định của pháp luật Việt Nam về dịch vụ Internet và an ninh mạng.",
        "Nghiêm cấm đăng tải hoặc quảng bá các dự án game có nội dung trái pháp luật Việt Nam, bao gồm nhưng không giới hạn ở: game có nội dung khiêu dâm, bạo lực quá mức, cờ bạc trái phép, hoặc xuyên tạc lịch sử.",
        "Nghiêm cấm lợi dụng nền tảng để phát tán phần mềm crack, asset lậu, source code bị đánh cắp, hoặc bất kỳ nội dung nào vi phạm giấy phép sử dụng (license) của các bên gamedev khác."
      ]
    },
    {
      id: "account-termination",
      title: "12. Tạm ngưng hoặc chấm dứt tài khoản",
      content: [
        "IndieCollab có quyền tạm ngưng, hạn chế quyền truy cập hoặc xóa tài khoản vĩnh viễn mà không cần báo trước nếu người dùng:",
        "- Vi phạm các điều khoản dịch vụ này hoặc chính sách bảo mật của chúng tôi;",
        "- Gây hại cho sự an toàn và văn hóa của cộng đồng;",
        "- Thực hiện hành vi cố tình phá hoại hệ thống hoặc trục lợi bất chính;",
        "- Sử dụng nền tảng cho mục đích lừa đảo tài chính hoặc giả mạo thông tin;",
        "- Đăng tải các nội dung bất hợp pháp hoặc phát tán mã độc hại.",
        "Chúng tôi giữ quyền lưu trữ dữ liệu log kỹ thuật cần thiết để phục vụ công tác điều tra bảo mật hoặc xử lý vi phạm pháp luật theo yêu cầu của cơ quan Nhà nước có thẩm quyền."
      ]
    },
    {
      id: "liability-limitation",
      title: "13. Giới hạn trách nhiệm",
      content: [
        "IndieCollab được cung cấp theo nguyên tắc \"theo hiện trạng\" (as-is) và \"sẵn có\" (as-available).",
        "Chúng tôi không cam kết hoặc bảo đảm rằng website luôn hoạt động liên tục không gián đoạn, hoàn toàn không có lỗi kỹ thuật hoặc luôn an toàn tuyệt đối trước mọi cuộc tấn công mạng phức tạp.",
        "Trong phạm vi tối đa được pháp luật Việt Nam cho phép, IndieCollab miễn trừ trách nhiệm đối với:",
        "- Sự cố mất mát dữ liệu do thiên tai, lỗi hạ tầng bên thứ ba hoặc các cuộc tấn công bất khả kháng;",
        "- Mọi gián đoạn tạm thời của dịch vụ phục vụ bảo trì hệ thống;",
        "- Bất kỳ tranh chấp, xung đột hoặc thiệt hại kinh tế/tài sản nào phát sinh từ các thỏa thuận hợp tác, làm việc chung giữa các người dùng với nhau;",
        "- Các hành vi xâm phạm quyền sở hữu trí tuệ hoặc lừa đảo do bên thứ ba thực hiện trên nền tảng."
      ]
    },
    {
      id: "service-changes",
      title: "14. Thay đổi dịch vụ",
      content: [
        "Chúng tôi có thể tiến hành cập nhật, thay đổi giao diện, tính năng, hoặc tạm ngưng một phần/toàn bộ dịch vụ bất kỳ lúc nào nhằm nâng cấp chất lượng kỹ thuật, bảo trì định kỳ hoặc tuân thủ các yêu cầu pháp lý mới phát sinh."
      ]
    },
    {
      id: "terms-changes",
      title: "15. Thay đổi điều khoản",
      content: [
        "IndieCollab có quyền cập nhật và sửa đổi nội dung điều khoản này vào bất kỳ lúc nào. Phiên bản cập nhật mới nhất sẽ được đăng tải trực tiếp trên website kèm ngày hiệu lực.",
        "Việc bạn tiếp tục sử dụng website sau khi các điều khoản được sửa đổi đồng nghĩa với việc bạn đã đọc, hiểu và chấp thuận hoàn toàn các thay đổi đó. Nếu không đồng ý với điều khoản mới, bạn nên dừng việc truy cập sử dụng dịch vụ."
      ]
    },
    {
      id: "applicable-law",
      title: "16. Luật áp dụng và giải quyết tranh chấp",
      content: [
        "Điều khoản dịch vụ này được điều chỉnh, giải thích và áp dụng theo quy định pháp luật hiện hành của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.",
        "Trong trường hợp phát sinh tranh chấp giữa người dùng và ban quản trị IndieCollab hoặc tranh chấp giữa các người dùng với nhau liên quan đến quá trình vận hành nền tảng, các bên cam kết ưu tiên giải quyết thông qua biện pháp thương lượng, hòa giải thiện chí.",
        "Nếu tranh chấp không thể tự giải quyết bằng thương lượng trong vòng 30 ngày kể từ ngày một bên thông báo bằng văn bản, vụ việc sẽ được đưa ra giải quyết tại Tòa án nhân dân có thẩm quyền tại Việt Nam để phân xử theo pháp luật Việt Nam."
      ]
    },
    {
      id: "legal-contact",
      title: "17. Liên hệ pháp lý",
      content: [
        "Nếu bạn có bất kỳ câu hỏi nào về Điều khoản Dịch vụ này, muốn báo cáo hành vi vi phạm bản quyền/nội dung cấm, hoặc thông báo sự cố bảo mật dữ liệu cá nhân, vui lòng liên hệ với ban quản trị qua:",
        "- Email hỗ trợ trực tuyến: support@indiecollab.onrender.com",
        "- Địa chỉ Website chính thức: https://indiecollab.onrender.com",
        "- Quốc gia hoạt động ban đầu: Việt Nam"
      ]
    }
  ]
};
