// Minimal types for the bridge
export type MessageType =
  | "SUGGEST_STACK"
  | "GET_NODE_VERSION_INFO"
  | "GENERATE_SCAFFOLD"
  | "REPAIR_SCAFFOLD"
  | "PREVIEW_APPLY"
  | "APPLY_TO_WORKSPACE";

interface RpcResponse {
  id: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}

// VS Code API declaration
declare global {
  interface Window {
    acquireVsCodeApi: () => {
      postMessage: (msg: unknown) => void;
      getState: () => unknown;
      setState: (state: unknown) => void;
    };
  }
}

class HostBridge {
  private vscode = window.acquireVsCodeApi ? window.acquireVsCodeApi() : null;
  private pending = new Map<
    string,
    { resolve: (data: unknown) => void; reject: (err: Error) => void }
  >();

  constructor() {
    if (!this.vscode) {
      console.warn("VS Code API not available (running in browser?)");
    }
    window.addEventListener("message", this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent<RpcResponse>) {
    const message = event.data;
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id)!;
      this.pending.delete(message.id);
      if (message.ok) {
        resolve(message.data);
      } else {
        reject(new Error(message.error || "Unknown RPC error"));
      }
    }
    // Handle events (progress etc) here if needed
  }

  public async rpc<TResponse = unknown, TPayload = unknown>(
    type: MessageType,
    payload: TPayload,
  ): Promise<TResponse> {
    if (!this.vscode) {
      throw new Error("Not running in VS Code");
    }
    const id = Math.random().toString(36).substring(7);
    return new Promise<TResponse>((resolve, reject) => {
      this.pending.set(id, {
        resolve: (data) => resolve(data as TResponse),
        reject,
      });
      this.vscode!.postMessage({ id, type, payload });
    });
  }
}

export const hostBridge = new HostBridge();
