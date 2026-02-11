import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Package, Box, Copy, SquareArrowOutUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TreeNode, PlanConfig, RepoStructure } from '../../types';
import { useStore } from '../../store';
import { Card } from '../ui/primitives';
import { FileIcon, FolderIcon } from '../ui/FileIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/primitives';

const generateContent = (node: TreeNode, config: PlanConfig): string => {
  if (node.type === 'folder') {
      const children = node.children || [];
      if (children.length === 0) return '(empty)';
      const header = 'Permissions  User  Group  Size  Date         Name\n' + '-'.repeat(60);
      const rows = children.map(c => {
          const perm = c.type === 'folder' ? 'drwxr-xr-x' : '-rw-r--r--';
          const size = c.type === 'folder' ? '   -' : (Math.floor(Math.random() * 500) + 50).toString().padStart(4);
          const date = 'Jan 1 00:00';
          return `${perm}  user  staff  ${size}  ${date}  ${c.name}`;
      }).join('\n');
      return `${header}\n${rows}`;
  }

  const name = node.name;
  const isPinned = config.stack.dependencyStrategy === 'pinned';

  if (name === 'package.json') {
      const builder = config.stack.builder;
      const scripts: Record<string, string> = {
          dev: "next dev",
          build: "next build",
          start: "next start",
      };

      if (config.stack.language === 'TypeScript') {
          if (builder === 'Vite') {
              scripts.dev = "vite";
              scripts.build = "vite build";
              scripts.preview = "vite preview";
          } else if (builder === 'Webpack') {
              scripts.build = "webpack --mode production";
              scripts.dev = "webpack serve --mode development";
          } else if (builder === 'Esbuild') {
              scripts.build = "esbuild src/index.ts --bundle --outfile=dist/index.js";
          } else if (builder === 'Tsc') {
              scripts.build = "tsc";
              scripts.dev = "tsc -w";
          }
      }
      
      if (config.quality.linter === 'ESLint') scripts.lint = "eslint .";
      if (config.quality.formatter === 'Prettier') scripts.format = "prettier --write .";
      if (config.quality.testing) scripts.test = config.quality.testFramework === 'Vitest' ? "vitest" : "jest";
      if (config.quality.qualityPlatform === 'Trunk.io') scripts['trunk:check'] = "trunk check";

      // Version Strategy Logic
      const v = (ver: string) => isPinned ? ver : `^${ver}`;

      const devDependencies: Record<string, string> = {
          "typescript": v("5.0.0"),
          "@types/react": v("18.2.0"),
          ...(config.quality.testing ? { [config.quality.testFramework.toLowerCase()]: "latest" } : {})
      };

      if (builder === 'Vite') devDependencies['vite'] = v('5.0.0');
      if (builder === 'Webpack') {
          devDependencies['webpack'] = v('5.88.0');
          devDependencies['webpack-cli'] = v('5.1.0');
          devDependencies['ts-loader'] = v('9.4.0');
      }
      if (builder === 'Esbuild') devDependencies['esbuild'] = v('0.19.0');
      if (builder === 'Rollup') devDependencies['rollup'] = v('4.0.0');

      // engines field
      const engines: Record<string, string> = {
        node: config.stack.languageVersion ? `>=${config.stack.languageVersion}` : ">=18.0.0"
      };

      return JSON.stringify({
          name: config.projectName,
          version: "0.1.0",
          private: config.visibility === 'private',
          type: "module",
          engines,
          scripts,
          dependencies: {
              "react": v("18.2.0"),
              "react-dom": v("18.2.0"),
              "next": isPinned ? "14.1.0" : "^14.1.0"
          },
          devDependencies
      }, null, 2);
  }

  if (name === 'nx.json') {
      return JSON.stringify({
          "tasksRunnerOptions": {
              "default": {
                  "runner": "nx/tasks-runners/default",
                  "options": {
                      "cacheableOperations": ["build", "lint", "test", "e2e"]
                  }
              }
          },
          "targetDefaults": {
              "build": {
                  "dependsOn": ["^build"]
              }
          }
      }, null, 2);
  }

  if (name === 'turbo.json') {
      return JSON.stringify({
          "$schema": "https://turbo.build/schema.json",
          "pipeline": {
              "build": {
                  "dependsOn": ["^build"],
                  "outputs": ["dist/**", ".next/**"]
              },
              "lint": {},
              "test": {},
              "dev": {
                  "cache": false,
                  "persistent": true
              }
          }
      }, null, 2);
  }

  if (name === 'Pipfile') {
      return `[[source]]
url = "https://pypi.org/simple"
verify_ssl = true
name = "pypi"

[packages]
${config.stack.framework === 'FastAPI' ? (isPinned ? 'fastapi = "0.109.0"\nuvicorn = "0.27.0"' : 'fastapi = "*"\nuvicorn = "*"') : ''}
${config.stack.framework === 'Django' ? (isPinned ? 'django = "5.0.1"' : 'django = "*"') : ''}
${config.stack.framework === 'Flask' ? (isPinned ? 'flask = "3.0.0"' : 'flask = "*"') : ''}

[dev-packages]
${config.quality.testing ? 'pytest = "*"' : ''}

[requires]
python_version = "${config.stack.languageVersion || '3.10'}"`;
  }

  if (name === 'requirements.txt') {
      const op = isPinned ? '==' : '>=';
      let content = `# Generated by Bootstrapper\n`;
      if (config.stack.framework === 'FastAPI') content += `fastapi${op}0.109.0\nuvicorn${op}0.27.0\n`;
      if (config.stack.framework === 'Django') content += `django${op}5.0.1\n`;
      if (config.stack.framework === 'Flask') content += `flask${op}3.0.0\n`;
      if (config.quality.testing) content += `pytest${op}8.0.0\n`;
      return content;
  }

  if (name === 'go.mod') {
      return `module github.com/user/${config.projectName}

go ${config.stack.languageVersion || '1.21'}

require (
    ${config.stack.framework === 'Gin' ? 'github.com/gin-gonic/gin v1.9.1' : ''}
    ${config.stack.framework === 'Fiber' ? 'github.com/gofiber/fiber/v2 v2.52.0' : ''}
    ${config.stack.framework === 'Echo' ? 'github.com/labstack/echo/v4 v4.11.4' : ''}
)`;
  }

  if (name === 'vite.config.ts') {
      return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  }
})`;
  }

  if (name === 'webpack.config.js') {
      return `const path = require('path');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};`;
  }

  if (name === 'pom.xml') {
      return `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
 
  <groupId>com.example</groupId>
  <artifactId>${config.projectName}</artifactId>
  <version>1.0-SNAPSHOT</version>
 
  <properties>
    <maven.compiler.source>${config.stack.languageVersion || '17'}</maven.compiler.source>
    <maven.compiler.target>${config.stack.languageVersion || '17'}</maven.compiler.target>
  </properties>

  <dependencies>
      <!-- Spring Boot -->
      <dependency>
          <groupId>org.springframework.boot</groupId>
          <artifactId>spring-boot-starter-web</artifactId>
      </dependency>
      ${config.quality.testing ? `<!-- JUnit -->
      <dependency>
          <groupId>org.junit.jupiter</groupId>
          <artifactId>junit-jupiter-api</artifactId>
          <scope>test</scope>
      </dependency>` : ''}
  </dependencies>
