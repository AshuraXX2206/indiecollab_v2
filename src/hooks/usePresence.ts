import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { User, WorkspacePresence } from "../types";

export function usePresence(
  workspaceId: string,
  currentUser: User,
  currentTab: string
) {
  const [presences, setPresences] = useState<WorkspacePresence[]>([]);

  useEffect(() => {
    if (!workspaceId || !currentUser?.id) return;

    // Presence reference under `/project_workspaces/{workspaceId}/presence/{userId}`
    const docRef = doc(db, "project_workspaces", workspaceId, "presence", currentUser.id);

    // Sync state to Firebase doc
    const writePresence = async (status: "online" | "away" | "busy" = "online") => {
      try {
        await setDoc(docRef, {
          userId: currentUser.id,
          userName: currentUser.displayName,
          userAvatar: currentUser.avatarUrl,
          status,
          currentTab,
          lastSeen: new Date().toISOString()
        });
      } catch (err) {
        console.warn("[Presence] Failed to write initial presence:", err);
      }
    };

    writePresence("online");

    // Handle visibility states (Away/Online transitions)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        writePresence("away");
      } else {
        writePresence("online");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Subscribe to all active presences in the workspace
    const collectionRef = collection(db, "project_workspaces", workspaceId, "presence");
    const unsubscribe = onSnapshot(
      query(collectionRef),
      (snapshot) => {
        const list = snapshot.docs.map(d => d.data() as WorkspacePresence);
        setPresences(list);
      },
      (err) => {
        console.warn("[Presence] Subscriptions error:", err);
      }
    );

    // Clean up on component unmount (disconnect / remove presence doc from Firestore)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      unsubscribe();
      // Optimistic delete on tab close or navigation away
      deleteDoc(docRef).catch(e => console.warn("[Presence] Clean up failed:", e));
    };
  }, [workspaceId, currentUser.id, currentTab]);

  return presences;
}
