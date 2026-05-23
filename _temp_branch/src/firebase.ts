import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  GithubAuthProvider, 
  signInAnonymously, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, dbId || undefined);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Configure Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/contacts.readonly");
googleProvider.addScope("https://www.googleapis.com/auth/meetings.space.created");
export const githubProvider = new GithubAuthProvider();

// Keep OAuth access token securely in-memory
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(firebaseUser, cachedAccessToken);
      } else if (!isSigningIn) {
        // Fallback or request fresh token if already signed in but cached token lost (e.g. on page refresh)
        // Set client state but they may need to click sign-in to renew token for live API calls
        if (onAuthSuccess) onAuthSuccess(firebaseUser, "");
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Google Auth");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    // Fallback to redirect if popup blocked or cross-origin failure
    if (
      error.code === "auth/popup-blocked" ||
      error.code === "auth/popup-closed-by-user" ||
      error.code === "auth/cancelled-popup-request" ||
      error.code === "auth/internal-error"
    ) {
      console.warn("Popup failed, falling back to redirect flow:", error.code);
      await signInWithRedirect(auth, googleProvider);
      return null; // Will be handled by getRedirectResult on next load
    }
    console.error("Firebase Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const githubSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, githubProvider);
    const credential = GithubAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || "";
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    // Fallback to redirect if popup blocked or cross-origin failure
    if (
      error.code === "auth/popup-blocked" ||
      error.code === "auth/popup-closed-by-user" ||
      error.code === "auth/cancelled-popup-request" ||
      error.code === "auth/internal-error"
    ) {
      console.warn("Popup failed, falling back to redirect flow:", error.code);
      await signInWithRedirect(auth, githubProvider);
      return null; // Will be handled by getRedirectResult on next load
    }
    console.error("Firebase GitHub Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const anonymousSignIn = async (): Promise<User> => {
  try {
    isSigningIn = true;
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error: any) {
    console.error("Firebase Anonymous Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Handle redirect result after page reload (fallback from popup)
export const checkRedirectResult = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // Try Google credential first, then GitHub
      const googleCred = GoogleAuthProvider.credentialFromResult(result);
      const githubCred = GithubAuthProvider.credentialFromResult(result);
      const credential = googleCred || githubCred;
      cachedAccessToken = credential?.accessToken || "";
      return { user: result.user, accessToken: cachedAccessToken };
    }
    return null;
  } catch (error: any) {
    console.error("Redirect result error:", error);
    return null;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};
