import { Language, ProjectType, TechStackOption, Recipe } from "./types";

export const PROJECT_TYPES = Object.values(ProjectType);
export const LANGUAGES = Object.values(Language);

export const LICENSES = [
  'MIT',
  'Apache-2.0',
  'GPL-3.0',
  'BSD-3-Clause',
  'Unlicense',
  'None'
];

export const CODES_OF_CONDUCT = [
  { value: 'none', label: 'None' },
  { value: 'contributor-covenant', label: 'Contributor Covenant' },
  { value: 'citizen', label: 'Citizen Code of Conduct' }
];

export const PACKAGE_MANAGERS: Record<Language, string[]> = {
  [Language.TYPESCRIPT]: ['npm', 'yarn', 'pnpm', 'bun'],
  [Language.JAVASCRIPT]: ['npm', 'yarn', 'pnpm', 'bun'],
  [Language.PYTHON]: ['pip', 'poetry', 'pipenv'],
  [Language.GO]: ['go mod'],
  [Language.RUST]: ['cargo']
};

export const LANGUAGE_ICONS: Record<Language, string> = {
  [Language.TYPESCRIPT]: 'devicon-typescript-plain',
  [Language.JAVASCRIPT]: 'devicon-javascript-plain',
  [Language.PYTHON]: 'devicon-python-plain',
  [Language.GO]: 'devicon-go-original-wordmark',
  [Language.RUST]: 'devicon-rust-plain'
};

export const RECIPES: Recipe[] = [
  {
    id: 't3-stack',
    name: 'T3 Stack (Next.js)',
    description: 'Fullstack TypeScript with Next.js, Tailwind, and CI/CD ready.',
    icon: 'devicon-nextjs-plain',
    config: {
      language: Language.TYPESCRIPT,
      frameworks: ['nextjs', 'react', 'tailwind'],
      tools: ['eslint', 'prettier', 'vitest'],
      ci: true,
      linting: true,
      docker: false
    }
  },
  {
    id: 'python-data-api',
    name: 'Modern Python API',
    description: 'FastAPI with Poetry, Docker, and Pytest.',
    icon: 'devicon-fastapi-plain',
    config: {
      language: Language.PYTHON,
      packageManager: 'poetry',
      frameworks: ['fastapi'],
      tools: ['pytest', 'ruff'],
      ci: true,
      docker: true,
      linting: true
    }
  },
  {
    id: 'go-microservice',
    name: 'Go Microservice',
    description: 'Gin-based API with Docker and GitHub Actions.',
    icon: 'devicon-go-original-wordmark',
    config: {
      language: Language.GO,
      packageManager: 'go mod',
      frameworks: ['gin'],
      tools: [],
      ci: true,
      docker: true,
      linting: true
    }
  }
];

export const TECH_OPTIONS: TechStackOption[] = [
  // Frontend Frameworks
  { id: 'react', name: 'React', description: 'Component-based UI library', category: 'frontend', iconClass: 'devicon-react-original', recommendedFor: [Language.TYPESCRIPT, Language.JAVASCRIPT], tags: ['Popular', 'UI'] },
  { id: 'vue', name: 'Vue.js', description: 'Progressive Framework', category: 'frontend', iconClass: 'devicon-vuejs-plain', recommendedFor: [Language.TYPESCRIPT, Language.JAVASCRIPT], tags: ['Easy', 'UI'] },
  { id: 'nextjs', name: 'Next.js', description: 'React Framework for Production', category: 'frontend', iconClass: 'devicon-nextjs-plain', recommendedFor: [Language.TYPESCRIPT, Language.JAVASCRIPT], tags: ['SSR', 'Fullstack'] },
  { id: 'tailwind', name: 'Tailwind', description: 'Utility-first CSS', category: 'styling', iconClass: 'devicon-tailwindcss-original', recommendedFor: [Language.TYPESCRIPT, Language.JAVASCRIPT], tags: ['Styling'] },
  
  // Backend
  { id: 'express', name: 'Express', description: 'Minimalist web framework', category: 'backend', iconClass: 'devicon-express-original', recommendedFor: [Language.TYPESCRIPT, Language.JAVASCRIPT], tags: ['Simple'] },
  { id: 'fastapi', name: 'FastAPI', description: 'High performance API framework', category: 'backend', iconClass: 'devicon-fastapi-plain', recommendedFor: [Language.PYTHON], tags: ['Fast', 'Async'] },
  { id: 'gin', name: 'Gin', description: 'HTTP web framework', category: 'backend', iconClass: 'devicon-go-original', recommendedFor: [Language.GO], tags: ['Fast'] },
  { id: 'actix', name: 'Actix', description: 'Powerful actor-based framework', category: 'backend', iconClass: 'devicon-rust-plain', recommendedFor: [Language.RUST], tags: ['Performance'] },

  // Tools
  { id: 'vitest', name: 'Vitest', description: 'Vite-native unit testing', category: 'testing', iconClass: 'devicon-vitest-plain', recommendedFor: [Language.TYPESCRIPT, Language.JAVASCRIPT], tags: ['Fast'] },
  { id: 'jest', name: 'Jest', description: 'JavaScript Testing Framework', category: 'testing', iconClass: 'devicon-jest-plain', recommendedFor: [Language.TYPESCRIPT, Language.JAVASCRIPT], tags: ['Standard'] },
  { id: 'pytest', name: 'pytest', description: 'Python testing framework', category: 'testing', iconClass: 'devicon-pytest-plain', recommendedFor: [Language.PYTHON], tags: ['Standard'] },
  { id: 'eslint', name: 'ESLint', description: 'Pluggable linting utility', category: 'devtools', iconClass: 'devicon-eslint-original', recommendedFor: [Language.TYPESCRIPT, Language.JAVASCRIPT], tags: ['Quality'] },
  { id: 'prettier', name: 'Prettier', description: 'Opinionated code formatter', category: 'devtools', iconClass: 'devicon-vscode-plain', recommendedFor: [Language.TYPESCRIPT, Language.JAVASCRIPT], tags: ['Formatting'] },
  { id: 'ruff', name: 'Ruff', description: 'Extremely fast Python linter', category: 'devtools', iconClass: 'devicon-python-plain', recommendedFor: [Language.PYTHON], tags: ['Fast', 'New'] },
];
