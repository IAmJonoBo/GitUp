import React from 'react';
import { 
  Package, Settings, Box, ScrollText, GitBranch, Lock, FileJson, FileCode, 
  FileText, Palette, Image as ImageIcon, File, Gem, Coffee, Terminal, 
  FileCog, Braces, Folder, FolderOpen, Github, TestTube, Globe, Book, 
  Server, Shield, Layout, Wrench, Database, AppWindow, Cpu
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const FileIcon = ({ name, className }: { name: string, className?: string }) => {
  const fileName = name.split('/').pop() || name;
  const ext = fileName.split('.').pop()?.toLowerCase();

  const baseClasses = cn("w-4 h-4", className);

  // Config & Dotfiles
  if (fileName === 'package.json') return <Package className={cn(baseClasses, "text-orange-400")} />;
  if (fileName === 'tsconfig.json') return <FileCode className={cn(baseClasses, "text-blue-500")} />;
  if (fileName === 'settings.json') return <Settings className={cn(baseClasses, "text-zinc-400")} />;
  if (fileName.includes('eslint')) return <Shield className={cn(baseClasses, "text-indigo-400")} />;
  if (fileName.includes('prettier')) return <Settings className={cn(baseClasses, "text-pink-400")} />;
  if (fileName.startsWith('.env')) return <Lock className={cn(baseClasses, "text-yellow-500")} />;
  if (fileName === '.gitignore') return <GitBranch className={cn(baseClasses, "text-orange-600")} />;
  if (fileName === 'Dockerfile') return <Box className={cn(baseClasses, "text-cyan-500")} />;
  if (fileName === 'docker-compose.yml' || fileName === 'docker-compose.yaml') return <Box className={cn(baseClasses, "text-cyan-400")} />;
  if (fileName === 'CODEOWNERS') return <Shield className={cn(baseClasses, "text-rose-400")} />;
  if (fileName === 'README.md') return <FileText className={cn(baseClasses, "text-blue-300")} />;
  if (fileName === 'LICENSE') return <ScrollText className={cn(baseClasses, "text-yellow-600")} />;
  if (fileName === 'package-lock.json') return <FileJson className={cn(baseClasses, "text-amber-400")} />;
  if (fileName === 'pnpm-lock.yaml' || fileName === 'yarn.lock' || fileName === 'bun.lockb') return <FileJson className={cn(baseClasses, "text-yellow-400")} />;
  if (fileName === 'Pipfile' || fileName === 'Pipfile.lock' || fileName === 'pyproject.toml' || fileName === 'poetry.lock') return <FileText className={cn(baseClasses, "text-emerald-400")} />;
  if (fileName === 'Gemfile.lock') return <Gem className={cn(baseClasses, "text-red-400")} />;
  if (fileName === 'build.gradle' || fileName === 'build.gradle.kts' || fileName === 'settings.gradle') return <FileCode className={cn(baseClasses, "text-red-500")} />;

  // Languages - Specific Files
  if (fileName === 'Gemfile') return <Gem className={cn(baseClasses, "text-red-500")} />;
  if (fileName === 'Rakefile') return <Gem className={cn(baseClasses, "text-red-400")} />;
  if (fileName === 'go.mod' || fileName === 'go.sum') return <FileCode className={cn(baseClasses, "text-cyan-400")} />;
  if (fileName === 'go.work' || fileName === 'go.work.sum') return <FileCode className={cn(baseClasses, "text-cyan-300")} />;
  if (fileName === 'Cargo.toml') return <Settings className={cn(baseClasses, "text-orange-400")} />;
  if (fileName === 'Cargo.lock') return <Cpu className={cn(baseClasses, "text-orange-500")} />;
  if (fileName === 'pom.xml') return <FileCode className={cn(baseClasses, "text-red-600")} />;
  if (fileName === 'requirements.txt') return <FileText className={cn(baseClasses, "text-green-400")} />;

  // Extensions
  switch (ext) {
    // Web
    case 'ts':
    case 'tsx': return <FileCode className={cn(baseClasses, "text-blue-400")} />;
    case 'js':
    case 'jsx':
    case 'mjs': return <FileCode className={cn(baseClasses, "text-yellow-300")} />;
    case 'html': return <Layout className={cn(baseClasses, "text-orange-500")} />;
    case 'css':
    case 'scss':
    case 'less': return <Palette className={cn(baseClasses, "text-pink-400")} />;
    case 'json': return <Braces className={cn(baseClasses, "text-yellow-400")} />;
    
    // Backend
    case 'java': return <Coffee className={cn(baseClasses, "text-red-500")} />;
    case 'py': return <FileCode className={cn(baseClasses, "text-blue-500")} />; 
    case 'go': return <FileCode className={cn(baseClasses, "text-cyan-500")} />;
    case 'rs': return <Cpu className={cn(baseClasses, "text-orange-500")} />; 
    case 'rb': return <Gem className={cn(baseClasses, "text-red-500")} />;
    case 'php': return <Server className={cn(baseClasses, "text-indigo-400")} />;
    
    // Data/Config
    case 'yml':
    case 'yaml': return <FileCog className={cn(baseClasses, "text-purple-400")} />;
    case 'xml': return <FileCode className={cn(baseClasses, "text-orange-400")} />;
    case 'sql': return <Database className={cn(baseClasses, "text-blue-400")} />;
    
    // Media
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'ico': return <ImageIcon className={cn(baseClasses, "text-green-400")} />;
    
    // Docs
    case 'md':
    case 'txt': return <FileText className={cn(baseClasses, "text-zinc-400")} />;
    
    // Shell
    case 'sh':
    case 'bash':
    case 'zsh': return <Terminal className={cn(baseClasses, "text-green-500")} />;
    
    default: return <File className={cn(baseClasses, "text-zinc-600")} />;
  }
};

export const FolderIcon = ({ name, isOpen, className }: { name: string, isOpen: boolean, className?: string }) => {
  const folderName = name.toLowerCase();
  const baseClasses = cn("w-4 h-4", className);
  
  if (folderName === '.github') return <Github className={cn(baseClasses, "text-zinc-200")} />;
  if (folderName === 'src' || folderName === 'source') return <FileCode className={cn(baseClasses, "text-green-500")} />;
  if (folderName === 'dist' || folderName === 'build' || folderName === 'out') return <Box className={cn(baseClasses, "text-orange-400")} />;
  if (folderName === 'node_modules') return <Package className={cn(baseClasses, "text-zinc-500")} />;
  if (folderName === 'test' || folderName === 'tests' || folderName === '__tests__') return <TestTube className={cn(baseClasses, "text-green-400")} />;
  if (folderName === 'docs' || folderName === 'documentation') return <Book className={cn(baseClasses, "text-blue-400")} />;
  if (folderName === 'public' || folderName === 'static' || folderName === 'assets') return <Globe className={cn(baseClasses, "text-yellow-400")} />;
  if (folderName === 'components') return <Layout className={cn(baseClasses, "text-purple-400")} />;
  if (folderName === 'api' || folderName === 'server') return <Server className={cn(baseClasses, "text-blue-500")} />;
  if (folderName === 'utils' || folderName === 'lib' || folderName === 'helpers') return <Wrench className={cn(baseClasses, "text-cyan-400")} />;
  if (folderName === 'apps') return <AppWindow className={cn(baseClasses, "text-pink-400")} />;
  if (folderName === 'packages') return <Package className={cn(baseClasses, "text-indigo-400")} />;
  if (folderName === 'locales') return <Globe className={cn(baseClasses, "text-teal-400")} />;

  return isOpen 
    ? <FolderOpen className={cn(baseClasses, "text-indigo-400 fill-indigo-400/20")} /> 
    : <Folder className={cn(baseClasses, "text-indigo-400 fill-indigo-400/20")} />;
};
