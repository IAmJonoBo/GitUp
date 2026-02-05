import { LmClient } from './lmClient';
import { WizardState, validateScaffold, scanForDangerousContent, GenerationResponse } from '@repoforge/shared';

// Define result types locally if not exported from shared yet, or verify they are exported.
// Assuming GenerationResult is expected structure.

export class ScaffoldController {
  private lm: LmClient;

  constructor() {
    this.lm = new LmClient();
  }

  public async suggestStack(state: WizardState): Promise<string> {
    const prompt = `Analyze this project request:
Description: ${state.projectDetails.description}
Project Type: ${state.projectDetails.type}
Language: ${state.techStack.language}

Recommend a "best fit" tech stack (frameworks, databases, tools) and specific libraries.
Return a short paragraph (plain text) describing the recommendation.`;

    // For plain text, we bypass generateJson or use a text method.
    // But LmClient only has generateJson right now. Let's add generateText or just usage generateJson with valid keys.
    // Or just simple usage:

    // Quick hack for text:
    const schema = `JSON with a single key "suggestion" containing the text string.`;
    const res = await this.lm.generateJson<{suggestion: string}>(prompt, schema);
    return res.suggestion;
  }

  public async generateScaffold(state: WizardState): Promise<GenerationResponse> {
    // 1. Construct detailed prompt from state
    const prompt = `Generate a project scaffold for:
Name: ${state.projectDetails.name}
Type: ${state.projectDetails.type}
Language: ${state.techStack.language}
Description: ${state.projectDetails.description}
Frameworks: ${state.techStack.frameworks.join(', ')}
Features: ${JSON.stringify(state.automation)}

Return a list of files with paths and content.
`;

    const schema = `
{
  "files": [
    { "path": "string (relative)", "content": "string" }
  ]
}
`;

    // 2. Call LM
    let result = await this.lm.generateJson<{files: {path: string, content: string}[]}>(prompt, schema);

    // 3. Validate
    let issues = validateScaffold(result.files, state);
    let security = scanForDangerousContent(result.files);

    // 4. Repair if needed (max 2 loops)
    let attempts = 0;
    while ((issues.errors.length > 0 || security.blocked.length > 0) && attempts < 2) {
       attempts++;
       // Request repair
       const repairPrompt = `The generated scaffold has issues:
Errors: ${JSON.stringify(issues.errors)}
Security: ${JSON.stringify(security.blocked)}

Please regenerate the problematic files to fix these issues. Return ALL files including unchanged ones (concise).`;

       result = await this.lm.generateJson<{files: {path: string, content: string}[]}>(repairPrompt, schema);
       issues = validateScaffold(result.files, state);
       security = scanForDangerousContent(result.files);
    }

    return {
        files: result.files,
        validation: issues,
        security: security
    };
  }
}
