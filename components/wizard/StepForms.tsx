import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useStore } from '../../store';
import { Input, Label, Switch, Button, Badge, Tooltip, TooltipContent, TooltipTrigger, Card, Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/primitives';
import { DecisionCard } from '../app/DecisionCard';
import { ApplyScreen } from '../app/ApplyScreen';
import { ConflictResolutionPanel } from '../app/ConflictResolutionPanel';
import { RepoStructure, ProjectType, DocFramework, DocStyle, TestFramework, E2EFramework, BuildTool, Linter, Formatter, QualityPlatform, Architecture, Builder, DependencyStrategy, PlanConfig } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Shield, Zap, BookOpen, Terminal, Box, Globe, Layout, Server, Monitor, Layers, Package, Gauge, FileText, Users, Lock, RefreshCw, Scan, Info, Edit2, ChevronRight, Star, Cpu, ArrowDownCircle, MessagesSquare, Library, TestTube, Play, Beaker, Hammer, Boxes, Code2, CheckCheck, Languages, AlertTriangle, CheckCircle2, GitMerge, GitPullRequest, ListTodo, MessageSquare, Book, Rocket, ScrollText, Key, GitBranch, Workflow, Cloud, Settings, KeyRound, AppWindow, PlayCircle, Plus, X, Tag, Webhook as WebhookIcon, Bot, FileCode, Anchor, PenTool, LayoutTemplate, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

// --- Shared Components ---
const SectionHeader = ({ icon: Icon, title, description, onEdit }: { icon: LucideIcon, title: string, description?: string, onEdit?: () => void }) => (
    <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 rounded-lg text-primary border border-primary/20 shadow-sm">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-semibold text-sm text-foreground">{title}</h3>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
        </div>
        {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                <Edit2 className="w-4 h-4" />
            </Button>
        )}
    </div>
);

const LINTER_OPTIONS: Linter[] = ['ESLint', 'Biome', 'None'];
const FORMATTER_OPTIONS: Formatter[] = ['Prettier', 'Biome', 'None'];
const DEPENDENCY_FREQUENCIES: PlanConfig['security']['dependencyUpdateFrequency'][] = ['daily', 'weekly', 'monthly'];
const ACTION_PERMISSION_OPTIONS: PlanConfig['github']['actions']['permissions'][] = ['all', 'local', 'none'];

// --- Step 1: Basics ---
const basicsSchema = z.object({
  projectName: z.string().min(3, "Too short").max(50),
  visibility: z.enum(['public', 'private']),
  structure: z.nativeEnum(RepoStructure),
  i18n: z.boolean()
});

type BasicsFormValues = z.infer<typeof basicsSchema>;