</project>`;
  }

  if (name === 'Gemfile') {
      const op = isPinned ? '' : '~> ';
      return `source 'https://rubygems.org'

ruby '${config.stack.languageVersion || '3.2.0'}'

gem 'rails', '${op}7.1.0'
gem 'sqlite3', '${op}1.4'

group :development, :test do
  gem 'debug', platforms: %i[ mri mingw x64_mingw ]
  ${config.quality.testing ? `gem 'rspec-rails', '${op}6.0'` : ''}
end

group :development do
  gem 'web-console'
end`;
  }
  
  if (name === 'README.md') {
      const secretsSection = config.github.secrets.length > 0 ? `\n\n## Secrets\nThe following secrets are required in your repo settings:\n${config.github.secrets.map(s => `- \`${s}\``).join('\n')}` : '';

      return `# ${config.projectName}

${config.basics.description}

## Architecture
This project uses the **${config.architecture}** pattern.

## Getting Started

Run the development server:

\`\`\`bash
${config.stack.packageManager} run dev
\`\`\`

## Tech Stack

- **Framework**: ${config.stack.framework || 'Next.js'}
- **Builder**: ${config.stack.builder}
- **Language**: ${config.stack.language} ${config.stack.languageVersion ? `(v${config.stack.languageVersion})` : ''}
- **CI**: ${config.ci.runTests ? 'GitHub Actions' : 'None'}${secretsSection}
`;
  }

  if (name === 'CONTRIBUTING.md') {
      let content = `# Contributing to ${config.projectName}\n\n`;
      content += `1. Fork the repo\n2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)\n3. Commit your changes (\`git commit -m 'feat: add some feature'\`)\n4. Push to the branch (\`git push origin feature/amazing-feature\`)\n5. Open a Pull Request\n`;
      
      if (config.docs.styleGuide !== 'none') {
          content += `\n## Documentation Style\nWe follow the **${config.docs.styleGuide}** style guide. Please ensure your docs adhere to these standards.\n`;
      }
      return content;
  }

  if (name === 'mkdocs.yml') {
      return `site_name: ${config.projectName}
theme:
  name: material`;
  }

  if (name === 'docusaurus.config.js') {
      return `module.exports = {
  title: '${config.projectName}',
  tagline: '${config.basics.description}',
  url: 'https://your-docusaurus-test-site.com',
  baseUrl: '/',
  // ...
};`;
  }

  if (name === 'deploy-docs.yml') {
      return `name: Deploy Docs
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and Deploy
        uses: ${config.docs.framework === 'vitepress' ? 'vuejs/vitepress-action@v1' : '...'}
`;
  }

  if (name === 'pull_request_template.md') {
      return `## Description
Please include a summary of the change and which issue is fixed.

## Type of change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change

## Checklist:
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have added tests
`;
  }

  if (name === 'ci.yml') {
      return `name: CI
on: [push, pull_request]

${config.github.actions.runners === 'self-hosted' ? '# Using Self-Hosted Runners' : ''}
jobs:
  build:
    runs-on: ${config.github.actions.runners === 'self-hosted' ? 'self-hosted' : 'ubuntu-latest'}
    steps:
      - uses: actions/checkout@v4
${config.stack.language === 'TypeScript' ? `      - uses: actions/setup-node@v4
        with:
          node-version: ${config.stack.languageVersion || '20'}
      - run: ${config.stack.packageManager} install
      - run: ${config.stack.packageManager} run test` : ''}
${config.stack.language === 'Java' ? `      - uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '${config.stack.languageVersion || '17'}'
      - run: mvn verify` : ''}
${config.stack.language === 'Ruby' ? `      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: '${config.stack.languageVersion || '3.2'}'
      - run: bundle install
      - run: bundle exec rake` : ''}
`;
  }
  
  if (name === 'settings.yml') {
      return `repository:
  # See https://github.com/probot/settings
  name: ${config.projectName}
  description: ${config.basics.description}
  default_branch: ${config.github.branches.default}
  
  topics: ${JSON.stringify(config.github.topics)}

  # Features
  has_issues: ${config.github.features.issues}
  has_projects: ${config.github.features.projects}
  has_wiki: ${config.github.features.wiki}
  has_discussions: ${config.github.features.discussions}
  
  # Merging
  allow_merge_commit: ${config.github.pr.allowMergeCommit}
  allow_squash_merge: ${config.github.pr.allowSquashMerge}
  allow_rebase_merge: ${config.github.pr.allowRebaseMerge}
  delete_branch_on_merge: ${config.github.pr.deleteBranchOnMerge}

# Rulesets (replacing classic branch protection)
rulesets:
  - name: Default Branch Protection
    target: branch
    enforcement: active
    conditions:
      ref_name:
        include:
          - refs/heads/${config.github.branches.default}
    rules:
      required_linear_history: ${config.github.branches.protection.requireLinearHistory}
      required_signatures: ${config.github.branches.protection.requireSignedCommits}
      pull_request:
        required_approving_review_count: ${config.github.branches.protection.requiredReviewers}
        dismiss_stale_reviews_on_push: true
        require_code_owner_review: ${config.github.branches.protection.requireCodeOwners}

# Webhooks
webhooks:
${config.github.webhooks.map(w => `  - url: ${w.url}\n    content_type: ${w.contentType}\n    events: ${JSON.stringify(w.events)}`).join('\n')}

environments:
${config.github.environments.map(e => `  - name: ${e}\n    deployment_branch_policy:\n      protected_branches: true\n      custom_branch_policies: false`).join('\n')}
`;
  }

  if (name === 'CODEOWNERS') return `* @${config.projectName}/team`;
  
  if (name === '.gitignore') {
    let content = `node_modules\ncoverage\n`;
    const builder = config.stack.builder;
    
    if (builder === 'Vite' || builder === 'Webpack' || builder === 'Esbuild' || builder === 'Rollup') {
        content += 'dist/\n';
    } else {
        content += '.next\nout\n';
    }

    if (config.stack.language === 'Java') content += 'target/\n';
    if (config.stack.language === 'Go') content += 'bin/\n';

    if (config.security.manageEnv) {
        content += '\n.env\n.env.local\n.env.*.local';
    }
    return content;
  }
  
  if (name === '.env.example') {
      return `# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=${config.projectName}

# API Keys (Mock)
STRIPE_SECRET_KEY=sk_test_...
AWS_ACCESS_KEY_ID=...
`;
  }

  return `// ${name}\n// This file is auto-generated based on your configuration.`;
};

