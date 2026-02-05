import * as vscode from "vscode";
import { GetNonce } from "../utils/nonce";
import { ScaffoldController } from "../engine/scaffoldController";
import { WorkspaceWriter } from "../engine/workspaceWriter";
import { GeneratedFile, Language, WizardState } from "@gitup/shared";

type WebviewMessage =
  | { id: string; type: "SUGGEST_STACK"; payload: WizardState }
  | { id: string; type: "GET_NODE_VERSION_INFO"; payload: { language: Language } }
  | { id: string; type: "GENERATE_SCAFFOLD"; payload: WizardState }
  | { id: string; type: "REPAIR_SCAFFOLD"; payload: WizardState }
  | { id: string; type: "PREVIEW_APPLY"; payload: GeneratedFile[] }
  | { id: string; type: "APPLY_TO_WORKSPACE"; payload: GeneratedFile[] };

const isWebviewMessage = (value: unknown): value is WebviewMessage => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { id?: unknown; type?: unknown };
  return typeof candidate.id === "string" && typeof candidate.type === "string";
};

export class GitUpPanel {
  public static currentPanel: GitUpPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _scaffoldController: ScaffoldController;
  private _workspaceWriter: WorkspaceWriter;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._scaffoldController = new ScaffoldController();
    this._workspaceWriter = new WorkspaceWriter();

    this._update();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      async (message: unknown) => {
        if (!isWebviewMessage(message)) {
          console.warn("Ignoring invalid webview message", message);
          return;
        }
        try {
          await this._handleMessage(message);
        } catch (error) {
          this._reply(message.id, false, undefined, String(error));
        }
      },
      null,
      this._disposables,
    );
  }

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor ? vscode.ViewColumn.Beside : undefined;

    if (GitUpPanel.currentPanel) {
      GitUpPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "gitup",
      "GitUp",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "dist"),
        ],
        retainContextWhenHidden: true,
      },
    );

    GitUpPanel.currentPanel = new GitUpPanel(panel, extensionUri);
  }

  public dispose() {
    GitUpPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "assets", "index.js"),
    );
    // const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'assets', 'index.css')); // Vite bundles css in js or separate file, need to check build output

    // In vite build, css might be separate. For now assuming typical vite output where it might be imported or separate.
    // If separate, we need to find it. But let's assume index.js loads it or we link it.
    // Actually vite usually outputs index.css if not inlined.
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "assets", "index.css"),
    );

    const nonce = GetNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https: data:;">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUri}" rel="stylesheet">
        <title>GitUp</title>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }

  private async _handleMessage(message: WebviewMessage) {
    console.log("Received message:", message);
    switch (message.type) {
      case "SUGGEST_STACK": {
        const suggestions = await this._scaffoldController.suggestStack(message.payload);
        this._reply(message.id, true, suggestions);
        break;
      }
      case "GET_NODE_VERSION_INFO": {
        const info = await this._scaffoldController.getNodeVersionInfo(message.payload.language);
        this._reply(message.id, true, info);
        break;
      }
      case "GENERATE_SCAFFOLD": {
        try {
          const scaffold = await this._scaffoldController.generateScaffold(message.payload);
          this._reply(message.id, true, scaffold);
        } catch (e) {
          this._reply(message.id, false, undefined, String(e));
        }
        break;
      }
      case "REPAIR_SCAFFOLD": {
        // Reuse generateScaffold but maybe with different hint?
        // For now, simpler to just map to generate (which does internal repair) or separate logic.
        break;
      }
      case "PREVIEW_APPLY": {
        // TODO: Implement preview (maybe open diffs? or just rely on webview showing content)
        break;
      }
      case "APPLY_TO_WORKSPACE": {
        try {
          await this._workspaceWriter.applyToWorkspace(message.payload);
          this._reply(message.id, true);
          vscode.window.showInformationMessage("Scaffold applied successfully!");
        } catch (e) {
          this._reply(message.id, false, undefined, String(e));
          vscode.window.showErrorMessage(`Apply failed: ${e}`);
        }
        break;
      }
      default:
        console.warn("Unknown message type");
    }
  }

  private _reply(id: string, ok: boolean, data?: unknown, error?: string) {
    this._panel.webview.postMessage({ id, ok, data, error });
  }
}
