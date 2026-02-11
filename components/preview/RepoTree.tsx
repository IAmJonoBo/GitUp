import React, { useMemo, useState } from 'react';
import { Box, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { useStore } from '../../store';
import { Card, Tooltip, TooltipContent, TooltipTrigger } from '../ui/primitives';
import { FileIcon, FolderIcon } from '../ui/FileIcon';
import { cn } from '../../lib/utils';

type TreeNode = {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: TreeNode[];
};

const buildTree = (paths: string[]): TreeNode[] => {
  const root: TreeNode[] = [];

  for (const filePath of paths) {
    const parts = filePath.split('/');
    let level = root;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = index === parts.length - 1;
      let node = level.find((candidate) => candidate.name === part);

      if (!node) {
        node = { name: part, type: isFile ? 'file' : 'folder', path: currentPath, children: isFile ? undefined : [] };
        level.push(node);
      }

      if (!isFile) {
        node.children ??= [];
        level = node.children;
      }
    });
  }

  const sortNodes = (nodes: TreeNode[]): TreeNode[] =>
    nodes
      .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1))
      .map((node) => ({ ...node, children: node.children ? sortNodes(node.children) : undefined }));

  return sortNodes(root);
};

const TreeItem = ({ node, depth, onSelect, selectedPath }: { node: TreeNode; depth: number; onSelect: (node: TreeNode) => void; selectedPath: string | null }) => {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const isSelected = selectedPath === node.path;

  if (node.type === 'folder') {
    return (
      <div>
        <div
          className={cn('flex items-center gap-2 py-1 px-2 cursor-pointer text-xs', isSelected ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            setIsOpen((value) => !value);
            onSelect(node);
          }}
        >
          {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <FolderIcon name={node.name} isOpen={isOpen} className="w-3 h-3" />
          <span>{node.name}</span>
        </div>
        {isOpen && node.children?.map((child) => <TreeItem key={child.path} node={child} depth={depth + 1} onSelect={onSelect} selectedPath={selectedPath} />)}
      </div>
    );
  }

  return (
    <div
      className={cn('flex items-center gap-2 py-1 px-2 cursor-pointer text-xs', isSelected ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
      onClick={() => onSelect(node)}
    >
      <FileIcon name={node.name} />
      <span className="font-mono truncate">{node.name}</span>
    </div>
  );
};

export const RepoTree = () => {
  const { repoSpec, changePlan, config } = useStore((state) => ({
    repoSpec: state.repoSpec,
    changePlan: state.changePlan,
    config: state.config,
  }));

  const [selectedPath, setSelectedPath] = useState<string | null>(repoSpec.files[0] ?? null);

  const treeData = useMemo(() => buildTree(repoSpec.files), [repoSpec.files]);

  const selectedContent = useMemo(() => {
    if (!selectedPath) return 'Select a file to preview.';
    const sourceOperation = changePlan.operations.find((operation) => operation.target === selectedPath);

    return [
      `# ${selectedPath}`,
      '',
      `Package manager: ${repoSpec.packageManager}`,
      `Architecture: ${repoSpec.architecture}`,
      '',
      sourceOperation ? `Planned action: ${sourceOperation.message}` : 'Planned action: generated from RepoSpec file list.',
    ].join('\n');
  }, [changePlan.operations, repoSpec.architecture, repoSpec.packageManager, selectedPath]);

  return (
    <Card className="flex flex-col h-[400px] bg-card border border-border overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Package className="w-3 h-3" />
          {config.projectName}
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-5/12 overflow-y-auto border-r border-border py-2 scrollbar-thin bg-muted/10">
          {treeData.map((node) => (
            <TreeItem key={node.path} node={node} depth={0} onSelect={(nodeValue) => setSelectedPath(nodeValue.path)} selectedPath={selectedPath} />
          ))}
        </div>

        <div className="w-7/12 bg-card overflow-y-auto scrollbar-thin relative">
          {selectedPath ? (
            <div className="min-h-full p-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <pre className="text-[10px] leading-relaxed font-mono text-foreground/80 whitespace-pre-wrap">{selectedContent}</pre>
                </TooltipTrigger>
                <TooltipContent side="top">Derived from RepoSpec + ChangePlan</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Box className="w-10 h-10 opacity-20" />
              <span className="text-xs">No files in RepoSpec</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
