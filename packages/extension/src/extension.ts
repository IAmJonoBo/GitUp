import * as vscode from 'vscode';
import { RepoForgePanel } from './webview/panel';

export function activate(context: vscode.ExtensionContext) {
  console.log('RepoForge is active');

  context.subscriptions.push(
    vscode.commands.registerCommand('repoforge.open', () => {
      RepoForgePanel.createOrShow(context.extensionUri);
    })
  );
}

export function deactivate() {}
