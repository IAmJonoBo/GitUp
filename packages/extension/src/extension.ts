import * as vscode from "vscode";
import { GitUpPanel } from "./webview/panel";

export function activate(context: vscode.ExtensionContext) {
  console.log("GitUp is active");

  context.subscriptions.push(
    vscode.commands.registerCommand("gitup.open", () => {
      GitUpPanel.createOrShow(context.extensionUri);
    }),
  );
}

export function deactivate() {}
