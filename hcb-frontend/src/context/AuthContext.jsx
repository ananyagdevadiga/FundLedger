import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const signingOutRef = useRef(false);

  const fetchUserRole = async (userId, isMounted) => {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      const fetchPromise = supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        // Ignore AbortError
        if (error.message?.includes('AbortError') || error.details?.includes('AbortError')) {
          return;
        }
        if (isMounted()) {
          setRole("user");
        }
        return;
      }

      if (isMounted()) {
        setRole(data?.role || "user");
      }
    } catch (err) {
      // Ignore AbortError, handle timeout
      if (err.name === 'AbortError' || err.message?.includes('AbortError')) {
        return;
      }
      // On timeout or other error, default to user role
      if (isMounted()) {
        setRole("user");
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    const checkMounted = () => isMounted;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Ignore AbortError
        if (error && !error.message?.includes('AbortError')) {
          console.error("Session error:", error);
        }
        
        if (session?.user && isMounted) {
          setUser(session.user);
          await fetchUserRole(session.user.id, checkMounted);
        }
      } catch (err) {
        // Ignore AbortError but still set loading to false
        console.error("Auth init error:", err);
      }
      
      // Always set loading to false after init completes
      if (isMounted) {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        if (event === "SIGNED_IN" && session?.user) {
          setUser(session.user);
          await fetchUserRole(session.user.id, checkMounted);
          setLoading(false);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setRole(null);
          setLoading(false);
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          setUser(session.user);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (signingOutRef.current) {
      return;
    }
    
    signingOutRef.current = true;
    
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        setUser(null);
        setRole(null);
      }
    } catch (err) {
      // Handle sign out error silently
    } finally {
      signingOutRef.current = false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
