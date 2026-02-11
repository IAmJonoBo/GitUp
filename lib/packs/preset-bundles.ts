import { PlanConfigPatch } from '../../types';

export interface PresetBundle {
  id: string;
  name: string;
  description: string;
  packs: string[];
  config: PlanConfigPatch;
}

export const PRESET_BUNDLES: PresetBundle[] = [
  {
    id: 'bundle.governance.solo-quickstart',
    name: 'Solo Quickstart Governance',
    description: 'Lean defaults for solo and hackathon projects.',
    packs: ['pack.quality.lint-eslint'],
    config: {
      visibility: 'public',
      quality: { testing: false, coverageTarget: 0 },
      ci: { runTests: true, buildArtifacts: true, automaticRelease: false, deployToCloud: true },
      security: { codeScanning: false, secretScanning: true, dependencyUpdates: true, dependencyUpdateFrequency: 'monthly' },
    },
  },
  {
    id: 'bundle.governance.team-standard',
    name: 'Team Standard Governance',
    description: 'Balanced quality and security posture for product teams.',
    packs: ['pack.quality.lint-eslint', 'pack.quality.format-prettier', 'pack.quality.test-vitest'],
    config: {
      visibility: 'private',
      quality: { testing: true, coverageTarget: 80 },
      ci: { runTests: true, buildArtifacts: true, automaticRelease: true, deployToCloud: false },
      security: { codeScanning: true, secretScanning: true, dependencyUpdates: true, dependencyUpdateFrequency: 'weekly' },
    },
  },
  {
    id: 'bundle.governance.enterprise',
    name: 'Hardened Enterprise Governance',
    description: 'Strict controls with high-assurance defaults.',
    packs: ['pack.quality.lint-eslint', 'pack.quality.format-prettier', 'pack.quality.test-vitest', 'pack.release.semantic'],
    config: {
      visibility: 'private',
      structure: 'Monorepo',
      quality: { testing: true, coverageTarget: 95 },
      ci: { runTests: true, buildArtifacts: true, automaticRelease: true, deployToCloud: false },
      security: { codeScanning: true, secretScanning: true, dependencyUpdates: true, dependencyUpdateFrequency: 'daily' },
      docs: { readme: true, contributing: true, adr: true, codeowners: true },
    },
  },
  {
    id: 'bundle.stack.next-full',
    name: 'Full-Stack Next.js',
    description: 'Opinionated Next.js stack with testing and deploy-ready defaults.',
    packs: ['pack.runtime.framework', 'pack.quality.lint-eslint', 'pack.quality.format-prettier', 'pack.quality.test-vitest'],
    config: {
      projectName: 'next-app-starter',
      stack: { language: 'TypeScript', framework: 'Next.js', packageManager: 'pnpm', builder: 'None' },
      quality: { testing: true, testFramework: 'Vitest', e2eTests: true, e2eFramework: 'Playwright', coverageTarget: 80 },
      ci: { runTests: true, buildArtifacts: true, deployToCloud: true },
      basics: { i18n: true },
    },
  },
  {
    id: 'bundle.stack.go-api',
    name: 'High-Performance API Service',
    description: 'Go API service with cloud deploy defaults.',
    packs: ['pack.runtime.framework'],
    config: {
      projectName: 'go-service-api',
      type: 'Service',
      architecture: 'Clean',
      stack: { language: 'Go', framework: 'Gin', packageManager: 'npm', builder: 'Go Build' },
      quality: { linter: 'None', testing: true, testFramework: 'Go Test', coverageTarget: 70 },
      ci: { runTests: true, buildArtifacts: true, deployToCloud: true },
      security: { codeScanning: true },
    },
  },
  {
    id: 'bundle.stack.docs-site',
    name: 'VitePress Documentation',
    description: 'Docs-first setup with GitHub Pages deployment.',
    packs: ['pack.runtime.framework', 'pack.build.vite', 'pack.docs.templates'],
    config: {
      projectName: 'docs-portal',
      stack: { language: 'TypeScript', framework: 'VitePress', packageManager: 'yarn', builder: 'Vite' },
      docs: { framework: 'vitepress', deployToPages: true, readme: true },
      ci: { runTests: false, buildArtifacts: true, deployToCloud: false },
    },
  },
];

export const getPresetBundlesByIds = (ids: string[]): PresetBundle[] => {
  const wanted = new Set(ids);
  return PRESET_BUNDLES.filter((bundle) => wanted.has(bundle.id));
};
