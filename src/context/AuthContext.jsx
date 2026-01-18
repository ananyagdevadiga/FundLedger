import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const signingOutRef = useRef(false);

  const fetchUserRole = async (userId) => {
    try {
      console.log("Fetching role for user:", userId);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      console.log("Role query result:", { data, error });

      if (error) {
        console.error("Error fetching role:", error);
        setRole("user");
        return;
      }

      setRole(data?.role || "user");
    } catch (err) {
      console.error("Role fetch error:", err);
      setRole("user");
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        console.log("Initializing auth...");
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
        }
        
        console.log("Session result:", session ? "Found user" : "No session");
        
        if (session?.user && isMounted) {
          setUser(session.user);
          await fetchUserRole(session.user.id);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log("Auth loading complete");
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth event:", event);
        
        if (!isMounted) return;
        
        if (event === "SIGNED_IN" && session?.user) {
          setUser(session.user);
          await fetchUserRole(session.user.id);
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
      console.log("Already signing out, skipping...");
      return;
    }
    
    signingOutRef.current = true;
    console.log("Signing out...");
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
      } else {
        console.log("Signed out successfully");
        setUser(null);
        setRole(null);
      }
    } catch (err) {
      console.error("Sign out exception:", err);
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
