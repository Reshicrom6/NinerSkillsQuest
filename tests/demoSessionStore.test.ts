import { describe, expect, it } from "vitest";
import { DemoSessionStore } from "../src/state/demoSessionStore";

function createStorage(initialValue: string | null = null) {
  const values = new Map<string, string>();
  if (initialValue !== null) {
    values.set("niner-skills-quest.demo-session", initialValue);
  }
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("demo session state", () => {
  it("starts unsigned in and restores a valid local session", () => {
    expect(new DemoSessionStore(createStorage()).getState().signedIn).toBe(false);
    expect(new DemoSessionStore(createStorage("active")).getState().signedIn).toBe(true);
  });

  it("starts and ends a clearly local demo session", () => {
    const storage = createStorage();
    const store = new DemoSessionStore(storage);

    store.startDemoSession();
    expect(store.getState()).toEqual({ signedIn: true, message: null });

    store.signOut();
    expect(store.getState()).toEqual({ signedIn: false, message: null });
    expect(storage.getItem("niner-skills-quest.demo-session")).toBeNull();
  });

  it("reports storage failures without claiming a session started or ended", () => {
    const unavailableStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    const store = new DemoSessionStore(unavailableStorage);

    store.startDemoSession();
    expect(store.getState().signedIn).toBe(false);
    expect(store.getState().message).toMatch(/could not be saved/i);
  });

  it("keeps the session active and reports failure when sign-out cannot clear storage", () => {
    const storage = {
      getItem: () => "active",
      setItem: () => undefined,
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    const store = new DemoSessionStore(storage);

    store.signOut();

    expect(store.getState().signedIn).toBe(true);
    expect(store.getState().message).toMatch(/could not be cleared/i);
  });

  it("does not restore an unknown stored value", () => {
    expect(new DemoSessionStore(createStorage("invalid")).getState().signedIn).toBe(false);
  });
});