export const StepBasics = () => {
  const { config, updateConfig } = useStore();
  const { register, watch, setValue, formState: { errors } } = useForm<BasicsFormValues>({
    resolver: zodResolver(basicsSchema),
    defaultValues: {
      projectName: config.projectName,
      visibility: config.visibility,
      structure: config.structure,
      i18n: config.basics.i18n,
    },
    mode: 'onChange'
  });

  const values = watch();
  React.useEffect(() => {
    updateConfig({
        projectName: values.projectName,
        visibility: values.visibility,
        structure: values.structure,
        basics: { ...config.basics, i18n: values.i18n }
    });
  }, [values, updateConfig]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
      <div className="space-y-6">
        <div>
            <Label>Project Name</Label>
            <Input {...register('projectName')} className="mt-2" placeholder="e.g. acme-web-service" />
            {errors.projectName && <p className="text-destructive text-xs mt-1">{errors.projectName.message}</p>}
        </div>

        <div className="flex items-center justify-between p-4 border rounded-xl bg-card hover:border-primary/20 transition-colors shadow-sm">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500 border border-pink-500/20">
                    <Languages className="w-5 h-5" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <div className="font-semibold text-sm text-card-foreground">Internationalization (i18n)</div>
                    </div>
                    <div className="text-xs text-muted-foreground">Prepare project for multiple languages & locales</div>
                </div>
            </div>
            <Switch 
                checked={values.i18n} 
                onCheckedChange={(v) => setValue('i18n', v)} 
            />
        </div>
        
        {values.i18n && (
            <div className="p-3 bg-muted/50 border border-border rounded-lg text-[10px] text-muted-foreground -mt-2 animate-in slide-in-from-top-1">
                Will scaffold a <code className="text-foreground">locales</code> directory and configure the i18n routing middleware.
            </div>
        )}

        <div className="grid grid-cols-2 gap-4">
            <div 
                onClick={() => setValue('visibility', 'public')}
                className={cn("p-4 border rounded-xl cursor-pointer transition-all", values.visibility === 'public' ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card hover:bg-accent')}
            >
                <div className="flex items-center justify-between mb-2">
                    <span className={cn("font-semibold text-sm", values.visibility === 'public' ? 'text-primary' : 'text-foreground')}>Public</span>
                    <Globe className={cn("w-4 h-4", values.visibility === 'public' ? 'text-primary' : 'text-muted-foreground')} />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">Open source. Visible to everyone on GitHub.</p>
            </div>
            <div 
                 onClick={() => setValue('visibility', 'private')}
                 className={cn("p-4 border rounded-xl cursor-pointer transition-all", values.visibility === 'private' ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card hover:bg-accent')}
            >
                 <div className="flex items-center justify-between mb-2">
                    <span className={cn("font-semibold text-sm", values.visibility === 'private' ? 'text-primary' : 'text-foreground')}>Private</span>
                    <Shield className={cn("w-4 h-4", values.visibility === 'private' ? 'text-primary' : 'text-muted-foreground')} />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">Restricted access. Only visible to you and your team.</p>
            </div>
        </div>

        <div>
            <div className="flex items-center gap-2 mb-3">
                <Label>Repository Structure</Label>
                <Tooltip>
                    <TooltipTrigger>
                        <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                        <p><strong>Polyrepo:</strong> One project per repository. Simple, standard.</p>
                        <p className="mt-2"><strong>Monorepo:</strong> Multiple projects in one repo. Great for shared code, but requires more tooling.</p>
                    </TooltipContent>
                </Tooltip>
            </div>
            <div className="flex gap-4">
                {(Object.values(RepoStructure) as string[]).map((type) => (
                    <Button 
                        key={type} 
                        type="button" 
                        variant={values.structure === type ? 'default' : 'outline'}
                        onClick={() => setValue('structure', type as RepoStructure)}
                        className="w-1/2"
                    >
                        {type}
                    </Button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Step 2: Project Type & Architecture ---
export const StepType = () => {
    const { config, updateConfig, userMode, engineDecisions } = useStore();
    
    const types = [
        { id: ProjectType.WEB, icon: AppWindow, label: 'Web Application', desc: 'Frontend or Full-stack app' },
        { id: ProjectType.SERVICE, icon: Server, label: 'Backend Service', desc: 'API, Worker, or Microservice' },
        { id: ProjectType.LIBRARY, icon: Library, label: 'Library / Package', desc: 'Reusable code for other apps' },
        { id: ProjectType.CLI, icon: Terminal, label: 'CLI Tool', desc: 'Command line interface' },
    ];

    const architectures: {id: Architecture, desc: string, rec: boolean}[] = [
        { id: 'Standard', desc: 'Simple, folder-by-type structure. Good for small apps.', rec: config.type === ProjectType.WEB },
        { id: 'Hexagonal', desc: 'Ports & Adapters. Isolates domain logic from infrastructure.', rec: config.type === ProjectType.SERVICE },
        { id: 'Clean', desc: 'Concentric layers (Entities, Use Cases). Maximizes testability.', rec: false },
        { id: 'MVC', desc: 'Model-View-Controller. Classic pattern for separation of concerns.', rec: false },
        { id: 'Event-Driven', desc: 'Async communication via events. Good for scalable distributed systems.', rec: false },
        { id: 'Vertical Slice', desc: 'Group by feature rather than technical layer.', rec: false },
    ];

    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
             <div>
                <Label className="mb-4 block">What are you building?</Label>
                <div className="grid grid-cols-2 gap-4">
                    {types.map((t) => (
                        <div 
                            key={t.id}
                            onClick={() => updateConfig({ type: t.id })}
                            className={cn(
                                "flex flex-col gap-2 p-4 rounded-xl border cursor-pointer transition-all",
                                config.type === t.id ? "bg-primary/5 border-primary text-primary shadow-md" : "bg-card border-border text-muted-foreground hover:bg-accent"
                            )}
                        >
                            <t.icon className={cn("w-6 h-6", config.type === t.id ? "text-primary" : "text-muted-foreground")} />
                            <div>
                                <div className="font-semibold text-sm">{t.label}</div>
                                <div className="text-xs text-muted-foreground leading-tight mt-1">{t.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
             </div>

             {userMode === 'power' && (
                 <div className="pt-6 border-t border-border">
                     <Label className="mb-4 block">Architecture Pattern</Label>
                     <div className="space-y-3">
                         {architectures.map((arch) => (
                             <div 
                                key={arch.id}
                                onClick={() => updateConfig({ architecture: arch.id })}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                                    config.architecture === arch.id ? "bg-accent border-zinc-500" : "bg-card border-border hover:bg-accent"
                                )}
                             >
                                 <div>
                                     <div className="text-sm font-medium text-foreground flex items-center gap-2">
                                         {arch.id}
                                         {arch.rec && <Badge variant="success" className="text-[10px] h-5">Recommended</Badge>}
                                     </div>
                                     <div className="text-xs text-muted-foreground">{arch.desc}</div>
                                 </div>
                                 <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", config.architecture === arch.id ? "border-primary bg-primary" : "border-muted-foreground")}>
                                     {config.architecture === arch.id && <Check className="w-3 h-3 text-white" />}
                                 </div>
                             </div>
                         ))}
                     </div>
                     
                     <div className="mt-6">
                         <DecisionCard decision={engineDecisions.find((decision) => decision.key === 'architecture-normalization') ?? engineDecisions[0]} />
                     </div>
                 </div>
             )}
        </div>
    );
};

// --- Step 3: Tech Stack ---
const stackSchema = z.object({
  languageVersion: z.string().regex(/^v?\d+(\.\d+)*(\.\d+)?$/, "Invalid version format (e.g. 18.0.0 or v20)")
});

export const StepStack = () => {
    const { config, updateConfig, userMode } = useStore();
    const { register, formState: { errors } } = useForm({
        resolver: zodResolver(stackSchema),
        defaultValues: { languageVersion: config.stack.languageVersion },
        mode: 'onChange'
    });

    const languages: { id: PlanConfig['stack']['language']; icon: LucideIcon }[] = [
        { id: 'TypeScript', icon: FileCode },
        { id: 'Go', icon: Server },
        { id: 'Rust', icon: Cpu },
        { id: 'Python', icon: FileText },
        { id: 'Java', icon: Server },
    ];

    const frameworks: Record<PlanConfig['stack']['language'], string[]> = {
        'TypeScript': ['Next.js', 'Express', 'NestJS', 'Remix'],
        'Go': ['Gin', 'Echo', 'Fiber', 'Chi'],
        'Rust': ['Actix', 'Axum', 'Rocket'],
        'Python': ['FastAPI', 'Django', 'Flask'],
        'Java': ['Spring Boot', 'Quarkus'],
        'Ruby': ['Rails', 'Sinatra'],
    };

    const pkgManagers: Record<PlanConfig['stack']['language'], PlanConfig['stack']['packageManager'][]> = {
        'TypeScript': ['pnpm', 'npm', 'yarn', 'bun'],
        'Go': ['go mod'],
        'Rust': ['cargo'],
        'Python': ['pip', 'poetry', 'pipenv'],
        'Java': ['maven', 'gradle'],
        'Ruby': ['bundler'],
    };

    const builders: Builder[] = ['Vite', 'Webpack', 'Esbuild', 'Tsc', 'Rollup'];
    const dependencyStrategies: DependencyStrategy[] = ['semver', 'pinned'];
    const buildTools: {id: BuildTool, desc: string}[] = [
        { id: 'None', desc: 'No extra workspace tools' },
        { id: 'Nx', desc: 'Smart monorepos, fast CI' },
        { id: 'Turborepo', desc: 'High-performance build system' }
    ];

    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
             <div>
                 <Label className="mb-4 block">Core Language</Label>
                 <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                     {languages.map(l => (
                         <div 
                            key={l.id}
                            onClick={() => updateConfig({ stack: { ...config.stack, language: l.id, framework: frameworks[l.id][0], packageManager: pkgManagers[l.id][0], builder: l.id === 'TypeScript' ? 'Vite' : 'None', rustMode: l.id === 'Rust' ? config.stack.rustMode : 'template' } })}
                            className={cn(
                                "flex flex-col items-center gap-2 min-w-[80px] p-3 rounded-xl border cursor-pointer transition-all",
                                config.stack.language === l.id ? "bg-blue-500/10 border-blue-500 text-blue-500" : "bg-card border-border text-muted-foreground hover:text-foreground"
                            )}
                         >
                             <l.icon className={cn("w-6 h-6", config.stack.language === l.id ? "text-blue-500" : "text-muted-foreground")} />
                             <span className="text-xs font-medium">{l.id}</span>
                         </div>
                     ))}
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-6">
                 <div>
                     <Label className="mb-2 block">Framework</Label>
                     <div className="space-y-2 mb-6">
                         {frameworks[config.stack.language]?.map(fw => (
                             <div 
                                key={fw}
                                onClick={() => updateConfig({ stack: { ...config.stack, framework: fw } })}
                                className={cn(
                                    "flex items-center justify-between p-2.5 rounded-lg border cursor-pointer text-sm",
                                    config.stack.framework === fw ? "bg-accent border-zinc-500 text-foreground" : "bg-card border-border text-muted-foreground hover:bg-accent"
                                )}
                             >
                                 {fw}
                                 {config.stack.framework === fw && <Check className="w-3.5 h-3.5 text-foreground" />}
                             </div>
                         ))}
                     </div>



                     {config.stack.language === 'Rust' && (
                        <div className="mt-6">
                            <Label className="mb-2 block">Rust Mode</Label>
                            <div className="space-y-2">
                                {[
                                  { id: 'template', label: 'Template (recommended)', helper: 'Stable template renderer path.' },
                                  { id: 'projen-experimental', label: 'Projen Rust (experimental)', helper: 'Guarded by Power mode feature flag.' },
                                ].map((mode) => {
                                  const disabled = mode.id === 'projen-experimental' && userMode !== 'power';
                                  return (
                                    <div
                                      key={mode.id}
                                      onClick={() => !disabled && updateConfig({ stack: { ...config.stack, rustMode: mode.id as PlanConfig['stack']['rustMode'] } })}
                                      className={cn(
                                        'flex items-center justify-between p-2.5 rounded-lg border text-sm transition-all',
                                        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                                        config.stack.rustMode === mode.id ? 'bg-accent border-zinc-500 text-foreground' : 'bg-card border-border text-muted-foreground hover:bg-accent',
                                      )}
                                    >
                                      <div>
                                        <div>{mode.label}</div>
                                        <div className="text-[10px]">{mode.helper}</div>
                                      </div>
                                      {config.stack.rustMode === mode.id && <Check className="w-3.5 h-3.5 text-foreground" />}
                                    </div>
                                  );
                                })}
                            </div>
                        </div>
                     )}

                     <div>
                        <Label className="mb-2 block">Version Target</Label>
                        <Input 
                            {...register('languageVersion')} 
                            placeholder={config.stack.language === 'TypeScript' ? '20.0.0' : '1.20'}
                            onChange={(e) => {
                                register('languageVersion').onChange(e); // Trigger validation
                                updateConfig({ stack: { ...config.stack, languageVersion: e.target.value } });
                            }}
                        />
                        {errors.languageVersion && <p className="text-destructive text-[10px] mt-1">{errors.languageVersion.message as string}</p>}
                     </div>
                 </div>
                 
                 <div className="space-y-6">
                     <div>
                        <Label className="mb-2 block">Package Manager</Label>
                        <div className="flex flex-wrap gap-2">
                            {pkgManagers[config.stack.language]?.map(pm => (
                                <Badge 
                                    key={pm}
                                    variant={config.stack.packageManager === pm ? 'default' : 'outline'}
                                    className="cursor-pointer"
                                    onClick={() => updateConfig({ stack: { ...config.stack, packageManager: pm } })}
                                >
                                    {pm}
                                </Badge>
                            ))}
                        </div>
                     </div>
                     
                     <div>
                        <Label className="mb-2 block">Dependency Strategy</Label>
                        <div className="flex gap-2 bg-muted p-1 rounded-lg border border-border">
                            {dependencyStrategies.map(strategy => (
                                <button
                                    key={strategy}
                                    onClick={() => updateConfig({ stack: { ...config.stack, dependencyStrategy: strategy } })}
                                    className={cn(
                                        "flex-1 text-xs py-1.5 rounded-md transition-all capitalize",
                                        config.stack.dependencyStrategy === strategy 
                                            ? "bg-background text-foreground shadow-sm" 
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {strategy}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            {config.stack.dependencyStrategy === 'semver' ? 'Allow compatible updates (^1.2.3)' : 'Lock to exact versions (1.2.3)'}
                        </p>
                     </div>

                     <div>
                        <Label className="mb-2 block">Bundler / Compiler</Label>
                        {config.stack.language === 'TypeScript' ? (
                            <div className="grid grid-cols-3 gap-2">
                                {builders.map(b => (
                                    <div 
                                        key={b}
                                        onClick={() => updateConfig({ stack: { ...config.stack, builder: b } })}
                                        className={cn(
                                             "p-2 rounded-lg border cursor-pointer text-center text-[10px] font-medium transition-all",
                                             config.stack.builder === b ? "bg-accent text-foreground border-border" : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                                        )}
                                    >
                                        {b}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <Input 
                                    value={config.stack.builder} 
                                    disabled 
                                    className="bg-muted text-muted-foreground border-border cursor-not-allowed"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">Auto-selected based on framework</p>
                            </>
                        )}
                     </div>

                     <div className="pt-2 border-t border-border">
                        <Label className="mb-2 block">Dependency & Build Tooling</Label>
                         <div className="space-y-2">
                            {buildTools.map(tool => (
                                <div 
                                    key={tool.id}
                                    onClick={() => updateConfig({ stack: { ...config.stack, buildTool: tool.id } })}
                                    className={cn(
                                        "flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all",
                                        config.stack.buildTool === tool.id ? "bg-accent border-zinc-500" : "bg-card border-border hover:bg-accent"
                                    )}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-foreground">{tool.id}</span>
                                        <span className="text-[10px] text-muted-foreground">{tool.desc}</span>
                                    </div>
                                    <div className={cn("w-3 h-3 rounded-full border flex items-center justify-center", config.stack.buildTool === tool.id ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground")}></div>
                                </div>
                            ))}
                         </div>
                     </div>
                 </div>
             </div>

        </div>
    );
};

// --- Step 4: Quality & Testing ---
export const StepQuality = () => {
    const { config, updateConfig, userMode, engineDecisions } = useStore();

    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="space-y-4">
                     <SectionHeader icon={CheckCheck} title="Static Analysis" />
                     <div className="space-y-3">
                         <div>
                             <Label className="text-xs mb-1.5 block">Linter</Label>
                             <div className="flex gap-2 bg-muted p-1 rounded-lg border border-border">
                                 {LINTER_OPTIONS.map((l) => (
                                     <button
                                        key={l}
                                        onClick={() => updateConfig({ quality: { ...config.quality, linter: l } })}
                                        className={cn("flex-1 text-xs py-1.5 rounded-md transition-all", config.quality.linter === l ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                                     >
                                         {l}
                                     </button>
                                 ))}
                             </div>
                         </div>
                         <div>
                             <Label className="text-xs mb-1.5 block">Formatter</Label>
                             <div className="flex gap-2 bg-muted p-1 rounded-lg border border-border">
                                 {FORMATTER_OPTIONS.map((f) => (
                                     <button
                                        key={f}
                                        onClick={() => updateConfig({ quality: { ...config.quality, formatter: f } })}
                                        className={cn("flex-1 text-xs py-1.5 rounded-md transition-all", config.quality.formatter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                                     >
                                         {f}
                                     </button>
                                 ))}
                             </div>
                         </div>
                     </div>
                 </div>

                 <div className="space-y-4">
                     <SectionHeader icon={TestTube} title="Testing Strategy" />
                     
                     <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                        <span className="text-sm text-foreground">Unit Testing</span>
                        <Switch 
                            checked={config.quality.testing}
                            onCheckedChange={(v) => updateConfig({ quality: { ...config.quality, testing: v } })}
                        />
                     </div>
                     
                     {config.quality.testing && (
                        <div className="animate-in slide-in-from-top-2">
                            <Label className="text-xs mb-1.5 block">Framework</Label>
                            <Input 
                                value={config.quality.testFramework} 
                                onChange={(e) => updateConfig({ quality: { ...config.quality, testFramework: e.target.value as TestFramework } })}
                                className="h-8 text-xs"
                            />
                        </div>
                     )}

                     <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                        <span className="text-sm text-foreground">E2E Testing</span>
                        <Switch 
                            checked={config.quality.e2eTests}
                            onCheckedChange={(v) => updateConfig({ quality: { ...config.quality, e2eTests: v } })}
                        />
                     </div>
                 </div>
             </div>

             {userMode === 'power' && (
                 <div className="pt-6 border-t border-border">
                     <div className="flex items-center justify-between mb-4">
                         <Label>Quality Platform</Label>
                         <Badge variant="cyber">Recommended</Badge>
                     </div>
                     <div 
                        onClick={() => updateConfig({ quality: { ...config.quality, qualityPlatform: config.quality.qualityPlatform === 'Trunk.io' ? 'None' : 'Trunk.io' } })}
                        className={cn(
                            "flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                            config.quality.qualityPlatform === 'Trunk.io' ? "bg-indigo-500/10 border-indigo-500" : "bg-card border-border hover:bg-accent"
                        )}
                     >
                         <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                             <Hammer className="w-5 h-5" />
                         </div>
                         <div>
                             <h4 className="font-semibold text-sm text-foreground">Trunk.io Integration</h4>
                             <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                 Unify your linters, formatters, and static analysis into a single check. 
                                 Eliminates config drift and speeds up CI.
                             </p>
                         </div>
                         <Switch checked={config.quality.qualityPlatform === 'Trunk.io'} />
                     </div>
                 </div>
             )}
        </div>
    );
};

// --- Step 5: CI/CD Pipeline ---
export const StepCI = () => {
    const { config, updateConfig } = useStore();

    const jobs = [
        { id: 'runTests', label: 'Run Tests', icon: TestTube, desc: 'Execute unit and integration tests on push' },
        { id: 'buildArtifacts', label: 'Build Artifacts', icon: Box, desc: 'Compile code and store binaries/assets' },
        { id: 'automaticRelease', label: 'Semantic Release', icon: Rocket, desc: 'Auto-version and publish based on commits' },
        { id: 'deployToCloud', label: 'Deploy Preview', icon: Cloud, desc: 'Deploy to Vercel/Netlify/AWS on PR' },
    ];

    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="grid grid-cols-1 gap-4">
                {jobs.map((job) => (
                    <div 
                        key={job.id}
                        className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-all",
                            (config.ci[job.id as keyof typeof config.ci]) ? "bg-card border-zinc-600 shadow-md" : "bg-card/50 border-border opacity-70"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn("p-2 rounded-lg", 
                                (config.ci[job.id as keyof typeof config.ci]) ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"
                            )}>
                                <job.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className={cn("text-sm font-semibold", 
                                    (config.ci[job.id as keyof typeof config.ci]) ? "text-foreground" : "text-muted-foreground"
                                )}>{job.label}</h4>
                                <p className="text-xs text-muted-foreground">{job.desc}</p>
                            </div>
                        </div>
                        <Switch 
                            checked={config.ci[job.id as keyof typeof config.ci] as boolean} 
                            onCheckedChange={(v) => updateConfig({ ci: { ...config.ci, [job.id]: v } })} 
                        />
                    </div>
                ))}
            </div>

            <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Workflow className="w-4 h-4" />
                    <span className="text-xs font-mono font-semibold">.github/workflows/ci.yml Preview</span>
                </div>
                <div className="space-y-1">
                    {config.ci.runTests && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>job: test (runs-on: ubuntu-latest)</span>
                        </div>
                    )}
                    {config.ci.buildArtifacts && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>job: build (needs: test)</span>
                        </div>
                    )}
                     {config.ci.automaticRelease && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            <span>job: release (needs: build, if: branch == main)</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Step 6: Security ---
export const StepSecurity = () => {
    const { config, updateConfig } = useStore();

    return (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
             <div className="space-y-3">
                {engineDecisions.map((decision) => (
                    <DecisionCard key={decision.key} decision={decision} />
                ))}
             </div>

             {userMode === 'power' && <ConflictResolutionPanel />}

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className={cn("p-4 rounded-xl border transition-all", config.security.codeScanning ? "bg-card border-indigo-500/50" : "bg-card border-border")}>
                     <div className="flex justify-between items-start mb-3">
                         <Scan className={cn("w-6 h-6", config.security.codeScanning ? "text-indigo-400" : "text-muted-foreground")} />
                         <Switch checked={config.security.codeScanning} onCheckedChange={(v) => updateConfig({ security: { ...config.security, codeScanning: v } })} />
                     </div>
                     <h4 className="text-sm font-semibold text-foreground">Code Scanning</h4>
                     <p className="text-xs text-muted-foreground mt-1">Find vulnerabilities and errors in your code using CodeQL.</p>
                 </div>

                 <div className={cn("p-4 rounded-xl border transition-all", config.security.secretScanning ? "bg-card border-amber-500/50" : "bg-card border-border")}>
                     <div className="flex justify-between items-start mb-3">
                         <KeyRound className={cn("w-6 h-6", config.security.secretScanning ? "text-amber-400" : "text-muted-foreground")} />
                         <Switch checked={config.security.secretScanning} onCheckedChange={(v) => updateConfig({ security: { ...config.security, secretScanning: v } })} />
                     </div>
                     <h4 className="text-sm font-semibold text-foreground">Secret Scanning</h4>
                     <p className="text-xs text-muted-foreground mt-1">Prevent fraudulent use of secrets committed accidentally.</p>
                 </div>
             </div>

             <div className="p-4 rounded-xl border border-border bg-card">
                 <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                             <RefreshCw className="w-5 h-5" />
                         </div>
                         <div>
                             <h4 className="text-sm font-semibold text-foreground">Dependency Updates</h4>
                             <p className="text-xs text-muted-foreground">Keep your dependencies secure and up-to-date.</p>
                         </div>
                     </div>
                     <Switch checked={config.security.dependencyUpdates} onCheckedChange={(v) => updateConfig({ security: { ...config.security, dependencyUpdates: v } })} />
                 </div>

                 {config.security.dependencyUpdates && (
                     <div className="pl-12 animate-in slide-in-from-top-2">
                         <Label className="text-xs mb-2 block">Update Frequency</Label>
                         <div className="flex gap-2">
                             {DEPENDENCY_FREQUENCIES.map((freq) => (
                                 <Badge 
                                    key={freq}
                                    variant={config.security.dependencyUpdateFrequency === freq ? 'default' : 'outline'}
                                    className="cursor-pointer capitalize"
                                    onClick={() => updateConfig({ security: { ...config.security, dependencyUpdateFrequency: freq } })}
                                 >
                                     {freq}
                                 </Badge>
                             ))}
                         </div>
                     </div>
                 )}
             </div>

             <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                 <div className="flex items-center gap-3">
                     <Lock className="w-5 h-5 text-muted-foreground" />
                     <div>
                         <h4 className="text-sm font-semibold text-foreground">Environment Management</h4>
                         <p className="text-xs text-muted-foreground">Scaffold .env.example and .gitignore rules.</p>
                     </div>
                 </div>
                 <Switch checked={config.security.manageEnv} onCheckedChange={(v) => updateConfig({ security: { ...config.security, manageEnv: v } })} />
             </div>

        </div>
    );
};

// --- Step 7: GitHub Ops ---
export const StepGitHub = () => {
    const { config, updateConfig } = useStore();
    const [newTopic, setNewTopic] = useState('');

    const addTopic = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newTopic.trim()) {
            if (!config.github.topics.includes(newTopic.trim())) {
                updateConfig({ github: { ...config.github, topics: [...config.github.topics, newTopic.trim()] } });
            }
            setNewTopic('');
        }
    }

    const removeTopic = (t: string) => {
        updateConfig({ github: { ...config.github, topics: config.github.topics.filter(topic => topic !== t) } });
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
            <Tabs defaultValue="general" className="w-full">
                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="sm:w-1/4">
                        <TabsList className="flex-col h-auto w-full bg-transparent gap-1 p-0">
                            {[
                                { id: 'general', label: 'General', icon: Settings },
                                { id: 'rules', label: 'Rules & Branching', icon: GitBranch },
                                { id: 'actions', label: 'Actions & Runners', icon: PlayCircle },
                                { id: 'webhooks', label: 'Webhooks', icon: WebhookIcon },
                                { id: 'envs', label: 'Environments', icon: Cloud },
                                { id: 'secrets', label: 'Secrets', icon: KeyRound },
                            ].map((tab) => (
                                <TabsTrigger 
                                    key={tab.id}
                                    value={tab.id}
                                    activeValue="" // Handled by parent Tab
                                    className="w-full justify-start gap-2 px-3 py-2 text-sm text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:border-l-2 border-l-primary rounded-none transition-all hover:text-foreground"
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>
                    
                    <div className="sm:w-3/4">
                        {/* General Tab */}
                        <TabsContent value="general" className="mt-0 space-y-6">
                             <div className="space-y-4">
                                <div>
                                    <Label>Repository Topics</Label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {config.github.topics.map(t => (
                                            <Badge key={t} variant="secondary" className="px-2 py-1 gap-1">
                                                {t}
                                                <X className="w-3 h-3 cursor-pointer hover:text-red-400" onClick={() => removeTopic(t)} />
                                            </Badge>
                                        ))}
                                    </div>
                                    <Input 
                                        value={newTopic}
                                        onChange={(e) => setNewTopic(e.target.value)}
                                        onKeyDown={addTopic}
                                        placeholder="Add topic (Press Enter)..."
                                        className="h-8 text-xs"
                                    />
                                </div>

                                <div className="h-px bg-border my-4" />

                                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                                    <div className="flex gap-3 items-center">
                                        <Bot className="w-5 h-5 text-primary" />
                                        <div>
                                            <span className="block text-sm text-foreground">GitHub Copilot</span>
                                            <span className="text-xs text-muted-foreground">Enable Enterprise features</span>
                                        </div>
                                    </div>
                                    <Switch 
                                        checked={config.github.copilot}
                                        onCheckedChange={(v) => updateConfig({ github: { ...config.github, copilot: v } })}
                                    />
                                </div>

                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-6 mb-3">Pull Requests</h4>
                                <div className="space-y-2">
                                     <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                                        <span className="text-sm text-foreground">Allow Squash Merge</span>
                                        <Switch 
                                            checked={config.github.pr.allowSquashMerge}
                                            onCheckedChange={(v) => updateConfig({ github: { ...config.github, pr: { ...config.github.pr, allowSquashMerge: v } } })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                                        <span className="text-sm text-foreground">Delete Branch on Merge</span>
                                        <Switch 
                                            checked={config.github.pr.deleteBranchOnMerge}
                                            onCheckedChange={(v) => updateConfig({ github: { ...config.github, pr: { ...config.github.pr, deleteBranchOnMerge: v } } })}
                                        />
                                    </div>
                                </div>
                             </div>
                        </TabsContent>

                        {/* Rules/Branches Tab */}
                        <TabsContent value="rules" className="mt-0 space-y-6">
                             <div className="space-y-4">
                                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-xs text-blue-500 flex gap-2">
                                    <Info className="w-4 h-4 shrink-0" />
                                    Using GitHub Rulesets for enhanced protection on the default branch.
                                </div>

                                <div>
                                    <Label>Default Branch Name</Label>
                                    <Input 
                                        value={config.github.branches.default}
                                        onChange={(e) => updateConfig({ github: { ...config.github, branches: { ...config.github.branches, default: e.target.value } } })}
                                        className="mt-2"
                                    />
                                </div>
                                
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-6 mb-3">Enforcement Rules</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                                        <div>
                                            <span className="block text-sm text-foreground">Require Pull Request</span>
                                            <span className="text-xs text-muted-foreground">Enforce code review before merging</span>
                                        </div>
                                        <Switch 
                                            checked={config.github.branches.protection.requirePr}
                                            onCheckedChange={(v) => updateConfig({ github: { ...config.github, branches: { ...config.github.branches, protection: { ...config.github.branches.protection, requirePr: v } } } })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                                        <div>
                                            <span className="block text-sm text-foreground">Require Signed Commits</span>
                                            <span className="text-xs text-muted-foreground">Block unverified signatures</span>
                                        </div>
                                        <Switch 
                                            checked={config.github.branches.protection.requireSignedCommits}
                                            onCheckedChange={(v) => updateConfig({ github: { ...config.github, branches: { ...config.github.branches, protection: { ...config.github.branches.protection, requireSignedCommits: v } } } })}
                                        />
                                    </div>
                                     <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                                        <div>
                                            <span className="block text-sm text-foreground">Require Linear History</span>
                                            <span className="text-xs text-muted-foreground">Prevent merge commits</span>
                                        </div>
                                        <Switch 
                                            checked={config.github.branches.protection.requireLinearHistory}
                                            onCheckedChange={(v) => updateConfig({ github: { ...config.github, branches: { ...config.github.branches, protection: { ...config.github.branches.protection, requireLinearHistory: v } } } })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                                        <div>
                                            <span className="block text-sm text-foreground">Required Reviewers</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                size="sm" variant="ghost" className="h-6 w-6 p-0"
                                                onClick={() => updateConfig({ github: { ...config.github, branches: { ...config.github.branches, protection: { ...config.github.branches.protection, requiredReviewers: Math.max(0, config.github.branches.protection.requiredReviewers - 1) } } } })}
                                            >-</Button>
                                            <span className="text-sm w-4 text-center text-foreground">{config.github.branches.protection.requiredReviewers}</span>
                                            <Button 
                                                size="sm" variant="ghost" className="h-6 w-6 p-0"
                                                onClick={() => updateConfig({ github: { ...config.github, branches: { ...config.github.branches, protection: { ...config.github.branches.protection, requiredReviewers: Math.min(6, config.github.branches.protection.requiredReviewers + 1) } } } })}
                                            >+</Button>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </TabsContent>

                        {/* Actions Tab */}
                        <TabsContent value="actions" className="mt-0 space-y-6">
                            <div className="space-y-4">
                                <Label className="mb-2 block">Workflow Permissions</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {ACTION_PERMISSION_OPTIONS.map((p) => (
                                        <div 
                                            key={p}
                                            onClick={() => updateConfig({ github: { ...config.github, actions: { ...config.github.actions, permissions: p } } })}
                                            className={cn(
                                                "p-3 border rounded-lg cursor-pointer text-center text-xs font-medium capitalize transition-all",
                                                config.github.actions.permissions === p ? "bg-primary/20 text-primary border-primary/50" : "bg-card text-muted-foreground border-border hover:bg-accent"
                                            )}
                                        >
                                            {p}
                                        </div>
                                    ))}
                                </div>

                                <Label className="mb-2 block mt-4">Runners</Label>
                                <div className="grid grid-cols-2 gap-2">
                                     <div 
                                        onClick={() => updateConfig({ github: { ...config.github, actions: { ...config.github.actions, runners: 'github' } } })}
                                        className={cn(
                                            "p-3 border rounded-lg cursor-pointer flex items-center justify-center gap-2 text-xs font-medium transition-all",
                                            config.github.actions.runners === 'github' ? "bg-accent text-foreground" : "bg-card text-muted-foreground border-border"
                                        )}
                                    >
                                        <Cloud className="w-3 h-3" /> GitHub Hosted
                                    </div>
                                     <div 
                                        onClick={() => updateConfig({ github: { ...config.github, actions: { ...config.github.actions, runners: 'self-hosted' } } })}
                                        className={cn(
                                            "p-3 border rounded-lg cursor-pointer flex items-center justify-center gap-2 text-xs font-medium transition-all",
                                            config.github.actions.runners === 'self-hosted' ? "bg-accent text-foreground" : "bg-card text-muted-foreground border-border"
                                        )}
                                    >
                                        <Server className="w-3 h-3" /> Self-Hosted
                                    </div>
                                </div>

                                <div className="h-px bg-border my-4" />

                                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                                    <div>
                                        <span className="block text-sm text-foreground">Allow GitHub Actions to create PRs</span>
                                    </div>
                                    <Switch 
                                        checked={config.github.actions.allowPr}
                                        onCheckedChange={(v) => updateConfig({ github: { ...config.github, actions: { ...config.github.actions, allowPr: v } } })}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Webhooks Tab (New) */}
                        <TabsContent value="webhooks" className="mt-0 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Active Webhooks</Label>
                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                                        const url = prompt("Webhook URL");
                                        if (url) {
                                            const newHook = { id: Date.now().toString(), url, contentType: 'json' as const, events: ['push' as const], active: true };
                                            updateConfig({ github: { ...config.github, webhooks: [...config.github.webhooks, newHook] } })
                                        }
                                    }}>
                                        <Plus className="w-3 h-3 mr-1" /> Add
                                    </Button>
                                </div>
                                
                                {config.github.webhooks.length === 0 ? (
                                    <div className="p-8 border border-dashed border-border rounded-xl text-center">
                                        <WebhookIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-muted-foreground text-sm">No webhooks configured.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {config.github.webhooks.map((hook) => (
                                            <div key={hook.id} className="p-3 border border-border rounded-lg bg-card flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-1.5 bg-muted rounded">
                                                        <WebhookIcon className="w-4 h-4 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-foreground truncate max-w-[200px]">{hook.url}</div>
                                                        <div className="text-[10px] text-muted-foreground">json • push</div>
                                                    </div>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                    onClick={() => updateConfig({ github: { ...config.github, webhooks: config.github.webhooks.filter(h => h.id !== hook.id) } })}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Environments Tab */}
                        <TabsContent value="envs" className="mt-0 space-y-6">
                            <div className="space-y-4">
                                <Label className="mb-2 block">Deployment Environments</Label>
                                <div className="space-y-2">
                                    {['production', 'staging', 'development'].map((env) => (
                                        <div key={env} className={cn("flex items-center justify-between p-3 rounded-lg border transition-all", config.github.environments.includes(env) ? "bg-emerald-500/5 border-emerald-500/20" : "bg-card border-border opacity-60")}>
                                            <div className="flex items-center gap-2">
                                                <Cloud className={cn("w-4 h-4", config.github.environments.includes(env) ? "text-emerald-400" : "text-muted-foreground")} />
                                                <span className="text-sm capitalize text-foreground">{env}</span>
                                            </div>
                                            <Switch 
                                                checked={config.github.environments.includes(env)}
                                                onCheckedChange={(v) => {
                                                    const newEnvs = v 
                                                        ? [...config.github.environments, env]
                                                        : config.github.environments.filter(e => e !== env);
                                                    updateConfig({ github: { ...config.github, environments: newEnvs } });
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Secrets Tab */}
                         <TabsContent value="secrets" className="mt-0 space-y-6">
                             <div className="space-y-4">
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-500 mb-4">
                                    <p>We cannot set actual secret values. Defined secrets will be listed as requirements in the generated plan and README.</p>
                                </div>

                                <Label className="mb-2 block">Required Secrets</Label>
                                <div className="flex flex-wrap gap-2">
                                    {config.github.secrets.map((secret) => (
                                        <Badge key={secret} variant="outline" className="px-3 py-1 flex gap-2 items-center bg-card border-border">
                                            {secret}
                                            <button 
                                                onClick={() => updateConfig({ github: { ...config.github, secrets: config.github.secrets.filter(s => s !== secret) } })}
                                                className="hover:text-destructive"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                    <div className="flex items-center">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-xs h-6 px-2 text-muted-foreground border border-dashed border-border hover:text-foreground"
                                            onClick={() => {
                                                const name = prompt("Enter secret name (e.g. AWS_KEY)");
                                                if (name) updateConfig({ github: { ...config.github, secrets: [...config.github.secrets, name.toUpperCase()] } });
                                            }}
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Add Secret
                                        </Button>
                                    </div>
                                </div>
                             </div>
                        </TabsContent>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}

// --- Step 8: Docs & Standards ---
export const StepDocs = () => {
    const { config, updateConfig, userMode, engineDecisions } = useStore();

    const standardFiles = [
        { id: 'readme', label: 'README.md', desc: 'Project overview and setup instructions', icon: FileText },
        { id: 'contributing', label: 'CONTRIBUTING.md', desc: 'Guidelines for contributors', icon: Users },
        { id: 'codeowners', label: 'CODEOWNERS', desc: 'Define who is responsible for code', icon: Shield },
        { id: 'pullRequestTemplate', label: 'PR Template', desc: 'Standardize Pull Request descriptions', icon: GitPullRequest },
        { id: 'issueTemplates', label: 'Issue Templates', desc: 'Standardize bug reports & feature requests', icon: ListTodo },
        { id: 'adr', label: 'ADRs', desc: 'Architecture Decision Records', icon: ScrollText },
    ];

    const frameworks: {id: DocFramework, label: string, icon: LucideIcon}[] = [
        { id: 'none', label: 'None', icon: X },
        { id: 'docusaurus', label: 'Docusaurus', icon: BookOpen },
        { id: 'vitepress', label: 'VitePress', icon: Zap },
        { id: 'mkdocs', label: 'MkDocs', icon: FileText }
    ];

    const styles: {id: DocStyle, label: string, desc: string}[] = [
        { id: 'none', label: 'None', desc: 'No specific style enforced' },
        { id: 'diataxis', label: 'Diataxis', desc: 'Tutorials, How-To, Reference, Explanation' },
        { id: 'microsoft', label: 'Microsoft', desc: 'Warm, conversational, and precise' },
        { id: 'google', label: 'Google', desc: 'Clear, concise, and objective' }
    ];

    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
             <div>
                <Label className="mb-4 block text-muted-foreground">Standard Files</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {standardFiles.map((file) => {
                         const fileId = file.id as keyof typeof config.docs;
                         const isActive = config.docs[fileId] as boolean;
                         return (
                            <div
                                key={file.id}
                                onClick={() => updateConfig({ docs: { ...config.docs, [file.id]: !isActive } })}
                                className={cn("p-3 border rounded-lg cursor-pointer transition-all flex items-start gap-3", isActive ? 'bg-primary/10 border-primary/40' : 'bg-card border-border hover:bg-accent')}
                            >
                                <div className={cn("p-1.5 rounded bg-muted border border-border", isActive ? 'text-primary' : 'text-muted-foreground')}>
                                    <file.icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className={cn("text-sm font-medium", isActive ? 'text-foreground' : 'text-muted-foreground')}>{file.label}</div>
                                    <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{file.desc}</div>
                                </div>
                                <div className={cn("ml-auto w-4 h-4 rounded-full border flex items-center justify-center", isActive ? 'bg-primary border-primary' : 'border-muted-foreground')}>
                                    {isActive && <Check className="w-3 h-3 text-white" />}
                                </div>
                            </div>
                        )
                    })}
                </div>
             </div>

             <div className="pt-6 border-t border-border space-y-6">
                 {/* Framework Selection */}
                 <div>
                    <Label className="mb-3 block">Documentation Site Generator</Label>
                    <div className="grid grid-cols-4 gap-3">
                        {frameworks.map((fw) => (
                            <div
                                key={fw.id}
                                onClick={() => updateConfig({ docs: { ...config.docs, framework: fw.id } })}
                                className={cn(
                                    "p-2 rounded-lg border text-center text-xs cursor-pointer transition-all flex flex-col items-center gap-2 py-3", 
                                    config.docs.framework === fw.id 
                                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' 
                                        : 'bg-card text-muted-foreground border-border hover:border-foreground/30'
                                )}
                            >
                                <fw.icon className="w-4 h-4" />
                                {fw.label}
                            </div>
                        ))}
                    </div>
                 </div>

                {/* Framework Options */}
                {config.docs.framework !== 'none' && (
                    <div className="space-y-4 animate-in slide-in-from-top-2">
                         <div className="flex items-center justify-between p-3 border rounded-lg bg-card border-border">
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">Deploy to GitHub Pages</span>
                            </div>
                            <Switch
                                checked={config.docs.deployToPages}
                                onCheckedChange={(v) => updateConfig({ docs: { ...config.docs, deployToPages: v } })}
                            />
                        </div>
                    </div>
                )}

                {/* Style Guide Selection */}
                 <div>
                    <Label className="mb-3 block">Documentation Style Guide</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {styles.map((style) => (
                            <div
                                key={style.id}
                                onClick={() => updateConfig({ docs: { ...config.docs, styleGuide: style.id } })}
                                className={cn(
                                    "p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3",
                                    config.docs.styleGuide === style.id
                                        ? 'bg-pink-500/10 border-pink-500/50'
                                        : 'bg-card border-border hover:bg-accent'
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0",
                                    config.docs.styleGuide === style.id ? "border-pink-500 bg-pink-500" : "border-muted-foreground"
                                )}>
                                    {config.docs.styleGuide === style.id && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div>
                                    <div className={cn("text-sm font-medium", config.docs.styleGuide === style.id ? 'text-pink-300' : 'text-foreground')}>{style.label}</div>
                                    <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{style.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>

             </div>

        </div>
    );
}

// --- Step 9: Review ---
export const StepReview = () => {
    const { config, engineDecisions, workflowPhase, userMode } = useStore();

    const sections = [
        { title: 'Project', icon: Package, items: [
            { label: 'Name', value: config.projectName },
            { label: 'Visibility', value: config.visibility },
            { label: 'Structure', value: config.structure },
            { label: 'Type', value: config.type },
        ]},
        { title: 'Stack', icon: Layers, items: [
            { label: 'Language', value: config.stack.language },
            { label: 'Framework', value: config.stack.framework || 'None' },
            { label: 'Package Manager', value: config.stack.packageManager },
            { label: 'Builder', value: config.stack.builder },
            { label: 'Strategy', value: config.stack.dependencyStrategy },
        ]},
         { title: 'Quality', icon: Shield, items: [
            { label: 'Linter', value: config.quality.linter },
            { label: 'Testing', value: config.quality.testing ? config.quality.testFramework : 'Disabled' },
            { label: 'Platform', value: config.quality.qualityPlatform },
        ]},
        { title: 'Security', icon: Lock, items: [
             { label: 'Scanning', value: config.security.codeScanning ? 'Enabled' : 'Disabled' },
             { label: 'Secrets', value: config.security.secretScanning ? 'Enabled' : 'Disabled' },
             { label: 'Updates', value: config.security.dependencyUpdates ? config.security.dependencyUpdateFrequency : 'Disabled' },
             { label: '.env Strategy', value: config.security.manageEnv ? 'Gitignore' : 'Manual' },
        ]},
        { title: 'GitHub Ops', icon: Settings, items: [
            { label: 'Default Branch', value: config.github.branches.default },
            { label: 'Rulesets', value: 'Enabled' },
            { label: 'Webhooks', value: config.github.webhooks.length },
            { label: 'Copilot', value: config.github.copilot ? 'Enabled' : 'Disabled' },
       ]}
    ];

    return (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
             <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Ready to Bootstrap?</h3>
                <p className="text-muted-foreground text-sm">Review your configuration before generating the repository plan.</p>
             </div>

             <div className="space-y-3">
                {engineDecisions.map((decision) => (
                    <DecisionCard key={decision.key} decision={decision} />
                ))}
             </div>

             {userMode === 'power' && <ConflictResolutionPanel />}

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sections.map((s, i) => (
                    <Card key={i} className="bg-card/50 border-border p-4">
                        <div className="flex items-center gap-2 mb-3 border-b border-border pb-2">
                            <s.icon className="w-4 h-4 text-primary" />
                            <span className="font-semibold text-sm text-foreground">{s.title}</span>
                        </div>
                        <div className="space-y-2">
                            {s.items.map((item, j) => (
                                <div key={j} className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">{item.label}</span>
                                    <span className="text-foreground font-medium">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
             </div>

             {workflowPhase === 'apply' && <ApplyScreen />}
        </div>
    );
}
