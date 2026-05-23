import { useEffect, useState, useRef } from "react";
import { collection, doc, onSnapshot, setDoc, deleteDoc, query } from "firebase/firestore";
import { db } from "../firebase";
import { User, WorkspaceVoiceParticipant } from "../types";

export function useVoiceRoom(
  workspaceId: string,
  channelId: string | null,
  currentUser: User
) {
  const [participants, setParticipants] = useState<WorkspaceVoiceParticipant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!workspaceId || !channelId || !currentUser?.id) {
      setParticipants([]);
      return;
    }

    const participantRef = doc(
      db,
      "project_workspaces",
      workspaceId,
      "voice_rooms",
      channelId,
      "participants",
      currentUser.id
    );

    // Track speaking activities via Web Audio API
    let analyserInterval: any = null;

    const setupAudioAnalysis = (stream: MediaStream) => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        analyserInterval = setInterval(() => {
          if (!analyserRef.current || isMuted) {
            setIsSpeaking(false);
            return;
          }
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          const speaking = average > 15; // Threshold for speaking activity
          setIsSpeaking(speaking);
        }, 300);
      } catch (err) {
        console.warn("[VoiceRoom] Web Audio API failed:", err);
      }
    };

    // Join room and stream audio
    const joinVoice = async () => {
      setErrorMsg(null);
      try {
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setLocalStream(stream);
          localStreamRef.current = stream;
          // Setup audio analyzer
          setupAudioAnalysis(stream);
        } catch (mediaErr: any) {
          console.warn("[VoiceRoom] Microphone blocked or unavailable:", mediaErr);
          setErrorMsg("Không thể truy cập Microphone. Vui lòng mở quyền thiết bị hoặc mở Tab mới.");
        }

        // Register participant registration in Firestore
        await setDoc(participantRef, {
          userId: currentUser.id,
          userName: currentUser.displayName,
          userAvatar: currentUser.avatarUrl,
          joinedAt: new Date().toISOString(),
          muted: isMuted,
          deafened: isDeafened,
          speaking: false
        });
      } catch (err: any) {
        console.error("[VoiceRoom] Sync error:", err);
      }
    };

    joinVoice();

    // Listen to participant updates from Firestore
    const collRef = collection(
      db,
      "project_workspaces",
      workspaceId,
      "voice_rooms",
      channelId,
      "participants"
    );
    const unsubscribe = onSnapshot(query(collRef), (snapshot) => {
      const list = snapshot.docs.map(d => d.data() as WorkspaceVoiceParticipant);
      setParticipants(list);

      // Extract speaking map
      const speakers: Record<string, boolean> = {};
      snapshot.docs.forEach(d => {
        const data = d.data();
        if (data.speaking && !data.muted) {
          speakers[data.userId] = true;
        }
      });
      setActiveSpeakers(speakers);
    });

    // Sync active speak status to Firestore
    const intervalSpeaking = setInterval(() => {
      if (localStreamRef.current) {
        setDoc(participantRef, { speaking: isSpeaking && !isMuted }, { merge: true }).catch(() => {});
      }
    }, 400);

    return () => {
      clearInterval(analyserInterval);
      clearInterval(intervalSpeaking);
      unsubscribe();

      // Stop and clean up audio context & media streams
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        setLocalStream(null);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }

      // De-register participant cleanly
      deleteDoc(participantRef).catch(e => console.warn("[VoiceRoom] Clean up failed:", e));
    };
  }, [workspaceId, channelId, currentUser.id]);

  // Sync mute/deafen updates onto target documentation
  useEffect(() => {
    if (!workspaceId || !channelId || !currentUser?.id) return;
    const participantRef = doc(
      db,
      "project_workspaces",
      workspaceId,
      "voice_rooms",
      channelId,
      "participants",
      currentUser.id
    );

    setDoc(participantRef, { muted: isMuted, deafened: isDeafened }, { merge: true }).catch(() => {});

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted && !isDeafened;
      });
    }
  }, [isMuted, isDeafened]);

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const toggleDeafen = () => {
    setIsDeafened(prev => {
      const next = !prev;
      if (next) {
        setIsMuted(true);
      }
      return next;
    });
  };

  return {
    participants,
    localStream,
    isMuted,
    isDeafened,
    isSpeaking,
    activeSpeakers,
    errorMsg,
    toggleMute,
    toggleDeafen
  };
}
