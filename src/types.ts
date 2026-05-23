// ============================================================================
// GAME DEVELOPMENT JOB TYPES - Comprehensive Industry Roles (English Only)
// ============================================================================

export enum JobType {
  // PROGRAMMING & ENGINEERING
  GameplayProgrammer = "Gameplay Programmer",
  EngineProgrammer = "Engine Programmer",
  AIProgrammer = "AI Programmer",
  NetworkProgrammer = "Network/Multiplayer Programmer",
  GraphicsProgrammer = "Graphics Programmer",
  ToolsProgrammer = "Tools Programmer",
  UIProgrammer = "UI Programmer",
  TechnicalDirector = "Technical Director",
  
  // ART & VISUAL DESIGN
  ConceptArtist = "Concept Artist",
  CharacterArtist2D = "2D Character Artist",
  CharacterArtist3D = "3D Character Artist",
  EnvironmentArtist2D = "2D Environment Artist",
  EnvironmentArtist3D = "3D Environment Artist",
  PixelArtist = "Pixel Artist",
  VFXArtist = "VFX Artist",
  TechnicalArtist = "Technical Artist",
  Animator2D = "2D Animator",
  Animator3D = "3D Animator",
  Rigger = "Rigger",
  UIUXArtist = "UI/UX Artist",
  ArtDirector = "Art Director",
  
  // AUDIO
  SoundDesigner = "Sound Designer",
  Composer = "Music Composer",
  AudioProgrammer = "Audio Programmer",
  VoiceDirector = "Voice Director",
  FoleyArtist = "Foley Artist",
  AudioDirector = "Audio Director",
  
  // DESIGN
  GameDesigner = "Game Designer",
  LevelDesigner = "Level Designer",
  SystemsDesigner = "Systems Designer",
  CombatDesigner = "Combat Designer",
  EconomyDesigner = "Economy Designer",
  NarrativeDesigner = "Narrative Designer",
  UXDesigner = "UX Designer",
  CreativeDirector = "Creative Director",
  
  // WRITING & NARRATIVE
  NarrativeWriter = "Narrative Writer",
  QuestWriter = "Quest Writer",
  WorldBuilder = "World Builder",
  DialogueWriter = "Dialogue Writer",
  LoreWriter = "Lore/Backstory Writer",
  
  // PRODUCTION & MANAGEMENT
  Producer = "Producer",
  ProjectManager = "Project Manager",
  ScrumMaster = "Scrum Master",
  ProductManager = "Product Manager",
  LiveOpsManager = "Live Ops Manager",
  
  // QA & TESTING
  QATester = "QA Tester",
  QAEngineer = "QA Engineer",
  QAAutomation = "QA Automation Engineer",
  Playtester = "Playtester",
  
  // MARKETING & COMMUNITY
  CommunityManager = "Community Manager",
  SocialMediaManager = "Social Media Manager",
  MarketingManager = "Marketing Manager",
  ContentCreator = "Content Creator",
  Influencer = "Influencer/Streamer",
  
  // BUSINESS & OPERATIONS
  GameEconomist = "Game Economist",
  DataAnalyst = "Data Analyst",
  BusinessDevelopment = "Business Development",
  PublisherRelations = "Publisher Relations",
  MonetizationDesigner = "Monetization Designer",
  
  // SPECIALIZED ART ROLES
  ShaderArtist = "Shader Artist",
  LightingArtist = "Lighting Artist",
  TextureArtist = "Texture Artist",
  StoryboardArtist = "Storyboard Artist",
  Illustrator = "Illustrator",
  
  // SPECIALIZED TECH ROLES
  LocalizationSpecialist = "Localization Specialist",
  AccessibilityDesigner = "Accessibility Designer",
  EsportsDesigner = "Esports Designer",
  VRDeveloper = "VR/AR Developer",
  BlockchainGamer = "Blockchain Game Developer",
  AIGameDeveloper = "AI Game Developer",
  ProceduralContent = "Procedural Content Developer",
  
  // INDIE/FREELANCE
  SoloDev = "Solo Developer (Generalist)",
  IndieDev = "Indie Developer",
  FreelanceArtist = "Freelance Artist",
  FreelanceProgrammer = "Freelance Programmer",
  Modder = "Modder",
}

