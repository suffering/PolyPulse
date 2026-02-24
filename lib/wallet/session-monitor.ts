import { SESSION_TIMEOUT_MS, ACTIVITY_EVENTS } from "./constants";

export class SessionMonitor {
  private timeoutMs: number;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private onTimeout: (() => void) | null = null;
  private boundReset: () => void;

  constructor(timeoutMs: number = SESSION_TIMEOUT_MS) {
    this.timeoutMs = timeoutMs;
    this.boundReset = () => this.resetTimer();
  }

  start(onTimeout: () => void): void {
    if (typeof window === "undefined") return;
    this.onTimeout = onTimeout;
    this.resetTimer();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, this.boundReset, { passive: true });
    }
  }

  stop(): void {
    if (typeof window === "undefined") return;
    for (const event of ACTIVITY_EVENTS) {
      window.removeEventListener(event, this.boundReset);
    }
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.onTimeout = null;
  }

  resetTimer(): void {
    if (typeof window === "undefined") return;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
    }
    this.timerId = setTimeout(() => {
      this.timerId = null;
      this.onTimeout?.();
    }, this.timeoutMs);
  }
}

let sessionMonitorInstance: SessionMonitor | null = null;

export function getSessionMonitor(): SessionMonitor {
  if (!sessionMonitorInstance) {
    sessionMonitorInstance = new SessionMonitor();
  }
  return sessionMonitorInstance;
}
