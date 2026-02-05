import * as vscode from 'vscode';

export class LmClient {
  private model: vscode.LanguageModelChat | undefined;

  private async getModel(): Promise<vscode.LanguageModelChat> {
    if (this.model) {
      return this.model;
    }
    const models = await vscode.lm.selectChatModels({
      vendor: 'copilot',
      family: 'gpt-4'
    });

    // Fallback to any model if specific one not found
    if (models.length === 0) {
        const anyModels = await vscode.lm.selectChatModels({});
        if (anyModels.length > 0) {
            this.model = anyModels[0];
            return this.model;
        }
    }

    if (models.length > 0) {
      this.model = models[0];
      return this.model;
    }

    throw new Error("No language models available. Please ensure GitHub Copilot Chat is active.");
  }

  public async generateJson<T>(prompt: string, schemaHint: string): Promise<T> {
    const model = await this.getModel();

    // Construct a focused system-like prompt (passed as user message since role selection might be limited)
    const fullPrompt = `You are a strict JSON generator. Output ONLY valid JSON matching this schema description:
${schemaHint}

Do not include markdown formatting (like \`\`\`json). Return raw JSON only.

User Request: ${prompt}`;

    const messages = [
      vscode.LanguageModelChatMessage.User(fullPrompt)
    ];

    try {
      const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
      let text = '';
      for await (const fragment of response.text) {
        text += fragment;
      }

      // Cleanup code blocks if present
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      return JSON.parse(text) as T;
    } catch (err) {
      console.error("LM Generation failed:", err);
      // Simple repair attempt: ask model to fix it
      return this.repairJson<T>(prompt, schemaHint, String(err));
    }
  }

  private async repairJson<T>(originalPrompt: string, schemaHint: string, error: string): Promise<T> {
     const model = await this.getModel();
     const repairPrompt = `The previous JSON generation failed with error: ${error}.

Please output the JSON again for the request, correcting the syntax.
Schema: ${schemaHint}

Original Request: ${originalPrompt}`;

    const messages = [
        vscode.LanguageModelChatMessage.User(repairPrompt)
    ];

    const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
      let text = '';
      for await (const fragment of response.text) {
        text += fragment;
      }
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text) as T;
  }
}