// ============================================================================
// COLLABORATION TYPES - Various Ways to Work Together
// ============================================================================

export enum CollabType {
  // REVENUE SHARING
  RevShareEqual = "Revenue Share - Equal Split",
  RevShareTiered = "Revenue Share - Tiered",
  RevShareMilestone = "Revenue Share - Milestone Based",
  EquityShare = "Equity Share (Co-founder)",
  
  // PAID WORK
  FixedPrice = "Fixed Price Contract",
  HourlyRate = "Hourly Rate Contract",
  Retainer = "Monthly Retainer",
  MilestonePayment = "Milestone Payment",
  RoyaltyBased = "Royalty Based Payment",
  
  // HOBBY & LEARNING
  HobbyJam = "Game Jam Partner",
  HobbyLongTerm = "Long-term Hobby Project",
  LearningMentor = "Mentor/Mentee",
  LearningPeer = "Peer Learning",
  PortfolioBuilding = "Portfolio Building",
  
  // SPECIAL ARRANGEMENTS
  RevSharePlusPaid = "Rev Share + Upfront Payment",
  DeferredPayment = "Deferred Payment",
  ProfitShare = "Net Profit Share",
  KickstarterBacked = "Kickstarter/Backer Funded",
  
  // OPEN SOURCE
  OpenSource = "Open Source Contribution",
  ModCollaboration = "Mod Collaboration",
  
  // WORK FOR HIRE
  WorkForHire = "Work for Hire (Full Rights Transfer)",
  LicensedWork = "Licensed Work (IP Retained)",
  
  // INTERN & ENTRY
  InternshipPaid = "Paid Internship",
  InternshipUnpaid = "Unpaid Internship (Credit)",
  JuniorTraining = "Junior Training Program",
}

// ============================================================================
// CV/Resume Style Portfolio - Education & Certifications
// ============================================================================

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear?: string;
  current: boolean;
  description?: string;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialUrl?: string;
  badgeUrl?: string;
}

export interface User {
  id: string;
  displayName: string;
  avatarUrl: string;
  jobTitle: JobType | string;
  skills: string[];
  tools: string[];
  bio: string;
  howToReachMe: string;
  openToWork: boolean;
  profileComplete?: boolean;
  createdAt: string;
  deviceId?: string;
  machineIp?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  connectionsCount?: number;
  // CV/Resume fields (optional - increases credibility)
  location?: string; // City, Country
  languages?: string[]; // e.g., ["English", "Vietnamese"]
  experienceYears?: number;
  education?: Education[];
  certificates?: Certificate[];
  // Portfolio credibility score (calculated)
  credibilityScore?: number; // 0-100 based on profile completion
  isGuest?: boolean;
}

export interface GameStudio {
  id: string;
  name: string;
  slogan?: string;
  description: string;
  bannerUrl?: string;
  avatarUrl: string;
  ownerId: string;
  ownerName: string;
  members: string[];
  memberIds?: string[];
  createdAt: string;
}

export interface UserConnection {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  toUserName: string;
  fromUserAvatar: string;
  toUserAvatar: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  acceptedAt?: string;
  message?: string;
}

export interface StudioJoinRequest {
  id: string;
  studioId: string;
  studioName: string;
  ownerId?: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userJobTitle: string;
  status: "pending" | "accepted" | "declined";
  message?: string;
  createdAt: string;
  respondedAt?: string;
}

