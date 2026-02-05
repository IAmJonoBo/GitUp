import { afterEach, describe, expect, it, vi } from "vitest";

type VsCodeApi = {
  postMessage: (msg: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
};

const setupBridge = async () => {
  vi.resetModules();

  const postMessage = vi.fn();
  const api: VsCodeApi = {
    postMessage,
    getState: vi.fn(),
    setState: vi.fn(),
  };

  (window as unknown as { acquireVsCodeApi: () => VsCodeApi }).acquireVsCodeApi = () => api;

  const module = await import("../src/transport/hostBridge");
  return { hostBridge: module.hostBridge, postMessage };
};

afterEach(() => {
  delete (window as unknown as { acquireVsCodeApi?: () => VsCodeApi }).acquireVsCodeApi;
});

describe("HostBridge", () => {
  it("resolves rpc responses", async () => {
    const { hostBridge, postMessage } = await setupBridge();

    const responsePromise = hostBridge.rpc<string, { hello: string }>("SUGGEST_STACK", {
      hello: "world",
    });

    const [message] = postMessage.mock.calls[0];
    const { id } = message as { id: string };

    window.dispatchEvent(
      new MessageEvent("message", {
        data: { id, ok: true, data: "ok" },
      }),
    );

    await expect(responsePromise).resolves.toBe("ok");
  });

  it("rejects rpc errors", async () => {
    const { hostBridge, postMessage } = await setupBridge();

    const responsePromise = hostBridge.rpc("GENERATE_SCAFFOLD", {
      project: "demo",
    });

    const [message] = postMessage.mock.calls[0];
    const { id } = message as { id: string };

    window.dispatchEvent(
      new MessageEvent("message", {
        data: { id, ok: false, error: "Boom" },
      }),
    );

    await expect(responsePromise).rejects.toThrow("Boom");
  });
});