const TreeItem = ({ node, depth = 0, onSelect, selectedPath, path = '' }: { node: TreeNode, depth?: number, onSelect: (n: TreeNode & { path: string }) => void, selectedPath: string | null, path?: string }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const currentPath = `${path}/${node.name}`;
    const isSelected = selectedPath === currentPath;

    if (node.type === 'folder') {
        return (
            <div>
                <div 
                    className={cn(
                        "flex items-center gap-1.5 py-1 px-2 hover:bg-white/5 cursor-pointer transition-colors select-none group relative pr-8",
                        isSelected ? "bg-primary/10 text-primary border-l-2 border-primary -ml-[2px]" : "text-muted-foreground hover:text-foreground pl-2"
                    )}
                    style={{ paddingLeft: isSelected ? `${depth * 12 + 8}px` : `${depth * 12 + 8}px` }}
                    onClick={() => onSelect({ ...node, path: currentPath })}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <span 
                        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                        className="p-0.5 hover:bg-white/10 rounded transition-colors"
                    >
                        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </span>
                    <FolderIcon name={node.name} isOpen={isOpen} className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{node.name}</span>

                    {/* Open in VS Code Button (Folder) */}
                     <div 
                        className={cn(
                            "absolute right-2 opacity-0 transition-opacity flex items-center bg-card shadow-sm rounded-sm z-10",
                            isHovered ? "opacity-100" : "opacity-0"
                        )}
                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button 
                                    className="p-1 hover:bg-accent rounded-sm text-blue-400"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect({ ...node, path: currentPath });
                                    }}
                                >
                                    <SquareArrowOutUpRight className="w-3 h-3" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="left">Open Folder in VS Code</TooltipContent>
                        </Tooltip>
                    </div>
                </div>
                <AnimatePresence>
                    {isOpen && node.children && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            {node.children.map((child) => (
                                <TreeItem key={child.name} node={child} depth={depth + 1} onSelect={onSelect} selectedPath={selectedPath} path={currentPath} />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div 
            className={cn(
                "flex items-center gap-2 py-1 px-2 cursor-pointer transition-colors border-l-2 ml-[1px] group relative pr-8",
                isSelected ? "bg-primary/10 text-primary border-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5 border-transparent"
            )}
            style={{ paddingLeft: `${depth * 12 + 19}px` }}
            onClick={() => onSelect({ ...node, path: currentPath })}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <FileIcon name={node.name} />
            <span className="text-xs font-mono truncate">{node.name}</span>

            {/* Open in VS Code Button (File) */}
            <div 
                className={cn(
                    "absolute right-2 opacity-0 transition-opacity flex items-center bg-card shadow-sm rounded-sm z-10",
                    isHovered ? "opacity-100" : "opacity-0"
                )}
            >
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button 
                            className="p-1 hover:bg-accent rounded-sm text-blue-400"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect({ ...node, path: currentPath });
                            }}
                        >
                            <SquareArrowOutUpRight className="w-3 h-3" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Open in VS Code</TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
};

export const RepoTree = () => {
    const config = useStore(state => state.config);
    const [selectedFile, setSelectedFile] = useState<TreeNode | null>(null);
    const [selectedPath, setSelectedPath] = useState<string | null>(null);

    const treeData: TreeNode[] = useMemo(() => {
        const rootChildren: TreeNode[] = [
            { name: '.gitignore', type: 'file' },
        ];
        
        if (config.docs.readme) {
            rootChildren.unshift({ name: 'README.md', type: 'file' });
        }
        if (config.docs.contributing) {
            rootChildren.push({ name: 'CONTRIBUTING.md', type: 'file' });
        }

        if (config.security.manageEnv) {
            rootChildren.push({ name: '.env.example', type: 'file' });
        }

        // Framework specific files
        if (config.docs.framework === 'docusaurus') {
            rootChildren.push({ name: 'docusaurus.config.js', type: 'file' });
            rootChildren.push({ name: 'docs', type: 'folder', children: [{ name: 'intro.md', type: 'file' }] });
        }
        if (config.docs.framework === 'mkdocs') {
            rootChildren.push({ name: 'mkdocs.yml', type: 'file' });
            rootChildren.push({ name: 'docs', type: 'folder', children: [{ name: 'index.md', type: 'file' }] });
        }
        if (config.docs.framework === 'vitepress') {
             rootChildren.push({ name: 'docs', type: 'folder', children: [
                 { name: '.vitepress', type: 'folder', children: [{ name: 'config.ts', type: 'file' }] },
                 { name: 'index.md', type: 'file' }
             ] });
        }

        // Language specific root files
        if (config.stack.language === 'TypeScript') {
            rootChildren.push({ name: 'package.json', type: 'file' });
            rootChildren.push({ name: 'tsconfig.json', type: 'file' });
            if (config.quality.linter === 'ESLint') rootChildren.push({ name: '.eslintrc.json', type: 'file' });
            
            // Config files for selected builder
            if (config.stack.builder === 'Vite') rootChildren.push({ name: 'vite.config.ts', type: 'file' });
            if (config.stack.builder === 'Webpack') rootChildren.push({ name: 'webpack.config.js', type: 'file' });
            
            // Build Tool
            if (config.stack.buildTool === 'Nx') rootChildren.push({ name: 'nx.json', type: 'file' });
            if (config.stack.buildTool === 'Turborepo') rootChildren.push({ name: 'turbo.json', type: 'file' });

        } else if (config.stack.language === 'Java') {
            rootChildren.push({ name: 'pom.xml', type: 'file' });
        } else if (config.stack.language === 'Ruby') {
             rootChildren.push({ name: 'Gemfile', type: 'file' });
             rootChildren.push({ name: 'Rakefile', type: 'file' });
        } else {
             // Fallback for others (Go, Python etc already have some defaults or just use package.json for demo)
             if (config.stack.language !== 'Go' && config.stack.language !== 'Rust') {
                rootChildren.push({ name: 'package.json', type: 'file' });
             }
             if (config.stack.language === 'Rust') rootChildren.push({ name: 'Cargo.toml', type: 'file' });
             if (config.stack.language === 'Go') rootChildren.push({ name: 'go.mod', type: 'file' });
             if (config.stack.language === 'Python') {
                 if (config.stack.packageManager === 'pipenv') {
                     rootChildren.push({ name: 'Pipfile', type: 'file' });
                 } else {
                    rootChildren.push({ name: 'requirements.txt', type: 'file' });
                 }
             }
        }
        
        // Github Folder
        const githubChildren: TreeNode[] = [];
        // Workflows
        const workflowsChildren: TreeNode[] = [];
        if (config.ci.runTests || config.ci.buildArtifacts) {
            workflowsChildren.push({ name: 'ci.yml', type: 'file' });
        }
        if (config.docs.deployToPages && config.docs.framework !== 'none') {
            workflowsChildren.push({ name: 'deploy-docs.yml', type: 'file' });
        }
        
        if (workflowsChildren.length > 0) {
             githubChildren.push({ name: 'workflows', type: 'folder', children: workflowsChildren });
        }

        // Always generate settings.yml for demonstration
        githubChildren.push({ name: 'settings.yml', type: 'file' });

        if (config.docs.issueTemplates) {
             githubChildren.push({ name: 'ISSUE_TEMPLATE', type: 'folder', children: [{ name: 'bug_report.md', type: 'file' }] });
        }
        if (config.docs.pullRequestTemplate) {
             githubChildren.push({ name: 'pull_request_template.md', type: 'file' });
        }
        if (config.docs.codeowners) {
             githubChildren.push({ name: 'CODEOWNERS', type: 'file' });
        }
        if (githubChildren.length > 0) {
            rootChildren.push({ name: '.github', type: 'folder', children: githubChildren });
        }

        // I18n
        if (config.basics.i18n) {
            rootChildren.push({ 
                name: 'locales', 
                type: 'folder', 
                children: [
                    { name: 'en.json', type: 'file' },
                    { name: 'es.json', type: 'file' }
                ] 
            });
        }

        // Src Structure based on Architecture
        const srcChildren: TreeNode[] = [];
        if (config.architecture === 'Hexagonal') {
             srcChildren.push({ name: 'domain', type: 'folder', children: [{ name: 'entity.ts', type: 'file' }] });
             srcChildren.push({ name: 'ports', type: 'folder', children: [{ name: 'repository.interface.ts', type: 'file' }] });
             srcChildren.push({ name: 'adapters', type: 'folder', children: [{ name: 'http', type: 'folder' }, { name: 'persistence', type: 'folder' }] });
             srcChildren.push({ name: 'main.ts', type: 'file' });
        } else if (config.architecture === 'Clean') {
             srcChildren.push({ name: 'entities', type: 'folder' });
             srcChildren.push({ name: 'use_cases', type: 'folder' });
             srcChildren.push({ name: 'controllers', type: 'folder' });
             srcChildren.push({ name: 'frameworks', type: 'folder' });
             srcChildren.push({ name: 'main.ts', type: 'file' });
        } else if (config.architecture === 'MVC') {
             srcChildren.push({ name: 'models', type: 'folder' });
             srcChildren.push({ name: 'views', type: 'folder' });
             srcChildren.push({ name: 'controllers', type: 'folder' });
             srcChildren.push({ name: 'app.ts', type: 'file' });
        } else if (config.architecture === 'Event-Driven') {
             srcChildren.push({ name: 'events', type: 'folder' });
             srcChildren.push({ name: 'handlers', type: 'folder' });
             srcChildren.push({ name: 'producers', type: 'folder' });
             srcChildren.push({ name: 'consumer.ts', type: 'file' });
        } else if (config.architecture === 'Vertical Slice') {
            srcChildren.push({ name: 'features', type: 'folder', children: [
                { name: 'auth', type: 'folder', children: [{name: 'login.tsx', type: 'file'}, {name: 'api.ts', type: 'file'}] },
                { name: 'dashboard', type: 'folder', children: [{name: 'view.tsx', type: 'file'}] }
            ]});
        } else {
             // Standard
             srcChildren.push({ name: 'index.ts', type: 'file' });
             srcChildren.push({ name: 'utils.ts', type: 'file' });
        }

        if (config.quality.testing) {
            srcChildren.push({ name: 'utils.test.ts', type: 'file' });
        }

        if (config.structure === RepoStructure.MONO) {
             return [
                { name: 'apps', type: 'folder', children: [{ name: 'web', type: 'folder', children: rootChildren }] },
                { name: 'packages', type: 'folder', children: [{ name: 'ui', type: 'folder', children: srcChildren }] },
                { name: 'package.json', type: 'file' },
                ...(config.stack.buildTool === 'Nx' ? [{ name: 'nx.json', type: 'file' }] : []),
                ...(config.stack.buildTool === 'Turborepo' ? [{ name: 'turbo.json', type: 'file' }] : []),
            ] as TreeNode[];
        }

        rootChildren.push({ name: 'src', type: 'folder', children: srcChildren });
        return rootChildren;
    }, [config]);

    const handleSelect = (node: TreeNode & { path: string }) => {
        setSelectedFile(node);
        setSelectedPath(node.path);
    };

    return (
        <Card className="flex flex-col h-[400px] bg-card border border-border overflow-hidden shadow-xl">
             <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-3 h-3" />
                    {config.projectName}
                </span>
                <div className="flex gap-1.5 opacity-50">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                </div>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
                <div className="w-5/12 overflow-y-auto border-r border-border py-2 scrollbar-thin bg-muted/10">
                    {treeData.map((node) => (
                        <TreeItem key={node.name} node={node} onSelect={handleSelect} selectedPath={selectedPath} />
                    ))}
                </div>
                
                <div className="w-7/12 bg-card overflow-y-auto scrollbar-thin relative">
                     {selectedFile ? (
                        <div className="min-h-full">
                            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-card/90 backdrop-blur-sm border-b border-border">
                                <span className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                                    {selectedFile.type === 'folder' ? <FolderIcon name={selectedFile.name} isOpen={true} className="w-3 h-3" /> : <FileIcon name={selectedFile.name} />}
                                    {selectedFile.name}
                                </span>
                                <div className="flex gap-2">
                                     <Copy className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-foreground" />
                                </div>
                            </div>
                            <div className="p-4">
                                <pre className="text-[10px] leading-relaxed font-mono text-foreground/80 whitespace-pre-wrap font-ligature">
                                    {generateContent(selectedFile, config)}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                            <Box className="w-10 h-10 opacity-20" />
                            <span className="text-xs">Select a file to preview</span>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};