export interface BountyTask {
  id: string;
  projectId: string;
  projectTitle: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Legendary";
  reward: string;
  description: string;
  bugDetails: string;
  reportedBy: string;
  reportedById?: string;
  status: "Open" | "Claimed" | "InReview" | "Solved";
  assignedTo?: string;
  assignedToName?: string;
  claimedAt?: string;
  submittedAt?: string;
  solvedAt?: string;
  solvedById?: string;
  solvedByName?: string;
  createdAt: string;
  githubPrUrl?: string;
  solutionNotes?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  arbitrationResult?: string;
  arbitrationRequestedBy?: string;
  arbitratedAt?: string;
  repositoryUrl?: string;
  // Repository privacy settings
  repoPrivacy: "public" | "private";
  repoAccessMethod: "collaborator_invite" | "snippet_only" | "fork_branch" | "nda_required";
  // Collaborator management for private repos
  repoCollaborators?: string[]; // GitHub usernames with access
  pendingCollaboratorInvite?: string; // Hunter's GitHub username awaiting invite
  collaboratorInvitedAt?: string;
  // Code snippet for private sharing (encrypted or temp link)
  privateSnippetUrl?: string;
  snippetExpiresAt?: string;
  // GitHub PR integration fields
  linkedPR?: {
    owner: string;
    repo: string;
    prNumber: number;
    prTitle: string;
    prState: "open" | "closed";
    merged: boolean;
    commits: number;
    additions: number;
    deletions: number;
    headBranch: string;
    baseBranch: string;
    htmlUrl: string;
    lastSyncedAt: string;
  };
  prReviews?: Array<{
    reviewer: string;
    state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED";
    submittedAt: string;
  }>;
}

export interface ArtForSale {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  mediaType: "Sprite Sheet" | "3D Model (FBX/OBJ)" | "Voxel Art";
  description: string;
  mediaUrl: string;
  archiveStoragePath?: string;
  archiveFileName?: string;
  archiveFileSize?: number;
  archiveContentType?: string;
  price: string;
  sold: boolean;
  buyerProjectId?: string;
  buyerProjectTitle?: string;
  buyerId?: string;
  transactionId?: string;
  createdAt: string;
}

export interface ProjectRecruitment {
  role: string;
  quantity: number;
  status: "Open" | "Filled";
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  category: "Code" | "Art" | "Sound" | "Design" | "Other";
  status: "Todo" | "In Progress" | "Completed";
  assignedTo?: string;
  assignedToName?: string;
  assignedToAvatar?: string;
  applicants?: Array<{
    userId: string;
    userName: string;
    userAvatar: string;
    userJobTitle: string;
    note?: string;
  }>;
  priority?: "low" | "medium" | "high";
  deadline?: string;
  comments?: TaskComment[];
  githubPrUrl?: string;
}

export interface Project {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  title: string;
  pitch: string;
  description: string;
  collabType: CollabType;
  engine: string;
  teamNeeds: string[];
  recruitments: ProjectRecruitment[];
  status: "Recruiting" | "In Progress" | "Completed";
  bannerUrl?: string;
  meetLink?: string;
  createdAt: string;
  videoDemoUrl?: string;
  showcaseImages?: string[];
  hiringType?: "Freelance" | "Teammate" | "Both";
  budgetDescription?: string;
  inspiration?: string;
  tasks?: ProjectTask[];
}

export interface ProjectWorkspaceMember {
  userId: string;
  userName: string;
  userAvatar: string;
  role: string;
  joinedAt: string;
}

export interface ProjectGoal {
  id: string;
  title: string;
  description: string;
  type: "short_term" | "long_term";
  status: "Todo" | "In_Progress" | "Done";
  deadline?: string;
  createdAt: string;
}

export interface ProjectWorkspaceFile {
  id: string;
  name: string;
  description?: string;
  fileUrl: string;
  fileType: "image" | "audio" | "video" | "document" | "code" | "archive" | "other";
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
}

export interface ProjectWorkspace {
  id: string;
  ownerId: string;
  ownerName: string;
  projectTitle: string;
  memberIds: string[];
  memberProfiles: ProjectWorkspaceMember[];
  goals: ProjectGoal[];
  tasks: ProjectTask[];
  files: ProjectWorkspaceFile[];
  createdAt: string;
  githubRepoUrl?: string;
  githubLinkedAt?: string;
  githubLinkedBy?: string;
  discordWebhookUrl?: string;
  discordWebhookEnabled?: boolean;
  discordEvents?: string[];
  googleLinked?: boolean;
  googleLinkedAt?: string;
  figmaUrl?: string;
  youtubeUrl?: string;
  steamAppId?: string;
  milestones?: WorkspaceMilestone[];
  pinnedMessageIds?: string[];
}

