import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "demo_session_id";

function getSaoPauloIso(): string {
  return new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).replace(" ", "T");
}

export function useDemoSession() {
  const sessionIdRef = useRef<string | null>(sessionStorage.getItem(SESSION_KEY));

  const startSession = useCallback(async () => {
    const { data, error } = await supabase
      .from("demo_sessions")
      .insert({ session_started_at: new Date().toISOString() })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Failed to create demo session:", error);
      return null;
    }

    sessionIdRef.current = data.id;
    sessionStorage.setItem(SESSION_KEY, data.id);
    return data.id;
  }, []);

  const track = useCallback(async (payload: Record<string, unknown>) => {
    let id = sessionIdRef.current;
    if (!id) {
      id = await startSession();
      if (!id) return;
    }

    const { error } = await supabase.rpc("update_demo_session", {
      _session_id: id,
      _data: payload as any,
    });

    if (error) {
      console.error("Failed to track demo event:", error);
    }
  }, [startSession]);

  const resetSession = useCallback(() => {
    sessionIdRef.current = null;
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  const getSessionId = useCallback(() => sessionIdRef.current, []);

  return { startSession, track, resetSession, getSessionId };
}
