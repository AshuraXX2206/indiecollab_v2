import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import Navbar from "./components/Navbar";
import ProjectList from "./components/ProjectList";
import AuthLanding from "./components/AuthLanding";
import Onboarding from "./components/Onboarding";
import { safeStorage } from "./utils/storage";
import { setPageMeta } from "./utils/seo";
import { IntroVideoOverlay } from "./components/IntroVideoOverlay";
import { ToastContainer, ToastMessage } from "./components/Toast";
import { TermsPage, PrivacyPage } from "./components/LegalLayout";

export const navigateToPath = (path: string) => {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

// Code splitting for optimized page load speed
const TalentHub = lazy(() => import("./components/TalentHub"));
const ProfileView = lazy(() => import("./components/ProfileView"));
const ProjectForm = lazy(() => import("./components/ProjectForm"));
const CoopMarket = lazy(() => import("./components/CoopMarket"));
const ChatPanel = lazy(() => import("./components/ChatPanel"));
const GameJamLobby = lazy(() => import("./components/GameJamLobby"));
const ProjectWorkspaceView = lazy(() => import("./components/ProjectWorkspace"));
const LearnHubView = lazy(() => import("./components/LearnHubView"));
import { Project, User, PortfolioItem, BountyTask, ExclusiveAsset, GameStudio, TabType, CollabType, UserConnection, StudioJoinRequest, ChatMessage, Notification, ProjectFile, Activity, CalendarEvent, ProjectApplication, ProjectWorkspace } from "./types";
import { Sparkles, Gamepad2, ShieldAlert, Loader2, Info, RefreshCw, CheckCircle2, X } from "lucide-react";

// Firebase and OAuth functions
import { db, auth, initAuth, googleSignIn, logout, getAccessToken, checkRedirectResult } from "./firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc,
  deleteDoc,
  runTransaction,
  query,
  where
} from "firebase/firestore";

// ============================================================================
// DATA SOURCE: All user/project/portfolio data comes exclusively from Firebase
// Firestore via real-time snapshot listeners. No local seed data is injected.
// ============================================================================