export interface WorkspaceChannel {
  id: string;
  name: string;
  type: "text" | "voice" | "announcement";
  topic?: string;
  createdBy: string;
  createdAt: string;
  lastMessageAt?: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: "text" | "system" | "pr_link" | "file";
  metadata?: {
    prUrl?: string;
    fileName?: string;
    fileUrl?: string;
  };
  replyToId?: string;
  reactions?: Record<string, string[]>; // emoji -> [userId]
  createdAt: string;
  editedAt?: string;
}

export interface WorkspaceVoiceParticipant {
  userId: string;
  userName: string;
  userAvatar: string;
  joinedAt: string;
  muted: boolean;
  deafened: boolean;
}

export interface WorkspaceVoiceRoom {
  id: string; // "{workspaceId}_{channelId}"
  workspaceId: string;
  channelId: string;
  participants: WorkspaceVoiceParticipant[];
  createdAt: string;
}

export interface WorkspaceMilestone {
  id: string;
  title: string;
  description?: string;
  deadline: string;
  status: "open" | "closed";
  taskIds: string[];
  goalIds: string[];
  createdBy: string;
  createdAt: string;
}

export interface WorkspacePresence {
  userId: string;
  userName: string;
  userAvatar: string;
  status: "online" | "away" | "busy";
  currentTab: string; // "kanban" | "goals" | "github" | "channel_id" | ...
  lastSeen: string;
}

export interface WorkspaceMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  createdAt: string;
}

export interface ProjectApplication {
  id: string;
  projectId: string;
  projectTitle: string;
  ownerId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userJobTitle: string;
  roleApplied: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  respondedAt?: string;
}

export interface MyWork {
  id: string;
  userId: string;
  title: string;
  mediaUrl: string;
  mediaType: "image" | "audio" | "link" | "video" | "github_pr" | "github_commit";
  category?: "game_demo" | "art" | "certificate" | "degree" | "audio" | "video";
  description: string;
  // GitHub integration for code contributions
  githubData?: {
    type: "pr" | "commit" | "repo";
    owner: string;
    repo: string;
    prNumber?: number;
    commitSha?: string;
    htmlUrl: string;
    stats?: {
      additions: number;
      deletions: number;
      filesChanged: number;
    };
    merged?: boolean;
    createdAt: string;
  };
  // For PR-type portfolio items
  prReviews?: Array<{
    reviewer: string;
    state: string;
  }>;
}

export interface JobTypeStyle {
  color: string;
  bg: string;
  border: string;
  icon: string;
}

/** Old type aliases for backward compatibility */
export type DevClass = JobType;
export type DevClassMeta = JobTypeStyle;
export type PortfolioItem = MyWork;
export type ExclusiveAsset = ArtForSale;

/** Application-level navigation tab identifiers */
export type TabType = "explore" | "partners" | "gamejams" | "bountymarket" | "advisor" | "learnhub" | "profile";

// ============================================================================
// NEW FEATURES: Chat, Notifications, Files, Tasks, Reputation, Activity, Builds, Calendar
// ============================================================================

/** Feature 1: Real-time Chat Message */
export interface ChatMessage {
  id: string;
  conversationId: string; // "userA_userB" (sorted) or "studio_{studioId}"
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: "text" | "image" | "file" | "system";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
  readBy: string[]; // user IDs who read
  replyTo?: string; // message ID being replied to
}

/** Feature 2: Notification Center */
export interface Notification {
  id: string;
  userId: string; // recipient
  type: 
    | "connection_request" 
    | "connection_accepted" 
    | "studio_join_request" 
    | "studio_join_accepted" 
    | "task_assigned" 
    | "task_completed" 
    | "bounty_claimed" 
    | "bounty_solved" 
    | "file_shared" 
    | "build_uploaded"
    | "calendar_event"
    | "message";
  title: string;
  message: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  actionUrl?: string; // e.g., "/profile?tab=connections"
  actorId?: string; // who triggered
  actorName?: string;
  actorAvatar?: string;
  metadata?: Record<string, any>; // extra data
}

