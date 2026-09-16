"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

declare global {
  interface Window {
    chatwootSDK?: {
      run: (config: { websiteToken: string; baseUrl: string }) => void;
    };
    $chatwoot?: {
      setUser?: (identifier: string, attributes?: Record<string, unknown>) => void;
      reset?: () => void;
      toggle?: (action?: "open" | "close") => void;
    };
    fwayaOpenChatwoot?: () => void;
  }
}

const CHATWOOT_BASE_URL = "https://app.chatwoot.com";
const CHATWOOT_WEBSITE_TOKEN =
  process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN || "jzbTnuCWqwQ6zhgVWftUqTPg";

export default function ChatwootWidget() {
  const { user, firebaseUser } = useAuth();
  const openTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!CHATWOOT_WEBSITE_TOKEN) return;

    const loadChatwoot = () => {
      window.chatwootSDK?.run({
        websiteToken: CHATWOOT_WEBSITE_TOKEN,
        baseUrl: CHATWOOT_BASE_URL,
      });
      window.dispatchEvent(new Event("fwaya:chatwoot-ready"));
    };

    const existingScript = document.getElementById("chatwoot-sdk") as HTMLScriptElement | null;
    if (existingScript) {
      if (window.chatwootSDK) loadChatwoot();
      else existingScript.addEventListener("load", loadChatwoot, { once: true });
    } else {
      const script = document.createElement("script");
      script.id = "chatwoot-sdk";
      script.src = `${CHATWOOT_BASE_URL}/packs/js/sdk.js`;
      script.async = true;
      script.onload = loadChatwoot;
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const openChatwoot = () => {
      if (openTimeoutRef.current !== null) {
        window.clearTimeout(openTimeoutRef.current);
        openTimeoutRef.current = null;
      }

      if (window.$chatwoot?.toggle) {
        window.$chatwoot.toggle("open");
        return;
      }

      // The SDK script can load before Chatwoot creates its public API.
      openTimeoutRef.current = window.setTimeout(openChatwoot, 150);
    };

    window.fwayaOpenChatwoot = openChatwoot;
    window.addEventListener("fwaya:open-chatwoot", openChatwoot);
    window.addEventListener("fwaya:chatwoot-ready", openChatwoot);
    window.addEventListener("chatwoot:ready", openChatwoot);

    return () => {
      if (openTimeoutRef.current !== null) {
        window.clearTimeout(openTimeoutRef.current);
      }
      window.removeEventListener("fwaya:open-chatwoot", openChatwoot);
      window.removeEventListener("fwaya:chatwoot-ready", openChatwoot);
      window.removeEventListener("chatwoot:ready", openChatwoot);
      delete window.fwayaOpenChatwoot;
    };
  }, []);

  useEffect(() => {
    if (!window.$chatwoot) return;

    if (!user && !firebaseUser) {
      window.$chatwoot.reset?.();
      return;
    }

    const identifier = String(user?.id || firebaseUser?.uid || user?.email || "");
    if (!identifier) return;

    window.$chatwoot.setUser?.(identifier, {
      name: user?.displayName || user?.username || firebaseUser?.displayName || undefined,
      email: user?.email || firebaseUser?.email || undefined,
      avatar_url: user?.avatarUrl || firebaseUser?.photoURL || undefined,
      role: user?.role,
    });
  }, [firebaseUser, user]);

  return null;
}