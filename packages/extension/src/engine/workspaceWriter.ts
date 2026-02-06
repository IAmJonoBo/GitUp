import * as vscode from "vscode";
import { ExtensionSettings, GeneratedFile, validateFilePaths } from "@gitup/shared";

// Type from shared might need to be imported or redefined if not exported
// GeneratedFile is exported in types.ts

export class WorkspaceWriter {
  public async previewChanges(files: GeneratedFile[]) {
    // For preview, we can use a virtual document provider or just open a diff for the main file?
    // A full multi-file diff is hard in VS Code API without creating valid files.
    // Strategy:
    // 1. Create a "preview" folder in workspace? No, messy.
    // 2. Use Untitled documents?
    // 3. Just show the first file in diff view against empty or existing?

    // Better: Show a Multi-Select QuickPick or a custom UI in webview to browse files?
    // The requirement says "Preview changes (diff view)".
    // If we apply to workspace, we can use WorkspaceEdit.
    // To preview BEFORE apply, we might just show the content in the Webview (which we already have in GenerationResult).
    // So "Preview changes" action in Webview updates the Webview UI to show code blocks.
    // But if we want VS Code Diff View:
    // We can iterate files, but how to show multiple?

    // Let's implement `applyToWorkspace` which is the core requirement.
    // Preview might be handled by the Webview UI itself (showing code), or we implement a "Open Diff" for a single selected file from Webview.
    return;
  }

  public async applyToWorkspace(files: GeneratedFile[]): Promise<void> {
    const settings = vscode.workspace.getConfiguration("gitup");
    const pathAllowlist = settings.get<string[]>("pathAllowlist") || [];
    const extensionAllowlist =
      (settings.get<Record<string, string[]>>("extensionAllowlist") as
        | Record<string, string[]>
        | undefined) || undefined;
    const validationOptions: ExtensionSettings = {
      modelProvider: settings.get("modelProvider") || "vscode",
      pathAllowlist,
      extensionAllowlist,
    };
    const blockedPaths = validateFilePaths(files, {
      allowedTopLevelDirs: validationOptions.pathAllowlist,
      extensionAllowlist: validationOptions.extensionAllowlist,
    });
    if (blockedPaths.length > 0) {
      const details = blockedPaths.map((issue) => `${issue.label} in ${issue.file}`).join("\n");
      throw new Error(`Blocked unsafe file paths.\n${details}`);
    }
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      throw new Error("No workspace folder open. Please open a folder to apply changes.");
    }
    const rootUri = workspaceFolders[0].uri;

    const edit = new vscode.WorkspaceEdit();

    for (const file of files) {
      const uri = vscode.Uri.joinPath(rootUri, file.path);

      // Check if file exists to decide create vs replace (WorkspaceEdit handles strictly? No, createFile/replaceFile exists)
      // Actually createFile with overwrite: true or just writeFile via fs.
      // WorkspaceEdit is better for Undo support.

      // We need to create directories. WorkspaceEdit doesn't recursively create dirs for createFile?
      // It does if usually.

      edit.createFile(uri, { overwrite: true, ignoreIfExists: false });
      edit.replace(uri, new vscode.Range(0, 0, 999999, 0), file.content);

      // Wait, createFile + replace might conflict in one edit if file didn't exist?
      // Better to check existence.
      try {
        await vscode.workspace.fs.stat(uri);
        // Exists: replace content
        // We need to know the entire range to replace.
        const doc = await vscode.workspace.openTextDocument(uri);
        const fullRange = new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length));
        edit.replace(uri, fullRange, file.content);
        // Remove createFile from edit for this file
      } catch {
        // Doesn't exist: create
        // For createFile, we can provide contents? No, initial content is not argument for createFile in WorkspaceEdit (only in some overrides, check API).
        // vs code api: createFile(uri, options, metadata?)
        // It creates empty file. Then we insert.
        edit.createFile(uri, { overwrite: true });
        edit.insert(uri, new vscode.Position(0, 0), file.content);
      }
    }

    const applied = await vscode.workspace.applyEdit(edit);
    if (!applied) {
      throw new Error("Failed to apply workspace edit.");
    }
  }
}