/** Feature 3: Project File Sharing */
export interface ProjectFile {
  id: string;
  projectId: string;
  uploadedBy: string;
  uploadedByName: string;
  name: string;
  description?: string;
  fileUrl: string;
  fileType: "image" | "audio" | "video" | "document" | "code" | "archive" | "other";
  fileSize: number; // bytes
  version: number;
  versionLabel?: string; // e.g., "v1.2-beta"
  thumbnailUrl?: string;
  tags?: string[];
  downloadedBy: string[]; // user IDs
  createdAt: string;
  updatedAt: string;
}

/** Feature 4: Task Assignment (extends ProjectTask with deadlines) */
export interface TaskAssignment {
  id: string;
  projectId: string;
  taskId: string;
  assignedBy: string;
  assignedByName: string;
  assignedTo: string;
  assignedToName: string;
  dueDate?: string; // ISO date
  priority: "low" | "medium" | "high" | "urgent";
  reminderSent: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  createdAt: string;
}

/** Feature 5: Reputation/Karma System */
export interface ReputationRecord {
  userId: string;
  karma: number; // total points
  level: number; // calculated from karma
  badges: Badge[];
  stats: {
    projectsCompleted: number;
    tasksCompleted: number;
    bountiesSolved: number;
    bountiesPosted: number;
    connectionsMade: number;
    filesShared: number;
    playtestsGiven: number;
  };
  ratings: Array<{
    fromUserId: string;
    fromUserName: string;
    score: 1 | 2 | 3 | 4 | 5;
    category: "skill" | "communication" | "reliability" | "creativity";
    comment?: string;
    createdAt: string;
  }>;
  averageRating: number;
  lastUpdated: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: string;
}

/** Feature 6: Activity Feed */
export interface Activity {
  id: string;
  userId: string; // who did it
  userName: string;
  userAvatar: string;
  type: 
    | "joined" 
    | "created_project" 
    | "joined_studio" 
    | "completed_task" 
    | "solved_bounty" 
    | "uploaded_file" 
    | "new_connection" 
    | "posted_build"
    | "earned_badge"
    | "rating_received";
  title: string;
  description?: string;
  targetId?: string; // project/studio/bounty ID
  targetName?: string;
  targetType?: "project" | "studio" | "bounty" | "user";
  metadata?: Record<string, any>;
  createdAt: string;
  visibleTo: "public" | "connections" | "studio";
}

/** Feature 7: Game Builds & Playtesting */
export interface GameBuild {
  id: string;
  projectId: string;
  projectName: string;
  uploadedBy: string;
  uploadedByName: string;
  version: string;
  platform: "WebGL" | "Windows" | "macOS" | "Linux" | "Android" | "iOS";
  buildUrl: string; // download/play link
  thumbnailUrl?: string;
  description?: string;
  changelog?: string;
  fileSize: number;
  downloadCount: number;
  isPublic: boolean; // false = internal only
  password?: string; // optional password protection
  playtesters: string[]; // user IDs who can access
  feedback: PlaytestFeedback[];
  createdAt: string;
}

export interface PlaytestFeedback {
  id: string;
  buildId: string;
  userId: string;
  userName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  enjoyment: 1 | 2 | 3 | 4 | 5;
  difficulty: "too_easy" | "just_right" | "too_hard";
  bugs?: string;
  suggestions?: string;
  wouldRecommend: boolean;
  createdAt: string;
}

// ============================================================================
// GAME JAM FEATURE
// ============================================================================

export type JamStatus = "draft" | "open" | "closed" | "voting" | "finished";
export type JamParticipationType = "solo" | "team" | "both";
export type JamAttendanceMode = "online" | "offline" | "both";
export type JamTeamMemberStatus = "pending" | "accepted" | "declined";
export type PointSource =
  | "profile_complete"
  | "create_project"
  | "new_connection"
  | "jam_register"
  | "jam_vote"
  | "jam_rank_1"
  | "jam_rank_2"
  | "jam_rank_3"
  | "jam_badge_category";

export interface JamPrizeTier {
  rank: number | string;
  label: string;
  points: number;
  badgeType: string;
  badgeColor: string;
  description?: string;
}

