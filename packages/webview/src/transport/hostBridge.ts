
// Minimal types for the bridge
export type MessageType =
  | 'SUGGEST_STACK'
  | 'GENERATE_SCAFFOLD'
  | 'REPAIR_SCAFFOLD'
  | 'PREVIEW_APPLY'
  | 'APPLY_TO_WORKSPACE';

interface RpcMessage {
  id: string;
  type: MessageType;
  payload: any;
}

interface RpcResponse {
  id: string;
  ok: boolean;
  data?: any;
  error?: string;
}

// VS Code API declaration
declare global {
  interface Window {
    acquireVsCodeApi: () => {
      postMessage: (msg: any) => void;
      getState: () => any;
      setState: (state: any) => void;
    };
  }
}

class HostBridge {
  private vscode = window.acquireVsCodeApi ? window.acquireVsCodeApi() : null;
  private pending = new Map<string, { resolve: (data: any) => void; reject: (err: any) => void }>();

  constructor() {
    if (!this.vscode) {
      console.warn("VS Code API not available (running in browser?)");
    }
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent) {
    const message = event.data as RpcResponse;
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id)!;
      this.pending.delete(message.id);
      if (message.ok) {
        resolve(message.data);
      } else {
        reject(new Error(message.error || 'Unknown RPC error'));
      }
    }
    // Handle events (progress etc) here if needed
  }

  public async rpc(type: MessageType, payload: any): Promise<any> {
    if (!this.vscode) {
      throw new Error("Not running in VS Code");
    }
    const id = Math.random().toString(36).substring(7);
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.vscode!.postMessage({ id, type, payload });
    });
  }
}

export const hostBridge = new HostBridge();
