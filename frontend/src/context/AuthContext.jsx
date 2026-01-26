import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState(null);
  const signingOutRef = useRef(false);

  const fetchUserRole = async (userId, isMounted, maxRetries = 1, timeoutMs = 3000) => {
    console.debug('[Auth] fetchUserRole start', { userId });
    if (!userId) return;

    // Try to read cached role first
    const ROLE_CACHE_KEY = (id) => `hcb-role-${id}`;
    const ROLE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

    const cachedInfo = (() => {
      try {
        const raw = localStorage.getItem(ROLE_CACHE_KEY(userId));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed) return null;
        if (parsed.ts && (Date.now() - parsed.ts) > ROLE_CACHE_TTL) return null;
        return parsed;
      } catch (e) {
        return null;
      }
    })();

    const hasValidCache = !!(cachedInfo && (cachedInfo.role !== undefined));

    // If we have cached role, use it immediately and revalidate in background (non-blocking)
    if (hasValidCache && isMounted()) {
      setRole(cachedInfo.role);
    }

    // If no cache, mark roleLoading to block only the initial load
    if (!hasValidCache && isMounted()) setRoleLoading(true);

    const doFetch = async (attemptAllowed = maxRetries, isBackground = hasValidCache) => {
      let attempt = 0;
      while (attempt <= attemptAllowed && isMounted()) {
        try {
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs));

          const fetchPromise = supabase
            .from("profiles")
            .select("role, name")
            .eq("id", userId)
            .single();

          const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

          if (error) {
            // Ignore AbortError
            if (error.message?.includes('AbortError') || error.details?.includes('AbortError')) {
              return;
            }

            // Bail fast on client errors (400-499)
            if (error.status >= 400 && error.status < 500) {
              console.warn('[Auth] fetchUserRole client error (no retry)', { status: error.status, message: error.message });
              if (isMounted() && !hasValidCache) {
                setRole(null);
                setRoleError(error?.message || 'Client error fetching role');
              }
              return;
            }

            // Timeout - retry silently up to attemptAllowed
            if (error.message === 'Timeout') {
              if (attempt < attemptAllowed) {
                attempt += 1;
                await new Promise(r => setTimeout(r, 250));
                continue;
              }
              if (isMounted() && !hasValidCache) {
                setRole(null);
                setRoleError('Timeout while fetching role');
              }
              return;
            }

            console.warn('[Auth] fetchUserRole error, attempt', attempt, error);
            console.error('[Auth] fetchUserRole error details', { message: error?.message, details: error?.details, hint: error?.hint, status: error?.status });
            if (attempt < attemptAllowed) {
              attempt += 1;
              await new Promise(r => setTimeout(r, 250));
              continue;
            }

            if (isMounted() && !hasValidCache) {
              setRole(null);
              setRoleError(error?.message || JSON.stringify(error || 'Unknown error'));
            }
            return;
          }

          if (isMounted()) {
            console.debug('[Auth] fetchUserRole success', { role: data?.role, name: data?.name });
            setRole(data?.role ?? null);
            setProfile({ name: data?.name ?? null });
            setRoleError(null);
            try {
              localStorage.setItem(ROLE_CACHE_KEY(userId), JSON.stringify({ role: data?.role ?? null, ts: Date.now() }));
            } catch (e) {}
          }
          break;
        } catch (err) {
          if (err.name === 'AbortError' || err.message?.includes('AbortError')) {
            return;
          }

          if (err.message === 'Timeout') {
            if (attempt < attemptAllowed) {
              attempt += 1;
              await new Promise(r => setTimeout(r, 250));
              continue;
            }
            if (isMounted() && !hasValidCache) {
              setRole(null);
              setRoleError('Timeout while fetching role');
            }
            break;
          }

          console.warn('[Auth] fetchUserRole unexpected error, attempt', attempt, err);
          console.error('[Auth] fetchUserRole unexpected error details', { message: err?.message, stack: err?.stack });
          if (attempt < attemptAllowed) {
            attempt += 1;
            await new Promise(r => setTimeout(r, 250));
            continue;
          }
          if (isMounted() && !hasValidCache) {
            setRole(null);
          }
          break;
        }
      }

      if (isMounted() && !hasValidCache) setRoleLoading(false);
    };

    // If we had cache, run background revalidation without blocking UI
    if (hasValidCache) {
      doFetch(maxRetries, true).catch(() => {});
    } else {
      // No cache -> perform fetch immediately and block until complete
      await doFetch(maxRetries, false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const checkMounted = () => isMounted;

    const initAuth = async () => {
      console.debug('[Auth] initAuth starting');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.debug('[Auth] getSession result', { session, error });
        
        // Ignore AbortError
        if (error && !error.message?.includes('AbortError')) {
          console.error("Session error:", error);
        }
        
        if (session?.user && isMounted) {
          setUser(session.user);
          // Ensure profile exists (upsert if needed using cached signup name)
          try {
            const cachedName = localStorage.getItem('hcb-signup-name') || null;
            if (cachedName) {
              await supabase.from('profiles').upsert([{ id: session.user.id, name: cachedName, email: session.user.email }]);
            }
          } catch (e) {
            // ignore
          }
          await fetchUserRole(session.user.id, checkMounted);
        }
      } catch (err) {
        // Ignore AbortError but still set loading to false
        console.error("Auth init error:", err);
      }
      
      // Always set loading to false after init completes
      if (isMounted) {
        setLoading(false);
        console.debug('[Auth] initAuth completed - loading=false');
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
            if (event === "SIGNED_IN" && session?.user) {
          setUser(session.user);
          // on sign in, ensure profile exists (fallback to cached name)
          try {
            const cachedName = localStorage.getItem('hcb-signup-name') || null;
            if (cachedName) {
              await supabase.from('profiles').upsert([{ id: session.user.id, name: cachedName, email: session.user.email }]);
            }
          } catch (e) {}
          await fetchUserRole(session.user.id, checkMounted);
          setLoading(false);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setRole(null);
          setProfile(null);
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
        setProfile(null);
      }
    } catch (err) {
      // Handle sign out error silently
    } finally {
      signingOutRef.current = false;
    }
  };


  return (
    <AuthContext.Provider value={{ user, role, profile, loading, roleLoading, roleError, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