export interface GameJam {
  id: string;
  studioId: string;
  studioName: string;
  studioAvatar: string;
  organizerId: string;
  organizerName: string;
  title: string;
  theme: string;
  shortDescription: string;
  description: string;
  rules: string;
  tags: string[];
  bannerUrl?: string;
  status: JamStatus;
  participationType: JamParticipationType;
  minTeamSize: number;
  maxTeamSize: number;
  submissionFormats: Array<"github_repo" | "itchio_link" | "video_demo" | "apk">;
  customRules: string[];
  prizes: JamPrizeTier[];
  registrationOpenAt: string;
  registrationDeadline: string;
  startDate: string;
  endDate: string;
  votingStartAt: string;
  votingEndAt: string;
  participantCount: number;
  teamCount: number;
  createdAt: string;
  publishedAt?: string;
}

export interface JamTeamMember {
  userId: string;
  userName: string;
  userAvatar: string;
  userJobTitle: string;
  status: JamTeamMemberStatus;
  invitedAt: string;
  respondedAt?: string;
}

export interface JamTeam {
  id: string;
  jamId: string;
  leaderId: string;
  leaderName: string;
  leaderAvatar: string;
  teamName: string;
  members: JamTeamMember[];
  submissionUrl?: string;
  submissionTitle?: string;
  submissionDescription?: string;
  submittedAt?: string;
  voteCount?: number;
  rank?: number;
  createdAt: string;
}

export interface JamRegistration {
  id: string;
  jamId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userJobTitle: string;
  type: "solo" | "team";
  teamId?: string;
  contactInfo: {
    email?: string;
    discord?: string;
    phone?: string;
  };
  attendanceMode: JamAttendanceMode;
  submissionUrl?: string;
  submissionTitle?: string;
  submissionDescription?: string;
  submittedAt?: string;
  voteCount?: number;
  rank?: number;
  registeredAt: string;
}

export interface JamVote {
  id: string;
  jamId: string;
  voterId: string;
  targetId: string;
  targetType: "solo" | "team";
  createdAt: string;
}

export interface UserPoint {
  id: string;
  userId: string;
  amount: number;
  source: PointSource;
  sourceId?: string;
  description: string;
  createdAt: string;
}

export interface JamBadge extends Badge {
  jamId: string;
  jamTitle: string;
  badgeType: string;
  placement?: 1 | 2 | 3;
  category?: string;
}

/** Feature 8: Studio Calendar */
export interface CalendarEvent {
  id: string;
  studioId?: string; // null = personal event
  projectId?: string;
  createdBy: string;
  createdByName: string;
  title: string;
  description?: string;
  type: "deadline" | "milestone" | "meeting" | "game_jam" | "reminder" | "other";
  startDate: string; // ISO
  endDate?: string;
  allDay: boolean;
  attendees?: string[]; // user IDs
  reminderMinutes?: number; // before event
  googleCalendarId?: string;
  color?: string;
  createdAt: string;
}

// ============================================================================
// FEATURE: Learn Hub (AI-powered Game Dev Discovery Engine)
// ============================================================================
export type LearningOpportunityStatus = "pending_review" | "published" | "rejected" | "expired" | "suspicious";
export type LearningOpportunityCategory = "course" | "certificate" | "scholarship" | "event" | "other";

export interface LearningOpportunity {
  id: string;
  title: string;
  canonicalUrl: string;
  sourceDomain: string;
  sourceType: "rss" | "sitemap" | "page" | "search";
  category: LearningOpportunityCategory;
  isFree: boolean;
  freeCondition: string;
  deadline?: string;
  tags: string[];
  language: string;
  status: LearningOpportunityStatus;
  discoveredAt: string;
  lastVerifiedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface LearningKeyword {
  id: string;
  query: string;
  locale: string;
  category: string;
  enabled: boolean;
  lastScannedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningSource {
  id: string;
  domain: string;
  sourceMode: "rss" | "sitemap" | "page" | "search_scope";
  entryUrl: string;
  trusted: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LearningScanRun {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: "running" | "completed" | "failed";
  urlsFound: number;
  itemsCreated: number;
  errors: Array<{ source: string; message: string }>;
}