export default function App() {
  const [showIntroVideo, setShowIntroVideo] = useState(() => {
    return safeStorage.getItem("indiecollab_hide_intro") !== "true";
  });
  const [activeTab, setActiveTab] = useState<TabType>("explore");

  // Update <title> and <meta description> whenever the user switches tabs
  useEffect(() => {
    setPageMeta(activeTab);
  }, [activeTab]);

  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [googleContacts, setGoogleContacts] = useState<Array<{names?: {displayName: string}[]; emailAddresses?: {value: string}[]; photos?: {url: string}[]}>>([]);

  // Core database replicas
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [bountyTasks, setBountyTasks] = useState<BountyTask[]>([]);
  const [exclusiveAssets, setExclusiveAssets] = useState<ExclusiveAsset[]>([]);
  const [studios, setStudios] = useState<GameStudio[]>([]);

  // Social features - connections and join requests
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [studioJoinRequests, setStudioJoinRequests] = useState<StudioJoinRequest[]>([]);
  const [projectApplications, setProjectApplications] = useState<ProjectApplication[]>([]);
  const [projectWorkspaces, setProjectWorkspaces] = useState<ProjectWorkspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [pendingConnectionCount, setPendingConnectionCount] = useState(0);
  const [pendingStudioJoinCount, setPendingStudioJoinCount] = useState(0);

  // Feature 1: Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTargetUser, setChatTargetUser] = useState<User | undefined>();
  const [chatStudioId, setChatStudioId] = useState<string | undefined>();
  const [chatStudioName, setChatStudioName] = useState<string | undefined>();

  // Feature 2: Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Feature 3: Project Files
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);

  // Feature 6: Activity Feed
  const [activities, setActivities] = useState<Activity[]>([]);

  // Feature 8: Calendar
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // Modals & triggers
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [analyzingProjectId, setAnalyzingProjectId] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<Record<string, { text: string; matchedUsers: string[] }>>({});
  const [highlightedUserIds, setHighlightedUserIds] = useState<string[]>([]);
  const [activeProjectForMatch, setActiveProjectForMatch] = useState<string | null>(null);

  // Loading indicator for authentication & database setup
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Enhanced toast system with title/message separation
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((title: string, message?: string, type: ToastMessage["type"] = "success") => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, title, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Elegant Mouse Aura effects ref
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHoveringClickable, setIsHoveringClickable] = useState(false);

  // Helper: Build auth headers for API calls.
  // All backend calls must use a real Firebase ID token.
  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      try {
        const idToken = await firebaseUser.getIdToken();
        if (idToken) {
          headers["Authorization"] = `Bearer ${idToken}`;
        }
      } catch (err) {
        console.warn("[Auth] Could not get Firebase ID token:", err);
      }
    }
    return headers;
  }, []);

  // Handle cursor positioning directly via DOM manipulation to avoid root component re-renders
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
        cursorRef.current.style.opacity = "1";
      }
    };
    const handleMouseLeave = () => {
      if (cursorRef.current) {
        cursorRef.current.style.opacity = "0";
      }
    };
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickable = target.closest("button, a, input, select, textarea, [role='button'], .cursor-pointer");
      setIsHoveringClickable(!!isClickable);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  // 1. Initialize Authentication and Firestore Observers
  useEffect(() => {
    setIsAuthChecking(true);

    // Never promote cached localStorage data into an authenticated session.
    // Firebase Auth is the only source of truth for identity.
    setCurrentUser(null);

    // Check for OAuth redirect result (when popup fallback to redirect was used)
    checkRedirectResult().then(async (redirectRes) => {
      if (redirectRes) {
        console.log("OAuth redirect result captured successfully:", redirectRes.user.displayName);
        setIsGoogleUser(!!redirectRes.accessToken);
        if (redirectRes.accessToken) {
          setGoogleAccessToken(redirectRes.accessToken);
          loadGoogleContacts(redirectRes.accessToken);
        }
        // Build/fetch profile so Onboarding is triggered if new user
        const ru = redirectRes.user;
        try {
          const snap = await getDoc(doc(db, "users", ru.uid));
          if (snap.exists()) {
            setCurrentUser(snap.data() as User);
          } else {
            const newProfile: User = {
              id: ru.uid,
              displayName: ru.displayName || "Indie Dev",
              avatarUrl: ru.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${ru.uid}`,
              jobTitle: "Gameplay Programmer",
              skills: [],
              tools: [],
              bio: "",
              howToReachMe: `Email: ${ru.email || ""}`,
              openToWork: true,
              profileComplete: false,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, "users", ru.uid), newProfile);
            setCurrentUser(newProfile);
          }
        } catch (e) {
          console.warn("checkRedirectResult profile setup error:", e);
        }
      }
    }).catch((err) => {
      console.warn("checkRedirectResult error (non-critical):", err);
    });

    const unsubscribeAuth = initAuth(
      async (firebaseUser, token) => {
        setIsGoogleUser(!!token);
        if (token) {
          setGoogleAccessToken(token);
          loadGoogleContacts(token);
        }

        // Try reading their custom profile from Firestore users collection
        try {
          const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userSnap.exists()) {
            const userData = userSnap.data() as User;
            // Only update state if AuthLanding hasn't already set it (avoid race overwrite)
            setCurrentUser(prev => {
              if (prev && prev.id === userData.id) return prev;
              safeStorage.setItem("indiecollab_session", JSON.stringify(userData));
              return userData;
            });
          } else {
            // Setup a default initial profile object
            const initialProfile: User = {
              id: firebaseUser.uid,
              displayName: firebaseUser.displayName || "Indie Jammer",
              avatarUrl: firebaseUser.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${firebaseUser.uid}`,
              jobTitle: "Gameplay Programmer",
              skills: [],
              tools: [],
              bio: "",
              howToReachMe: `Email: ${firebaseUser.email || ""}`,
              openToWork: true,
              profileComplete: false,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, "users", firebaseUser.uid), initialProfile);
            setCurrentUser(prev => {
              if (prev && prev.id === initialProfile.id) return prev;
              safeStorage.setItem("indiecollab_session", JSON.stringify(initialProfile));
              return initialProfile;
            });
          }
        } catch (err) {
          console.error("Firestore read failed for user", err);
          setFetchError("Không thể tải hồ sơ bảo mật của bạn. Hãy kiểm tra kết nối cơ sở dữ liệu hoặc quyền truy cập.");
          setCurrentUser(null);
          setIsAuthChecking(false);
          return;
        }
        setIsAuthChecking(false);
      },
      () => {
        setCurrentUser(null);
        setIsGoogleUser(false);
        setGoogleAccessToken(null);
        setGoogleContacts([]);
        safeStorage.removeItem("indiecollab_session");
        setIsAuthChecking(false);
      }
    );

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Sync last active user profile to localStorage to prevent guest session loss upon logout
  useEffect(() => {
    if (currentUser) {
      safeStorage.setItem("indiecollab_last_active_user", JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // 2. Load Firestore Data when the user is successfully logged in (Realtime sync!)
  useEffect(() => {
    if (!currentUser) {
      setProjectApplications([]);
      setProjectWorkspaces([]);
      setActiveWorkspaceId(null);
      return;
    }
    // Only trigger full isLoading screen if database is currently empty/initial fetch
    if (projects.length === 0 && users.length === 0) {
      setIsLoading(true);
    }
    setFetchError(null);

    // Snapshot observers over collections
    const unsubProjects = onSnapshot(
      collection(db, "projects"), 
      (snapshot) => {
        if (snapshot.empty) {
          setProjects([]);
        } else {
          const list = snapshot.docs.map(doc => doc.data() as Project);
          // Sort by creation date descending
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setProjects(list);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("Firestore projects error:", err);
        setFetchError("Đang kết nối cơ sở dữ liệu sảnh... Hãy kiểm tra kết nối mạng.");
        setIsLoading(false);
      }
    );

    const unsubUsers = onSnapshot(
      collection(db, "users"), 
      (snapshot) => {
        if (snapshot.empty) {
          setUsers([]);
        } else {
          const list = snapshot.docs.map(doc => doc.data() as User);
          setUsers(list);
        }
      },
      (err) => console.warn("Users subscriber error:", err)
    );

    const unsubPortfolios = onSnapshot(
      collection(db, "portfolios"), 
      (snapshot) => {
        if (snapshot.empty) {
          setPortfolioItems([]);
        } else {
          const list = snapshot.docs.map(doc => doc.data() as PortfolioItem);
          setPortfolioItems(list);
        }
      },
      (err) => console.warn("Portfolio subscriber error:", err)
    );

    const unsubBounties = onSnapshot(
      collection(db, "bounties"),
      (snapshot) => {
        if (snapshot.empty) {
          setBountyTasks([]);
        } else {
          const list = snapshot.docs.map(doc => doc.data() as BountyTask);
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setBountyTasks(list);
        }
      },
      (err) => console.warn("Bounties subscriber error:", err)
    );

    const unsubAssets = onSnapshot(
      collection(db, "exclusive_assets"),
      (snapshot) => {
        if (snapshot.empty) {
          setExclusiveAssets([]);
        } else {
          const list = snapshot.docs.map(doc => doc.data() as ExclusiveAsset);
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setExclusiveAssets(list);
        }
      },
      (err) => console.warn("Exclusive assets subscriber error:", err)
    );

    const unsubStudios = onSnapshot(
      collection(db, "studios"),
      (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data() as GameStudio);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setStudios(list);
      },
      (err) => console.warn("Studios subscriber error:", err)
    );

    // Real-time connections listener, constrained to the authenticated user.
    const mergeConnections = (sent: UserConnection[], received: UserConnection[]) => {
      const merged = new Map<string, UserConnection>();
      [...sent, ...received].forEach(c => merged.set(c.id, c));
      const list = Array.from(merged.values());
      setConnections(list);
      setPendingConnectionCount(list.filter(c => c.toUserId === currentUser.id && c.status === "pending").length);
    };
    let sentConnections: UserConnection[] = [];
    let receivedConnections: UserConnection[] = [];
    const unsubSentConnections = onSnapshot(
      query(collection(db, "connections"), where("fromUserId", "==", currentUser.id)),
      (snapshot) => {
        sentConnections = snapshot.docs.map(doc => doc.data() as UserConnection);
        mergeConnections(sentConnections, receivedConnections);
      },
      (err) => console.warn("Sent connections subscriber error:", err)
    );
    const unsubReceivedConnections = onSnapshot(
      query(collection(db, "connections"), where("toUserId", "==", currentUser.id)),
      (snapshot) => {
        receivedConnections = snapshot.docs.map(doc => doc.data() as UserConnection);
        mergeConnections(sentConnections, receivedConnections);
      },
      (err) => console.warn("Received connections subscriber error:", err)
    );

    // Real-time studio join requests listener
    const mergeStudioJoinRequests = (own: StudioJoinRequest[], owned: StudioJoinRequest[]) => {
      const merged = new Map<string, StudioJoinRequest>();
      [...own, ...owned].forEach(r => merged.set(r.id, r));
      const list = Array.from(merged.values());
      setStudioJoinRequests(list);
      setPendingStudioJoinCount(owned.filter(r => r.status === "pending").length);
    };
    let ownJoinRequests: StudioJoinRequest[] = [];
    let ownedStudioJoinRequests: StudioJoinRequest[] = [];
    const unsubOwnStudioJoins = onSnapshot(
      query(collection(db, "studio_join_requests"), where("userId", "==", currentUser.id)),
      (snapshot) => {
        ownJoinRequests = snapshot.docs.map(doc => doc.data() as StudioJoinRequest);
        mergeStudioJoinRequests(ownJoinRequests, ownedStudioJoinRequests);
      },
      (err) => console.warn("Own studio join requests subscriber error:", err)
    );
    const unsubOwnedStudioJoins = onSnapshot(
      query(collection(db, "studio_join_requests"), where("ownerId", "==", currentUser.id)),
      (snapshot) => {
        ownedStudioJoinRequests = snapshot.docs.map(doc => doc.data() as StudioJoinRequest);
        mergeStudioJoinRequests(ownJoinRequests, ownedStudioJoinRequests);
      },
      (err) => console.warn("Owned studio join requests subscriber error:", err)
    );

    const mergeProjectApplications = (own: ProjectApplication[], owned: ProjectApplication[]) => {
      const merged = new Map<string, ProjectApplication>();
      [...own, ...owned].forEach((application) => merged.set(application.id, application));
      const list = Array.from(merged.values());
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setProjectApplications(list);
    };
    let ownProjectApplications: ProjectApplication[] = [];
    let ownedProjectApplications: ProjectApplication[] = [];
    const unsubOwnProjectApplications = onSnapshot(
      query(collection(db, "project_applications"), where("userId", "==", currentUser.id)),
      (snapshot) => {
        ownProjectApplications = snapshot.docs.map(doc => doc.data() as ProjectApplication);
        mergeProjectApplications(ownProjectApplications, ownedProjectApplications);
      },
      (err) => console.warn("Own project applications subscriber error:", err)
    );
    const unsubOwnedProjectApplications = onSnapshot(
      query(collection(db, "project_applications"), where("ownerId", "==", currentUser.id)),
      (snapshot) => {
        ownedProjectApplications = snapshot.docs.map(doc => doc.data() as ProjectApplication);
        mergeProjectApplications(ownProjectApplications, ownedProjectApplications);
      },
      (err) => console.warn("Owned project applications subscriber error:", err)
    );

    const mergeProjectWorkspaces = (owned: ProjectWorkspace[], member: ProjectWorkspace[]) => {
      const merged = new Map<string, ProjectWorkspace>();
      [...owned, ...member].forEach((workspace) => merged.set(workspace.id, workspace));
      const list = Array.from(merged.values());
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setProjectWorkspaces(list);
      if (activeWorkspaceId && !list.some((workspace) => workspace.id === activeWorkspaceId)) {
        setActiveWorkspaceId(null);
      }
    };
    let ownedProjectWorkspaces: ProjectWorkspace[] = [];
    let memberProjectWorkspaces: ProjectWorkspace[] = [];
    const unsubOwnedProjectWorkspaces = onSnapshot(
      query(collection(db, "project_workspaces"), where("ownerId", "==", currentUser.id)),
      (snapshot) => {
        ownedProjectWorkspaces = snapshot.docs.map(doc => doc.data() as ProjectWorkspace);
        mergeProjectWorkspaces(ownedProjectWorkspaces, memberProjectWorkspaces);
      },
      (err) => console.warn("Owned project workspaces subscriber error:", err)
    );
    const unsubMemberProjectWorkspaces = onSnapshot(
      query(collection(db, "project_workspaces"), where("memberIds", "array-contains", currentUser.id)),
      (snapshot) => {
        memberProjectWorkspaces = snapshot.docs.map(doc => doc.data() as ProjectWorkspace);
        mergeProjectWorkspaces(ownedProjectWorkspaces, memberProjectWorkspaces);
      },
      (err) => console.warn("Member project workspaces subscriber error:", err)
    );

    return () => {
      unsubProjects();
      unsubUsers();
      unsubPortfolios();
      unsubBounties();
      unsubAssets();
      unsubStudios();
      unsubSentConnections();
      unsubReceivedConnections();
      unsubOwnStudioJoins();
      unsubOwnedStudioJoins();
      unsubOwnProjectApplications();
      unsubOwnedProjectApplications();
      unsubOwnedProjectWorkspaces();
      unsubMemberProjectWorkspaces();
    };
  }, [currentUser, activeWorkspaceId]);

  // Firestore is the single source of truth. No local REST database fallback is used.
  const loadOfflineLocalData = async () => {
    setFetchError("Cloud database is the only data source. Local or fake database fallback is disabled.");
    setIsLoading(false);
  };

  // NOTE: No seed/preset data injection. All data comes from Firebase Firestore.

  // 3. Fetch Contacts from Google People REST API if logged in via Google Auth
  const loadGoogleContacts = async (token: string) => {
    try {
      const res = await fetch(
        "https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,photos",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!res.ok) {
        throw new Error("Connections fetch returned non-200 state");
      }
      const data = await res.json();
      setGoogleContacts(data.connections || []);
    } catch (err) {
      console.warn("Unable to sync Google Contacts. Might need scope clearance.", err);
      // Google Contacts API not available - leave empty
      setGoogleContacts([]);
    }
  };

  // 4. Generate Google Meet Video conferene workspace
  const handleCreateMeetRoom = async (meetingTitle: string): Promise<string | null> => {
    try {
      const token = googleAccessToken || await getAccessToken();
      if (!token) {
        showToast("Yêu cầu đăng nhập Google", "Vui lòng đăng ký / đăng nhập với tài khoản Google để sử dụng tính năng họp Meet trực tiếp.", "warning");
        return null;
      }

      // Explicit user confirmation before destructive or external resource generation (as required)
      const confirmed = window.confirm(`Bạn có chắc muốn tạo phòng họp Google Meet video thảo luận cho "${meetingTitle}" không?`);
      if (!confirmed) return null;

      const res = await fetch("https://meet.googleapis.com/v2/spaces", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });

      if (!res.ok) throw new Error("Google Meet REST returned error code");
      const data = await res.json();
      return data.meetingUri || `https://meet.google.com/${data.meetingCode}`;
    } catch (err) {
      console.warn("Google Meet creation failed:", err);
      showToast("Lỗi tạo phòng họp", "Không thể tạo phòng họp Google Meet. Vui lòng đăng nhập bằng tài khoản Google có quyền truy cập Meet API.", "error");
      return null;
    }
  };

  // 5. Save/Update project's meet link in Firestore collection
  const handleUpdateProjectMeetLink = async (projectId: string, meetLink: string) => {
    try {
      await setDoc(doc(db, "projects", projectId), { meetLink }, { merge: true });
    } catch (err) {
      console.error("Firestore meet write error:", err);
      // Fallback local updates
      setProjects(projects.map(p => p.id === projectId ? { ...p, meetLink } : p));
    }
  };

  // 6. Handle Create Project
  const handleCreateProject = async (pData: Partial<Project>) => {
    if (!currentUser) return;
    try {
      const newId = "project-" + Date.now();
      const payload: Project = {
        id: newId,
        ownerId: currentUser.id,
        ownerName: currentUser.displayName,
        ownerAvatar: currentUser.avatarUrl,
        title: pData.title || "Dự án game mới",
        pitch: pData.pitch || "Mô tả ngắn",
        description: pData.description || "Chi tiết dự án",
        collabType: pData.collabType || (CollabType.HobbyJam),
        engine: pData.engine || "Godot",
        teamNeeds: pData.teamNeeds || [],
        recruitments: pData.recruitments || [],
        status: "Recruiting",
        createdAt: new Date().toISOString(),
        ...(pData.videoDemoUrl ? { videoDemoUrl: pData.videoDemoUrl } : {}),
        ...(pData.showcaseImages?.length ? { showcaseImages: pData.showcaseImages } : {}),
        hiringType: pData.hiringType || "Teammate",
        budgetDescription: pData.budgetDescription || "Ngân sách và thù lao do chủ dự án thỏa thuận",
        inspiration: pData.inspiration || "",
      };

      // Save live to Firestore
      await setDoc(doc(db, "projects", newId), payload);
      await setDoc(doc(db, "project_workspaces", newId), {
        id: newId,
        ownerId: currentUser.id,
        ownerName: currentUser.displayName,
        projectTitle: payload.title,
        memberIds: [currentUser.id],
        memberProfiles: [{
          userId: currentUser.id,
          userName: currentUser.displayName,
          userAvatar: currentUser.avatarUrl,
          role: "Project Owner",
          joinedAt: payload.createdAt
        }],
        goals: [],
        tasks: payload.tasks || [],
        files: [],
        createdAt: payload.createdAt
      } satisfies ProjectWorkspace);
      setShowCreateForm(false);
    } catch (err) {
      console.error(err);
      showToast("Lỗi đăng tải dự án", "Xảy ra lỗi khi đăng tải dự án lên cơ sở dữ liệu sảnh.", "error");
    }
  };

  // 6b. Handle Update Project (Firestore is the only write path)
  const handleUpdateProject = async (projectId: string, updatedFields: Partial<Project>) => {
    try {
      const existingProject = projects.find(p => p.id === projectId);
      if (!existingProject) {
        console.warn(`Project with ID ${projectId} not found in state.`);
        return;
      }
      
      const mergedProject = {
        ...existingProject,
        ...updatedFields
      };

      await setDoc(doc(db, "projects", projectId), updatedFields, { merge: true });
      setProjects(prev => prev.map(p => p.id === projectId ? mergedProject : p));
    } catch (err: any) {
      console.error("Project update error:", err);
      showToast("Lỗi cập nhật dự án", err.message, "error");
    }
  };

  const ensureProjectWorkspace = async (project: Project) => {
    if (!currentUser || project.ownerId !== currentUser.id) return;
    const workspaceRef = doc(db, "project_workspaces", project.id);
    const workspaceSnap = await getDoc(workspaceRef);
    if (workspaceSnap.exists()) return;

    await setDoc(workspaceRef, {
      id: project.id,
      ownerId: project.ownerId,
      ownerName: project.ownerName,
      projectTitle: project.title,
      memberIds: [project.ownerId],
      memberProfiles: [{
        userId: project.ownerId,
        userName: project.ownerName,
        userAvatar: project.ownerAvatar,
        role: "Project Owner",
        joinedAt: project.createdAt
      }],
      goals: [],
      tasks: project.tasks || [],
      files: [],
      createdAt: project.createdAt || new Date().toISOString()
    } satisfies ProjectWorkspace);
  };

  const handleApplyForProject = async (projectId: string, roleApplied: string, message: string) => {
    if (!currentUser) return;
    const project = projects.find((item) => item.id === projectId);
    if (!project) {
      showToast("Không tìm thấy dự án", "Dự án không còn tồn tại hoặc chưa đồng bộ.", "error");
      return;
    }
    if (project.ownerId === currentUser.id) {
      showToast("Bạn là chủ dự án", "Chủ dự án đã có quyền vào workspace.", "info");
      return;
    }

    const existing = projectApplications.find((application) =>
      application.projectId === projectId &&
      application.userId === currentUser.id &&
      application.status !== "rejected"
    );
    if (existing) {
      showToast("Đã gửi ứng tuyển", "Đơn ứng tuyển của bạn đang chờ duyệt hoặc đã được chấp nhận.", "info");
      return;
    }

    const id = `project-app-${projectId}-${currentUser.id}-${Date.now()}`;
    const application: ProjectApplication = {
      id,
      projectId,
      projectTitle: project.title,
      ownerId: project.ownerId,
      userId: currentUser.id,
      userName: currentUser.displayName,
      userAvatar: currentUser.avatarUrl,
      userJobTitle: String(currentUser.jobTitle || "Game Creator"),
      roleApplied,
      message: message.trim(),
      status: "pending",
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "project_applications", id), application);
      showToast("Đã gửi đơn ứng tuyển", "Chủ dự án sẽ nhận được yêu cầu và duyệt trong hồ sơ.", "success");
    } catch (err: any) {
      console.error("Project application error:", err);
      showToast("Lỗi gửi đơn ứng tuyển", err.message || String(err), "error");
    }
  };

  const handleRespondToProjectApplication = async (applicationId: string, response: "approved" | "rejected") => {
    if (!currentUser) return;
    const application = projectApplications.find((item) => item.id === applicationId);
    const project = application ? projects.find((item) => item.id === application.projectId) : undefined;
    if (!application || !project || application.ownerId !== currentUser.id) {
      showToast("Không có quyền", "Bạn không thể duyệt đơn ứng tuyển này.", "error");
      return;
    }

    const now = new Date().toISOString();
    const applicationRef = doc(db, "project_applications", applicationId);
    const workspaceRef = doc(db, "project_workspaces", application.projectId);

    try {
      await runTransaction(db, async (transaction) => {
        transaction.update(applicationRef, {
          status: response,
          respondedAt: now
        });

        if (response !== "approved") return;

        const workspaceSnap = await transaction.get(workspaceRef);
        const newMember = {
          userId: application.userId,
          userName: application.userName,
          userAvatar: application.userAvatar,
          role: application.roleApplied,
          joinedAt: now
        };

        if (!workspaceSnap.exists()) {
          transaction.set(workspaceRef, {
            id: project.id,
            ownerId: project.ownerId,
            ownerName: project.ownerName,
            projectTitle: project.title,
            memberIds: [project.ownerId, application.userId],
            memberProfiles: [{
              userId: project.ownerId,
              userName: project.ownerName,
              userAvatar: project.ownerAvatar,
              role: "Project Owner",
              joinedAt: project.createdAt
            }, newMember],
            goals: [],
            tasks: project.tasks || [],
            files: [],
            createdAt: project.createdAt || now
          } satisfies ProjectWorkspace);
          return;
        }

        const workspace = workspaceSnap.data() as ProjectWorkspace;
        const memberIds = workspace.memberIds.includes(application.userId)
          ? workspace.memberIds
          : [...workspace.memberIds, application.userId];
        const memberProfiles = workspace.memberProfiles.some((member) => member.userId === application.userId)
          ? workspace.memberProfiles
          : [...workspace.memberProfiles, newMember];
        transaction.update(workspaceRef, {
          memberIds,
          memberProfiles
        });
      });
      showToast(response === "approved" ? "Đã chấp nhận ứng viên" : "Đã từ chối ứng viên", application.userName, "success");
    } catch (err: any) {
      console.error("Project application response error:", err);
      showToast("Lỗi duyệt đơn ứng tuyển", err.message || String(err), "error");
    }
  };

  const handleUpdateWorkspace = async (workspaceId: string, updatedFields: Partial<ProjectWorkspace>) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, "project_workspaces", workspaceId), updatedFields, { merge: true });
    } catch (err: any) {
      console.error("Workspace update error:", err);
      showToast("Lỗi cập nhật workspace", err.message || String(err), "error");
    }
  };

  // 7. Handle Profile update
  const handleUpdateProfile = async (uData: Partial<User>) => {
    if (!currentUser) return;
    const updatedProfile = {
      ...currentUser,
      ...uData
    };
    try {
      await setDoc(doc(db, "users", currentUser.id), updatedProfile);
      showToast("Cập nhật hồ sơ thành công!");
    } catch (err) {
      console.warn("Firestore save unsuccessful.", err);
      showToast("Lỗi đồng bộ dữ liệu!", "Không thể lưu thông tin hồ sơ lên cơ sở dữ liệu.", "error");
    }
    // ALWAYS synchronize client state and cache to guarantee they never get stuck during onboarding completion!
    setCurrentUser(updatedProfile);
    safeStorage.setItem("indiecollab_session", JSON.stringify(updatedProfile));
    
    // ALSO save a persistent backup for this specific identity
    safeStorage.setItem(`indiecollab_backup_${currentUser.id}`, JSON.stringify(updatedProfile));

    // If a guest just completed onboarding, lock uid + device so future "Try as Guest" on same device skips onboarding
    if (updatedProfile.isGuest && updatedProfile.profileComplete) {
      safeStorage.setItem("indiecollab_guest_uid", currentUser.id);
      const { getOrCreateDeviceId } = await import("./utils/device");
      safeStorage.setItem("indiecollab_guest_device", getOrCreateDeviceId());
    }
  };

  // 7_studio. Handle Studio creation and edits
  const handleCreateStudio = async (studioPayload: Omit<GameStudio, "id" | "ownerId" | "ownerName" | "createdAt">) => {
    if (!currentUser) return;
    const hasStudioProfile =
      currentUser.profileComplete === true &&
      currentUser.isGuest !== true &&
      (currentUser.skills || []).length > 0 &&
      (currentUser.tools || []).length > 0 &&
      !!currentUser.bio?.trim() &&
      !!currentUser.howToReachMe?.trim();
    if (!hasStudioProfile) {
      showToast("Chưa đủ điều kiện tạo Studio", "Hãy hoàn thiện hồ sơ đầy đủ và dùng tài khoản chính thức để tránh spam Studio.", "warning");
      return;
    }
    const firebaseUid = auth.currentUser?.uid;
    if (!firebaseUid) {
      showToast("Không thể tạo Studio", "Phiên đăng nhập chưa sẵn sàng. Hãy đăng nhập lại rồi thử lần nữa.", "error");
      return;
    }
    try {
      const newId = "studio-" + Date.now();
      const newStudio: GameStudio = {
        ...studioPayload,
        id: newId,
        ownerId: firebaseUid,
        ownerName: currentUser.displayName,
        members: studioPayload.members?.length ? studioPayload.members : [currentUser.displayName],
        memberIds: studioPayload.memberIds?.includes(firebaseUid) ? studioPayload.memberIds : [firebaseUid],
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "studios", newId), newStudio);
    } catch (err) {
      console.error(err);
      showToast("Lỗi tạo Studio", String(err), "error");
    }
  };

  const handleUpdateStudio = async (studioId: string, updatedPayload: Partial<GameStudio>) => {
    try {
      const ref = doc(db, "studios", studioId);
      await updateDoc(ref, updatedPayload);
    } catch (err) {
      console.warn("Could not direct update, attempting setDoc overwrite:", err);
      try {
        const ref = doc(db, "studios", studioId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await setDoc(ref, { ...snap.data(), ...updatedPayload });
        }
      } catch (err2) {
        showToast("Lỗi cập nhật Studio", String(err), "error");
      }
    }
  };

  const handleDeleteStudio = async (studioId: string) => {
    try {
      await deleteDoc(doc(db, "studios", studioId));
    } catch (err) {
      console.error(err);
      showToast("Lỗi giải tán Studio", String(err), "error");
    }
  };

  // ==========================================
  // CONNECTION SYSTEM HANDLERS
  // ==========================================

  // Send connection request to another user
  const handleSendConnectionRequest = async (toUserId: string, message?: string) => {
    if (!currentUser) return;
    try {
      // Check if connection already exists
      const existingConnection = connections.find(
        c => (c.fromUserId === currentUser.id && c.toUserId === toUserId) ||
             (c.fromUserId === toUserId && c.toUserId === currentUser.id)
      );
      if (existingConnection) {
        showToast("Đã có kết nối", "Bạn đã có kết nối hoặc lời mời với người này rồi.", "warning");
        return;
      }

      const toUser = users.find(u => u.id === toUserId);
      if (!toUser) {
        showToast("Không tìm thấy người dùng", "Người dùng này không tồn tại trong hệ thống.", "error");
        return;
      }
      if (!toUser.profileComplete) {
        showToast("Không thể gửi lời mời", "Người dùng chưa hoàn thiện hồ sơ.", "warning");
        return;
      }

      // Verify target user actually exists in Firestore (not just in local state)
      const toUserSnap = await getDoc(doc(db, "users", toUserId));
      if (!toUserSnap.exists()) {
        showToast("Không thể gửi lời mời", "Người dùng không tồn tại trong hệ thống.", "error");
        return;
      }

      const newConnection: UserConnection = {
        id: "conn-" + Date.now(),
        fromUserId: currentUser.id,
        fromUserName: currentUser.displayName,
        fromUserAvatar: currentUser.avatarUrl,
        toUserId: toUserId,
        toUserName: toUser.displayName,
        toUserAvatar: toUser.avatarUrl,
        status: "pending",
        message: message || "",
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, "connections", newConnection.id), newConnection);
        showToast("Đã gửi lời mời", `Lời mời kết nối đến ${toUser.displayName} đã được gửi.`, "success");
      } catch (firestoreErr) {
        console.warn("Firestore connection update failed:", firestoreErr);
        throw firestoreErr;
      }
    } catch (err: any) {
      console.error("Connection request error:", err);
      showToast("Lỗi gửi lời mời", err.message, "error");
    }
  };

  // Accept or decline connection request
  const handleRespondConnection = async (connectionId: string, response: "accepted" | "declined") => {
    if (!currentUser) return;
    try {
      try {
        const connRef = doc(db, "connections", connectionId);
        const connSnap = await getDoc(connRef);
        if (!connSnap.exists()) {
          throw new Error("Connection not found in Firestore");
        }

        const connData = connSnap.data() as UserConnection;
        // Only the receiver can accept/decline
        if (connData.toUserId !== currentUser.id) {
          showToast("Không có quyền", "Bạn không có quyền phản hồi lời mời này.", "warning");
          return;
        }

        await updateDoc(connRef, {
          status: response,
          acceptedAt: response === "accepted" ? new Date().toISOString() : null
        });

        if (response === "accepted") {
          showToast("Đã chấp nhận", `Bạn và ${connData.fromUserName} đã là kết nối.`, "success");
        } else {
          showToast("Đã từ chối", "Đã từ chối lời mời kết nối.", "info");
        }
      } catch (firestoreErr) {
        console.warn("Firestore connection response failed:", firestoreErr);
        throw firestoreErr;
      }
    } catch (err: any) {
      console.error("Connection response error:", err);
      showToast("Lỗi phản hồi", err.message, "error");
    }
  };

  // Cancel sent connection request or disconnect (delete connection)
  const handleCancelConnection = async (connectionId: string) => {
    if (!currentUser) return;
    try {
      try {
        const connRef = doc(db, "connections", connectionId);
        const connSnap = await getDoc(connRef);
        if (!connSnap.exists()) {
          throw new Error("Connection not found in Firestore");
        }

        const connData = connSnap.data() as UserConnection;
        // Either sender or receiver can delete/disconnect once accepted, or sender can cancel if pending
        if (connData.fromUserId !== currentUser.id && connData.toUserId !== currentUser.id) {
          showToast("Không có quyền", "Bạn không thể hủy lời mời hoặc ngắt kết nối của người khác.", "warning");
          return;
        }

        await deleteDoc(connRef);
        showToast("Đã hủy", "Đã hủy lời mời hoặc ngắt kết nối thành công.", "success");
      } catch (firestoreErr) {
        console.warn("Firestore connection delete failed:", firestoreErr);
        throw firestoreErr;
      }
    } catch (err: any) {
      console.error("Cancel/disconnect connection error:", err);
      showToast("Lỗi hủy kết nối", err.message, "error");
    }
  };

  // ==========================================
  // STUDIO JOIN REQUEST HANDLERS
  // ==========================================

  // Send request to join a studio
  const handleRequestJoinStudio = async (studioId: string, message?: string) => {
    if (!currentUser) return;
    try {
      const studio = studios.find(s => s.id === studioId);
      if (!studio) {
        showToast("Không tìm thấy Studio", "Studio này không tồn tại.", "error");
        return;
      }

      // Check if already a member
      if (studio.memberIds?.includes(currentUser.id) || studio.members.includes(currentUser.displayName)) {
        showToast("Đã là thành viên", "Bạn đã là thành viên của Studio này rồi.", "warning");
        return;
      }

      // Check if already requested
      const existingRequest = studioJoinRequests.find(
        r => r.studioId === studioId && r.userId === currentUser.id && r.status === "pending"
      );
      if (existingRequest) {
        showToast("Đã gửi yêu cầu", "Bạn đã gửi yêu cầu gia nhập Studio này, đang chờ duyệt.", "warning");
        return;
      }

      const newRequest: StudioJoinRequest = {
        id: "join-req-" + Date.now(),
        studioId: studioId,
        studioName: studio.name,
        ownerId: studio.ownerId,
        userId: currentUser.id,
        userName: currentUser.displayName,
        userAvatar: currentUser.avatarUrl,
        userJobTitle: currentUser.jobTitle as string,
        status: "pending",
        message: message || "",
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "studio_join_requests", newRequest.id), newRequest);
      showToast("Đã gửi yêu cầu", `Yêu cầu gia nhập "${studio.name}" đã được gửi. Chủ Studio sẽ xét duyệt.`, "success");
    } catch (err) {
      console.error("Studio join request error:", err);
      showToast("Lỗi gửi yêu cầu", "Lỗi khi gửi yêu cầu gia nhập Studio.", "error");
    }
  };

  // Studio owner accepts or declines join request
  const handleRespondStudioJoin = async (requestId: string, response: "accepted" | "declined") => {
    if (!currentUser) return;
    try {
      const reqRef = doc(db, "studio_join_requests", requestId);
      const reqSnap = await getDoc(reqRef);
      if (!reqSnap.exists()) {
        showToast("Không tìm thấy", "Yêu cầu gia nhập không tồn tại.", "error");
        return;
      }

      const reqData = reqSnap.data() as StudioJoinRequest;
      const studio = studios.find(s => s.id === reqData.studioId);

      // Only studio owner can respond
      if (!studio || studio.ownerId !== currentUser.id) {
        showToast("Không có quyền", "Bạn không có quyền duyệt yêu cầu này.", "warning");
        return;
      }

      if (response === "accepted") {
        // Add member to studio
        const studioRef = doc(db, "studios", reqData.studioId);
        const currentMembers = studio.members || [];
        const updatedMembers = currentMembers.includes(reqData.userName)
          ? currentMembers
          : [...currentMembers, reqData.userName];
        const existingMemberIds = studio.memberIds?.length
          ? studio.memberIds
          : currentMembers
              .map((memberName) => {
                if (memberName === studio.ownerName) return studio.ownerId;
                return users.find((user) => user.displayName === memberName)?.id || "";
              })
              .filter(Boolean);
        const updatedMemberIds = existingMemberIds.includes(reqData.userId)
          ? existingMemberIds
          : [...existingMemberIds, reqData.userId];
        await updateDoc(studioRef, {
          members: updatedMembers,
          memberIds: updatedMemberIds
        });

        await updateDoc(reqRef, {
          status: "accepted",
          respondedAt: new Date().toISOString()
        });

        showToast("Đã chấp nhận", `${reqData.userName} đã gia nhập Studio!`, "success");
      } else {
        await updateDoc(reqRef, {
          status: "declined",
          respondedAt: new Date().toISOString()
        });
        showToast("Đã từ chối", `Đã từ chối yêu cầu gia nhập của ${reqData.userName}.`, "info");
      }
    } catch (err) {
      console.error("Studio join response error:", err);
      showToast("Lỗi phản hồi", "Lỗi khi phản hồi yêu cầu gia nhập.", "error");
    }
  };

  // NOTE: No seed bounties/assets — all content created by real users via Firebase

  const handleAddBounty = async (bounty: BountyTask) => {
    try {
      if (!currentUser || bounty.reportedById !== currentUser.id || bounty.status !== "Open") {
        throw new Error("Invalid bounty ownership or initial status.");
      }
      if (bounty.assignedTo || bounty.githubPrUrl || bounty.solutionNotes || bounty.arbitrationResult) {
        throw new Error("New bounties cannot include assignment, review, or arbitration fields.");
      }
      await setDoc(doc(db, "bounties", bounty.id), bounty);
    } catch (err: any) {
      console.error(err);
      showToast("Lỗi đăng Bounty", err.message || "Không thể đăng Bounty lên cơ sở dữ liệu sảnh.", "error");
    }
  };

  const handleClaimBounty = async (bountyId: string) => {
    if (!currentUser) return;
    try {
      // 1. Check claim eligibility with Server Endpoint
      const headers = await getAuthHeaders();
      const eligibleRes = await fetch(`/api/bounties/${bountyId}/claim-eligible`, { headers });
      if (eligibleRes.ok) {
        const checkResult = await eligibleRes.json();
        if (checkResult && !checkResult.eligible) {
          showToast("Không đủ điều kiện nhận", checkResult.reason || "Bạn không thể nhận bounty này.", "error");
          return;
        }
      }

      // 2. Perform Atomic Transaction with Lock document
      const bRef = doc(db, "bounties", bountyId);
      const lockRef = doc(db, "bounties", bountyId, "claim_lock", currentUser.id);

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(bRef);
        if (!snap.exists()) throw new Error("Bounty không tồn tại.");
        const data = snap.data() as BountyTask;
        if (data.status !== "Open") throw new Error("Bounty này đã được nhận bởi người khác.");
        if (data.reportedById === currentUser.id) throw new Error("Không thể nhận bounty của chính mình.");

        // Write the idempotent claim_lock document
        transaction.set(lockRef, {
          claimedAt: new Date().toISOString(),
          claimerId: currentUser.id
        });

        transaction.set(bRef, {
          ...data,
          status: "Claimed" as const,
          assignedTo: currentUser.id,
          assignedToName: currentUser.displayName,
          claimedAt: new Date().toISOString()
        });
      });

      // 3. Write Bounty Audit Trail on the server
      try {
        await fetch(`/api/bounties/${bountyId}/audit`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: "bounty_claim",
            fromStatus: "Open",
            toStatus: "Claimed",
            details: `Thợ săn "${currentUser.displayName}" đã nhận bounty.`
          })
        });
      } catch (auditErr) {
        console.warn("[Audit] Failed to log bounty claim on the server:", auditErr);
      }

      showToast("Nhận Bounty thành công", "Bạn đã nhận Bounty này thành công. Hãy bắt đầu giải quyết lỗi!", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Lỗi nhận Bounty", err.message || "Không thể nhận Bounty.", "error");
    }
  };

  const handleSubmitBountyReview = async (bountyId: string, githubPrUrl: string, solutionNotes: string) => {
    if (!currentUser) return;
    try {
      const bRef = doc(db, "bounties", bountyId);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(bRef);
        if (!snap.exists()) throw new Error("Bounty không tồn tại.");
        const data = snap.data() as BountyTask;
        if (data.assignedTo !== currentUser.id) throw new Error("Chỉ người đã nhận bounty mới có quyền gửi nghiệm thu.");
        if (data.status !== "Claimed") throw new Error("Chỉ bounty đang được nhận mới có thể gửi nghiệm thu.");
        transaction.set(bRef, {
          ...data,
          status: "InReview" as const,
          githubPrUrl,
          solutionNotes,
          submittedAt: new Date().toISOString(),
          rejectionReason: ""
        });
      });

      // Write bounty audit log
      try {
        const headers = await getAuthHeaders();
        await fetch(`/api/bounties/${bountyId}/audit`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: "bounty_review_submit",
            fromStatus: "Claimed",
            toStatus: "InReview",
            details: `Thợ săn gửi báo cáo nghiệm thu với PR: ${githubPrUrl}`
          })
        });
      } catch (auditErr) {
        console.warn("[Audit] Failed to log bounty review submission:", auditErr);
      }

      showToast("Báo cáo thành công", "Giải pháp đã được gửi và đang chờ nghiệm thu.", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Lỗi gửi báo cáo", err.message || "Không thể gửi báo cáo sửa lỗi.", "error");
    }
  };

  const handleSolveBounty = async (bountyId: string) => {
    if (!currentUser) return;
    try {
      const bRef = doc(db, "bounties", bountyId);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(bRef);
        if (!snap.exists()) throw new Error("Bounty không tồn tại.");
        const data = snap.data() as BountyTask;
        const isOwner = data.reportedById === currentUser.id || projects.some(p => p.id === data.projectId && p.ownerId === currentUser.id);
        if (!isOwner) throw new Error("Chỉ chủ bounty hoặc chủ dự án mới có quyền duyệt nghiệm thu.");
        if (data.status !== "InReview" || !data.githubPrUrl || !data.solutionNotes) throw new Error("Chỉ báo cáo đang chờ nghiệm thu mới được duyệt.");
        transaction.set(bRef, {
          ...data,
          status: "Solved" as const,
          solvedAt: new Date().toISOString(),
          solvedById: data.assignedTo,
          solvedByName: data.assignedToName
        });
      });

      // Write bounty audit log
      try {
        const headers = await getAuthHeaders();
        await fetch(`/api/bounties/${bountyId}/audit`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: "bounty_solved",
            fromStatus: "InReview",
            toStatus: "Solved",
            details: `Chủ dự án "${currentUser.displayName}" duyệt giải ngân tiền thưởng.`
          })
        });
      } catch (auditErr) {
        console.warn("[Audit] Failed to log bounty solution:", auditErr);
      }

      showToast("Sửa lỗi thành công", "Lỗi đã được xác thực. Tiền thưởng đã được giải ngân.", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Lỗi hoàn tất", err.message || "Không thể hoàn tất bounty.", "error");
    }
  };

  const handleRejectBountyReview = async (bountyId: string) => {
    if (!currentUser) return;
    try {
      const bRef = doc(db, "bounties", bountyId);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(bRef);
        if (!snap.exists()) throw new Error("Bounty không tồn tại.");
        const data = snap.data() as BountyTask;
        const isOwner = data.reportedById === currentUser.id || projects.some(p => p.id === data.projectId && p.ownerId === currentUser.id);
        if (!isOwner) throw new Error("Chỉ chủ bounty hoặc chủ dự án mới có quyền từ chối nghiệm thu.");
        if (data.status !== "InReview") throw new Error("Chỉ báo cáo đang chờ nghiệm thu mới được từ chối.");
        transaction.set(bRef, {
          ...data,
          status: "Claimed" as const,
          rejectionReason: "Owner requested another revision.",
          rejectedAt: new Date().toISOString()
        });
      });

      // Write bounty audit log
      try {
        const headers = await getAuthHeaders();
        await fetch(`/api/bounties/${bountyId}/audit`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: "bounty_rejected",
            fromStatus: "InReview",
            toStatus: "Claimed",
            details: `Chủ dự án từ chối báo cáo sửa lỗi và yêu cầu tối ưu thêm.`
          })
        });
      } catch (auditErr) {
        console.warn("[Audit] Failed to log bounty rejection:", auditErr);
      }

      showToast("Đã trả lại", "Báo cáo đã bị trả lại để làm lại.", "warning");
    } catch (err: any) {
      console.error(err);
      showToast("Lỗi phản hồi", err.message || "Không thể gửi phản hồi nghiệm thu.", "error");
    }
  };

  const handleApplyArbitrationVerdict = async (bountyId: string, verdict: "APPROVED" | "REJECTED", explanation: string) => {
    if (!currentUser) return;
    try {
      const bRef = doc(db, "bounties", bountyId);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(bRef);
        if (!snap.exists()) throw new Error("Bounty không tồn tại.");
        const data = snap.data() as BountyTask;
        const canArbitrate = data.reportedById === currentUser.id || data.assignedTo === currentUser.id;
        if (!canArbitrate || data.status === "Solved" || !data.githubPrUrl || !data.solutionNotes) {
          throw new Error("Không đủ quyền hoặc trạng thái để áp dụng phán quyết AI.");
        }
        transaction.set(bRef, {
          ...data,
          status: verdict === "APPROVED" ? ("Solved" as const) : ("Claimed" as const),
          arbitrationResult: explanation,
          arbitrationRequestedBy: currentUser.id,
          arbitratedAt: new Date().toISOString(),
          ...(verdict === "APPROVED" ? {
            solvedAt: new Date().toISOString(),
            solvedById: data.assignedTo,
            solvedByName: data.assignedToName
          } : {
            rejectionReason: "AI arbitration rejected the submitted fix."
          })
        });
      });

      // Write bounty audit log
      try {
        const headers = await getAuthHeaders();
        await fetch(`/api/bounties/${bountyId}/audit`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: "bounty_arbitration",
            fromStatus: "InReview",
            toStatus: verdict === "APPROVED" ? "Solved" : "Claimed",
            details: `Trọng tài AI phân xử. Kết luận: ${verdict === "APPROVED" ? "CHẤP THUẬN (APPROVED) - Giải ngân" : "TỪ CHỐI (REJECTED) - Trả về thợ săn"}.`
          })
        });
      } catch (auditErr) {
        console.warn("[Audit] Failed to log bounty arbitration:", auditErr);
      }

      showToast(
        "Phán quyết AI",
        verdict === "APPROVED" ? "Chấp thuận và giải ngân thưởng!" : "Bác bỏ và yêu cầu hoàn thiện lại.",
        verdict === "APPROVED" ? "success" : "warning"
      );
    } catch (err: any) {
      console.error("Arbitration verdict update error:", err);
      showToast("Lỗi phán quyết AI", err.message || "Không thể áp dụng phán quyết.", "error");
    }
  };

  const handleAddExclusiveAsset = async (asset: ExclusiveAsset) => {
    try {
      if (!currentUser || asset.artistId !== currentUser.id || asset.sold !== false || !asset.archiveStoragePath) {
        throw new Error("Invalid asset ownership or missing compressed archive.");
      }
      await setDoc(doc(db, "exclusive_assets", asset.id), asset);
    } catch (err: any) {
      console.error(err);
      showToast("L?i k? g?i", err.message || "Kh?ng th? k? g?i t?c ph?m ??c b?n.", "error");
      throw err;
    }
  };

  // FIX: Use Firestore transaction to prevent race condition where two users buy the same asset simultaneously.
  const handleBuyExclusiveAsset = async (assetId: string, projectId: string, projectTitle: string) => {
    if (!currentUser) return;
    try {
      const aRef = doc(db, "exclusive_assets", assetId);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(aRef);
        if (!snap.exists()) throw new Error("T?i nguy?n kh?ng t?n t?i.");
        const data = snap.data() as ExclusiveAsset;
        if (data.sold) throw new Error("S?n ph?m n?y ?? ???c b?n cho ??n v? kh?c tr??c ??!");
        if (data.artistId === currentUser.id) throw new Error("B?n kh?ng th? t? mua asset c?a ch?nh m?nh.");
        if (!data.archiveStoragePath) throw new Error("Asset n?y ch?a c? file n?n ?? chuy?n giao.");
        if (!projects.some(p => p.id === projectId && p.ownerId === currentUser.id)) {
          throw new Error("B?n ch? c? th? g?n asset v?o d? ?n do ch?nh b?n s? h?u.");
        }
        transaction.set(aRef, {
          ...data,
          sold: true,
          buyerProjectId: projectId,
          buyerProjectTitle: projectTitle,
          buyerId: currentUser.id,
          transactionId: "tx-exclusive_" + Math.random().toString(36).substring(4, 12).toUpperCase() + "_" + Date.now()
        });
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "L?i khi th?c hi?n giao d?ch ??c s? h?u.";
      console.error(err);
      showToast("L?i giao d?ch", message, "error");
    }
  };

  // 8. Handle Portfolio addition
  const handleAddPortfolio = async (portPayload: Omit<PortfolioItem, "id" | "userId">) => {
    if (!currentUser) return;
    try {
      const newId = "port-" + Date.now();
      const newItem: PortfolioItem = {
        id: newId,
        userId: currentUser.id,
        title: portPayload.title,
        mediaUrl: portPayload.mediaUrl,
        mediaType: portPayload.mediaType,
        description: portPayload.description
      };

      await setDoc(doc(db, "portfolios", newId), newItem);
      showToast("Đã thêm tác phẩm vào triển lãm thành công!");
    } catch (err) {
      console.error(err);
      showToast("Lỗi tải tác phẩm lên cơ sở dữ liệu.", "error");
    }
  };

  // Delete portfolio item
  const handleDeletePortfolio = async (portId: string) => {
    if (!currentUser) return;
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa tác phẩm này khỏi triển lãm?");
    if (!confirmed) return;

    try {
      try {
        await deleteDoc(doc(db, "portfolios", portId));
        showToast("Đã xóa tác phẩm khỏi triển lãm thành công!");
      } catch (firestoreErr) {
        console.warn("Firestore portfolio delete failed:", firestoreErr);
        throw firestoreErr;
      }
    } catch (err: any) {
      console.error("Delete portfolio item error:", err);
      showToast("Lỗi khi xóa tác phẩm: " + err.message, "error");
    }
  };

  // 9. Run Team Matchmaker analytics via Gemini API endpoint
  const handleAnalyzeMatch = async (project: Project, setLocalMatchResult: (res: any) => void) => {
    setAnalyzingProjectId(project.id);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/ai/recommend-partners", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          projectTitle: project.title,
          projectDescription: project.description,
          teamNeeds: project.teamNeeds
        })
      });
      const data = await res.json();
      if (data.success) {
        const matchPayload = {
          text: data.analysis,
          matchedUsers: data.matchedUsers
        };
        setMatchResultForProject(project.id, matchPayload);
        setHighlightedUserIds(data.matchedUsers);
        setActiveProjectForMatch(project.id);
      } else {
        showToast("Lỗi AI", data.error || "Mô hình đang bận.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối", "Không kết nối được máy chủ AI.", "error");
    } finally {
      setAnalyzingProjectId(null);
    }
  };

  const setMatchResultForProject = (projId: string, result: { text: string; matchedUsers: string[] }) => {
    setMatchResults(prev => ({
      ...prev,
      [projId]: result
    }));
  };

  // Handle Sign-In successes
  const handleAuthSuccess = (user: { uid: string; displayName?: string | null; photoURL?: string | null; email?: string | null }, isGoogle: boolean, customProfile?: User) => {
    setIsGoogleUser(isGoogle);
    let resolvedProfile: User;
    if (customProfile) {
      resolvedProfile = customProfile;
    } else {
      resolvedProfile = {
        id: user.uid,
        displayName: user.displayName || "Indie Jammer",
        avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.uid}`,
        jobTitle: "Gameplay Programmer",
        skills: ["Gameplay dynamics"],
        tools: ["Unity"],
        bio: "Chào mừng bạn đến với IndieCollab!",
        howToReachMe: `Email: ${user.email || ""}`,
        openToWork: true,
        profileComplete: false,
        createdAt: new Date().toISOString()
      };
    }
    setCurrentUser(resolvedProfile);
    safeStorage.setItem("indiecollab_session", JSON.stringify(resolvedProfile));
    safeStorage.setItem(`indiecollab_backup_${resolvedProfile.id}`, JSON.stringify(resolvedProfile));
    safeStorage.removeItem("indiecollab_logged_out");
  };

  // Preset/fake guest login is disabled. Guests must use Firebase Anonymous Auth.
  const handleGuestPresetLogin = async (_presetId: string) => {
    showToast("Truy cập Khách đã đổi mới", "Quyền truy cập Khách hiện chỉ sử dụng Kênh Xác thực Bảo mật.", "warning");
  };

  const handleLogout = () => {
    const isGuest = currentUser?.isGuest === true;
    // Clear user state immediately for instant feedback
    setCurrentUser(null);
    setIsGoogleUser(false);
    setGoogleAccessToken(null);
    safeStorage.removeItem("indiecollab_session");
    safeStorage.setItem("indiecollab_logged_out", "true");
    
    if (!isGuest) {
      // Perform Firebase logout in the background to avoid any delay
      logout().catch((err) => {
        console.warn("Background signout issue:", err);
      });
    }
  };

  // ==========================================
  // CHAT HANDLERS
  // ==========================================
  const handleOpenChat = (user?: User, studioId?: string, studioName?: string) => {
    setChatTargetUser(user);
    setChatStudioId(studioId);
    setChatStudioName(studioName);
    setChatOpen(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    setChatTargetUser(undefined);
    setChatStudioId(undefined);
    setChatStudioName(undefined);
  };

  // Render navigation tab viewports
  const renderTabContent = () => {
    return (
      <Suspense fallback={
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold">Đang tải thành phần...</span>
        </div>
      }>
        {(() => {
          switch (activeTab) {
            case "explore":
              return showCreateForm ? (
                <div className="mx-auto max-w-4xl px-4 py-8">
                  <ProjectForm
                    currentUser={currentUser}
                    onClose={() => setShowCreateForm(false)}
                    onSave={handleCreateProject}
                  />
                </div>
              ) : (
                <ProjectList
                  projects={projects}
                  onOpenCreateForm={() => setShowCreateForm(true)}
                  analyzingProjectId={analyzingProjectId}
                  matchResults={matchResults}
                  onAnalyzeMatch={handleAnalyzeMatch}
                  setMatchResultForProject={setMatchResultForProject}
                  currentUser={currentUser}
                  onCreateMeet={handleCreateMeetRoom}
                  onUpdateMeetLink={handleUpdateProjectMeetLink}
                  onUpdateProject={handleUpdateProject}
                  projectApplications={projectApplications}
                  projectWorkspaces={projectWorkspaces}
                  onApplyForProject={handleApplyForProject}
                  onOpenWorkspace={async (projectId) => {
                    const project = projects.find((item) => item.id === projectId);
                    if (project && project.ownerId === currentUser?.id) {
                      await ensureProjectWorkspace(project);
                    }
                    setActiveWorkspaceId(projectId);
                  }}
                />
              );
            case "partners":
              return (
                <TalentHub
                  users={users}
                  highlightedUserIds={highlightedUserIds}
                  activeProjectForMatch={activeProjectForMatch}
                  isGoogleUser={isGoogleUser}
                  googleContacts={googleContacts}
                  onCreateMeetRoom={handleCreateMeetRoom}
                  studios={studios}
                  onCreateStudio={handleCreateStudio}
                  onUpdateStudio={handleUpdateStudio}
                  onDeleteStudio={handleDeleteStudio}
                  currentUser={currentUser}
                  connections={connections}
                  onSendConnectionRequest={handleSendConnectionRequest}
                  onRespondConnection={handleRespondConnection}
                  onCancelConnection={handleCancelConnection}
                  onRequestJoinStudio={handleRequestJoinStudio}
                  studioJoinRequests={studioJoinRequests}
                  pendingConnectionCount={pendingConnectionCount}
                />
              );
            case "gamejams":
              return <GameJamLobby currentUser={currentUser} />;
            case "bountymarket":
              return currentUser ? (
                <CoopMarket
                  currentUser={currentUser}
                  bounties={bountyTasks}
                  assets={exclusiveAssets}
                  onAddBounty={handleAddBounty}
                  onClaimBounty={handleClaimBounty}
                  onSubmitBountyReview={handleSubmitBountyReview}
                  onSolveBounty={handleSolveBounty}
                  onRejectBountyReview={handleRejectBountyReview}
                  onApplyArbitrationVerdict={handleApplyArbitrationVerdict}
                  onAddAsset={handleAddExclusiveAsset}
                  onBuyAsset={handleBuyExclusiveAsset}
                  userProjects={projects.filter(p => p.ownerId === currentUser.id)}
                  connections={connections}
                  pendingConnectionCount={pendingConnectionCount}
                />
              ) : (
                <div className="mx-auto max-w-4xl px-4 py-8 text-center text-slate-400">
                  Hãy đăng nhập để truy cập Nhiệm vụ Săn Bug & Chợ Asset Độc Bản.
                </div>
              );
            case "advisor":
              return (
                <div className="mx-auto max-w-3xl px-4 py-12 text-center">
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-8">
                    <Sparkles className="mx-auto h-8 w-8 text-amber-300" />
                    <h2 className="mt-4 text-lg font-black text-white">AI Pitch Advisor đang tạm khóa</h2>
                    <p className="mt-2 text-sm text-slate-400">Tính năng này sẽ được mở lại sau khi hoàn thiện phần ổn định và kiểm thử.</p>
                  </div>
                </div>
              );
            case "learnhub":
              return (
                <Suspense fallback={
                  <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                    <span className="font-mono text-xs text-slate-500">Đang khởi tạo Learn Hub...</span>
                  </div>
                }>
                  <LearnHubView
                    currentUser={currentUser}
                    onShowAuth={() => setActiveTab("profile")}
                  />
                </Suspense>
              );
            case "profile":
              return (
                <ProfileView
                  currentUser={currentUser}
                  users={users}
                  onUpdateProfile={handleUpdateProfile}
                  portfolioItems={portfolioItems}
                  onAddPortfolio={handleAddPortfolio}
                  onDeletePortfolio={handleDeletePortfolio}
                  connections={connections}
                  onSendConnectionRequest={handleSendConnectionRequest}
                  onRespondConnection={handleRespondConnection}
                  onCancelConnection={handleCancelConnection}
                  studioJoinRequests={studioJoinRequests}
                  onRespondStudioJoin={handleRespondStudioJoin}
                  pendingConnectionCount={pendingConnectionCount}
                  pendingStudioJoinCount={pendingStudioJoinCount}
                  studios={studios}
                  onCreateStudio={handleCreateStudio}
                  onUpdateStudio={handleUpdateStudio}
                  onDeleteStudio={handleDeleteStudio}
                  onRequestJoinStudio={handleRequestJoinStudio}
                  projects={projects}
                  projectApplications={projectApplications}
                  onRespondProjectApplication={handleRespondToProjectApplication}
                  showToast={showToast}
                />
              );
            default:
              return null;
          }
        })()}
      </Suspense>
    );
  };

  // Public routing for terms and privacy pages
  if (currentPath === "/terms" || currentPath === "/terms-of-service") {
    return (
      <>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <TermsPage onBackHome={() => navigateToPath("/")} />
      </>
    );
  }
  if (currentPath === "/privacy") {
    return (
      <>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <PrivacyPage onBackHome={() => navigateToPath("/")} />
      </>
    );
  }

  // Render Intro Video first if requested and not hidden/skipped permanently
  if (showIntroVideo) {
    return (
      <>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <IntroVideoOverlay onClose={() => {
          safeStorage.setItem("indiecollab_hide_intro", "true");
          setShowIntroVideo(false);
        }} />
      </>
    );
  }

  // Authentic loading screens
  if (isAuthChecking) {
    return (
      <>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
          <h3 className="font-mono text-sm uppercase tracking-wider text-indigo-400 font-bold">Đang khởi tạo kênh kết nối bảo mật...</h3>
          <p className="text-slate-500 text-xs">Phát hiện cấu hình kết nối bảo mật & thiết lập OAuth</p>
        </div>
      </>
    );
  }

  // FORCE AUTH LANDING & INTRODUCTION VIEW BEFORE PROCEEDING
  if (!currentUser) {
    return (
      <>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <AuthLanding 
          onLoginSuccess={handleAuthSuccess}
          onGuestLogin={handleGuestPresetLogin}
        />
      </>
    );
  }

  // Intercept profile onboarding if incomplete
  if (currentUser && !currentUser.profileComplete) {
    return (
      <>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <Onboarding
          currentUser={currentUser}
          onComplete={(updatedFields) => {
            handleUpdateProfile({
              ...updatedFields,
              profileComplete: true
            });
          }}
          onLogout={handleLogout}
        />
      </>
    );
  }

  const activeWorkspace = activeWorkspaceId
    ? projectWorkspaces.find((workspace) => workspace.id === activeWorkspaceId)
    : null;
  const activeWorkspaceProject = activeWorkspace
    ? projects.find((project) => project.id === activeWorkspace.id)
    : null;

  return (
    <div className="min-h-dvh overflow-x-hidden bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-96 w-96 rounded-full bg-pink-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col">
        {/* Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab !== "explore") setShowCreateForm(false);
          }}
          currentUser={currentUser}
          onLogout={handleLogout}
          pendingConnectionCount={pendingConnectionCount}
          pendingStudioJoinCount={pendingStudioJoinCount}
          unreadNotificationCount={unreadNotificationCount}
          setUnreadNotificationCount={setUnreadNotificationCount}
        />

        {/* Major app layouts */}
        <main className="min-h-0 flex-1">
          {isLoading ? (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4 animate-pulse">
              <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
              <p className="font-mono text-xs text-slate-500 uppercase tracking-widest">Đang đồng bộ hóa kho dữ liệu bảo mật...</p>
            </div>
          ) : fetchError ? (
            <div className="mx-auto mt-20 max-w-md rounded-2xl border border-red-500/25 bg-red-950/20 p-8 text-center shadow-2xl backdrop-blur-md">
              <ShieldAlert className="mx-auto h-12 w-12 text-red-400" />
              <h2 className="mt-4 text-sm font-bold text-red-200">Không thể kết nối cơ sở sảnh</h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{fetchError}</p>
              
              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={loadOfflineLocalData}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Sử dụng dữ liệu cục bộ (Ngoại tuyến)
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full border border-slate-800 hover:bg-slate-900 text-slate-300 rounded-xl py-2.5 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Thử tải lại trang
                </button>
              </div>

              <div className="mt-5 text-[10px] text-slate-500 font-mono">Đang kết nối dịch vụ dữ liệu bảo mật...</div>
            </div>
          ) : activeWorkspaceId ? (
            activeWorkspace && activeWorkspaceProject && currentUser ? (
              <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>}>
                <ProjectWorkspaceView
                  project={activeWorkspaceProject}
                  workspace={activeWorkspace}
                  currentUser={currentUser}
                  onBack={() => setActiveWorkspaceId(null)}
                  onUpdateWorkspace={handleUpdateWorkspace}
                />
              </Suspense>
            ) : (
              <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-xs font-mono">Đang đồng bộ workspace hoặc bạn chưa có quyền truy cập...</p>
                <button onClick={() => setActiveWorkspaceId(null)} className="rounded-xl border border-slate-800 px-4 py-2 text-xs text-slate-300">Quay lại</button>
              </div>
            )
          ) : (
            renderTabContent()
          )}
        </main>

        {/* Chat Panel */}
        <Suspense fallback={null}>
          <ChatPanel
            isOpen={chatOpen}
            onClose={handleCloseChat}
            currentUser={currentUser}
            otherUser={chatTargetUser}
            studioId={chatStudioId}
            studioName={chatStudioName}
          />
        </Suspense>

        {/* Floating Chat Button */}
        {!chatOpen && (
          <button
            onClick={() => handleOpenChat()}
            className="fixed bottom-20 right-4 z-40 h-12 w-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center transition-all hover:scale-110"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        )}

        {/* Footer */}
        <footer className="shrink-0 border-t border-slate-900 bg-slate-950/40 py-4 text-center text-xs text-slate-500">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-mono text-[10px] tracking-wider uppercase text-slate-600">
              © 2026 IndieCollab Corp. Được phát triển cùng Cloud & Workspace APIs.
            </span>
            <div className="flex items-center gap-4 font-mono text-[11px] text-slate-600">
              <a 
                href="/terms" 
                onClick={(e) => { e.preventDefault(); navigateToPath("/terms"); }} 
                className="hover:text-slate-400 transition"
              >
                Điều khoản dịch vụ
              </a>
              <span>•</span>
              <a 
                href="/privacy" 
                onClick={(e) => { e.preventDefault(); navigateToPath("/privacy"); }} 
                className="hover:text-slate-400 transition"
              >
                Chính sách bảo mật
              </a>
              <span>•</span>
              <a href="#" className="hover:text-slate-400 transition">Workspace Docs</a>
              <span>•</span>
              <button 
                onClick={() => setShowIntroVideo(true)}
                className="hover:text-indigo-400 transition cursor-pointer flex items-center gap-1 bg-transparent border-0 p-0 font-mono text-[11px]"
              >
                <Gamepad2 className="h-3.5 w-3.5" /> Xem lại Intro
              </button>
              <span>•</span>
              <span className="text-emerald-500 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Cloud Sync: OK
              </span>
            </div>
          </div>
        </footer>

        {/* Elegant Cosmic Cosmic Follower */}
        <div 
          ref={cursorRef}
          className="pointer-events-none fixed z-[9999] hidden md:block select-none opacity-0"
          style={{
            left: 0,
            top: 0,
            transition: "transform 0.08s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 0.2s ease",
            pointerEvents: "none"
          }}
        >
          {/* Elegant Glowing Ripple */}
          <div 
            className={`-translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-500/30 bg-indigo-500/5 transition-all duration-300 ease-out origin-center ${
              isHoveringClickable ? "h-11 w-11 border-indigo-400 bg-indigo-500/10 scale-110" : "h-6 w-6 scale-100"
            }`} 
            style={{ pointerEvents: "none" }}
          />
          {/* Center dot */}
          <div 
            className={`absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-indigo-400 transition-all duration-200 ${
              isHoveringClickable ? "bg-amber-400 scale-125" : ""
            }`} 
            style={{ pointerEvents: "none" }}
          />
        </div>

      </div>
    </div>
  );
}
