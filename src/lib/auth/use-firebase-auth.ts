import { useEffect, useState } from "react";
import { auth, onAuthStateChanged, type User } from "@/lib/firebase";

const GUEST_STORAGE_KEY = "gauntlet_guest_mode";

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(GUEST_STORAGE_KEY) === "true";
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      setUser(currentUser);
      if (currentUser) {
        setIsGuest(false);
        try {
          localStorage.removeItem(GUEST_STORAGE_KEY);
        } catch {
          // pass
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const setGuestMode = (enabled: boolean) => {
    setIsGuest(enabled);
    try {
      if (enabled) {
        localStorage.setItem(GUEST_STORAGE_KEY, "true");
      } else {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }
    } catch {
      // pass
    }
  };

  const clearGuestMode = () => {
    setGuestMode(false);
  };

  return { user, loading, isGuest, setGuestMode, clearGuestMode };
}
