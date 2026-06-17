"use client";

import { useCallback, useRef } from "react";

const RUBRIC_BASE = "https://api.hellorubric.com";

export interface RubricToken {
  sessionid: string;
  societyID: string;
  unionSessionID: string | null;
}

// Makes Rubric API calls directly from the browser, preserving the session IP binding.
// CORS is access-control-allow-origin: * so direct calls work from any origin.
export function useRubricClient(societySlug: string) {
  const tokenRef = useRef<RubricToken | null>(null);

  const getToken = useCallback(async (): Promise<RubricToken> => {
    if (tokenRef.current) return tokenRef.current;
    const res = await fetch(`/api/societies/${societySlug}/rubric/token`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(body.error === "not_configured" ? "not_configured" : "Failed to load Rubric credentials");
    }
    const token = (await res.json()) as RubricToken;
    tokenRef.current = token;
    return token;
  }, [societySlug]);

  const rotateSession = useCallback(
    async (newSessionId: string) => {
      if (tokenRef.current) tokenRef.current.sessionid = newSessionId;
      await fetch(`/api/societies/${societySlug}/rubric/rotate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: newSessionId }),
      });
    },
    [societySlug]
  );

  const call = useCallback(
    async (payload: Record<string, unknown>): Promise<Record<string, unknown>> => {
      const token = await getToken();
      const body: Record<string, unknown> = {
        sessionid: token.sessionid,
        societyID: token.societyID,
        currentUrl: "https://portal.hellorubric.com/",
        device: "web_portal",
        version: 4,
        timestamp: Date.now(),
        ...(token.unionSessionID ? { unionSessionID: token.unionSessionID } : {}),
        ...payload,
      };

      const res = await fetch(`${RUBRIC_BASE}/${payload.type as string}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Rubric HTTP ${res.status}`);
      const data = (await res.json()) as Record<string, unknown>;

      if (data.rotating_session_ID) {
        await rotateSession(data.rotating_session_ID as string);
      }

      if (data.success === false) {
        throw new Error((data.usererror as string) ?? (data.error as string) ?? "Rubric error");
      }

      return data;
    },
    [getToken, rotateSession]
  );

  return { call, getToken };
}
