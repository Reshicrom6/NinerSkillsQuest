const STORAGE_KEY = "niner-skills-quest.demo-session";
const SESSION_VALUE = "active";

type SessionStoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface DemoSessionState {
  signedIn: boolean;
  message: string | null;
}

type Listener = (state: DemoSessionState) => void;

export class DemoSessionStore {
  private readonly listeners = new Set<Listener>();
  private readonly storage: SessionStoragePort | null;
  private signedIn = false;
  private message: string | null = null;

  constructor(storage?: SessionStoragePort) {
    this.storage = storage === undefined ? this.getBrowserStorage() : storage;
    this.restoreSession();
  }

  getState(): DemoSessionState {
    return { signedIn: this.signedIn, message: this.message };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  startDemoSession(): void {
    if (!this.storage) {
      this.message = "This browser cannot start a persistent demo session. Try another browser.";
      this.notify();
      return;
    }

    try {
      this.storage.setItem(STORAGE_KEY, SESSION_VALUE);
      this.signedIn = true;
      this.message = null;
    } catch {
      this.message = "The demo session could not be saved in this browser. Try again.";
    }
    this.notify();
  }

  signOut(): void {
    try {
      this.storage?.removeItem(STORAGE_KEY);
      this.signedIn = false;
      this.message = null;
    } catch {
      this.message = "The demo session could not be cleared. Close this tab to end the session.";
    }
    this.notify();
  }

  private getBrowserStorage(): SessionStoragePort | null {
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }

  private restoreSession(): void {
    try {
      this.signedIn = this.storage?.getItem(STORAGE_KEY) === SESSION_VALUE;
    } catch {
      this.message = "The demo session could not be restored. Start a new local demo session.";
    }
  }

  private notify(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}

export const demoSessionStore = new DemoSessionStore();
