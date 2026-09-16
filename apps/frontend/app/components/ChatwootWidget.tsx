"use client";

import { useEffect } from "react";
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
  }
}

const CHATWOOT_BASE_URL = "https://app.chatwoot.com";
const CHATWOOT_WEBSITE_TOKEN =
  process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN || "jzbTnuCWqwQ6zhgVWftUqTPg";

export default function ChatwootWidget() {
  const { user, firebaseUser } = useAuth();

  useEffect(() => {
    if (!CHATWOOT_WEBSITE_TOKEN || document.getElementById("chatwoot-sdk")) return;

    const script = document.createElement("script");
    script.id = "chatwoot-sdk";
    script.src = `${CHATWOOT_BASE_URL}/packs/js/sdk.js`;
    script.async = true;
    script.onload = () => {
      window.chatwootSDK?.run({
        websiteToken: CHATWOOT_WEBSITE_TOKEN,
        baseUrl: CHATWOOT_BASE_URL,
      });
      window.dispatchEvent(new Event("fwaya:chatwoot-ready"));
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const openChatwoot = () => window.$chatwoot?.toggle?.("open");
    window.addEventListener("fwaya:open-chatwoot", openChatwoot);
    window.addEventListener("fwaya:chatwoot-ready", openChatwoot);

    return () => {
      window.removeEventListener("fwaya:open-chatwoot", openChatwoot);
      window.removeEventListener("fwaya:chatwoot-ready", openChatwoot);
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