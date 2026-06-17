import { useEffect, useRef } from "react";

/** Evita chiamate LLM troppo frequenti: rivalutazione API al cambio dati, max ~1 volta / 30 min. */
export const AI_API_COOLDOWN_MS = 30 * 60 * 1000;
export const AI_API_DEBOUNCE_MS = 2000;

/**
 * Avvia onRefresh al mount e quando il fingerprint cambia (dopo debounce + cooldown).
 * L'analisi locale va gestita separatamente e può restare istantanea.
 */
export function useAiApiAutoRefresh({
  enabled = true,
  dataReady = true,
  fingerprint = "",
  onRefresh,
  debounceMs = AI_API_DEBOUNCE_MS,
  cooldownMs = AI_API_COOLDOWN_MS,
}) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const lastFetchAtRef = useRef(0);
  const lastFingerprintRef = useRef(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !dataReady || !onRefreshRef.current) return;

    const fp = String(fingerprint);
    const isFirst = !hasFetchedRef.current;
    const fingerprintChanged =
      lastFingerprintRef.current !== null && lastFingerprintRef.current !== fp;
    const cooldownOk = Date.now() - lastFetchAtRef.current >= cooldownMs;

    if (!isFirst && (!fingerprintChanged || !cooldownOk)) {
      return;
    }

    const delay = isFirst ? 0 : debounceMs;
    const timer = setTimeout(() => {
      hasFetchedRef.current = true;
      lastFingerprintRef.current = fp;
      lastFetchAtRef.current = Date.now();
      onRefreshRef.current?.();
    }, delay);

    return () => clearTimeout(timer);
  }, [enabled, dataReady, fingerprint, debounceMs, cooldownMs]);

  useEffect(() => {
    if (!enabled) {
      hasFetchedRef.current = false;
      lastFingerprintRef.current = null;
      lastFetchAtRef.current = 0;
    }
  }, [enabled]);
}
