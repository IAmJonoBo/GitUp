import React, { useState } from 'react';
import { Card, Button, Badge, Input, Label } from '../ui/primitives';
import { useStore } from '../../store';
import { PlanConfigPatch, Preset } from '../../types';
import { Rocket, Shield, Box, Layout, Server, BookOpen, Layers, Plus, Save, Trash2, X, type LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';

type PresetTone = 'blue' | 'purple' | 'emerald' | 'cyan' | 'sky' | 'orange' | 'zinc';

interface PresetCardData {
  id: string;
  name: string;
  description: string;
  config?: PlanConfigPatch;
  bundleIds?: string[];
  tone: PresetTone;
  icon?: LucideIcon;
}

const toneStyles: Record<PresetTone, { bar: string; barHover: string; icon: string }> = {
  blue: {
    bar: 'bg-blue-500/50',
    barHover: 'group-hover:bg-blue-500',
    icon: 'bg-blue-500/10 text-blue-400',
  },
  purple: {
    bar: 'bg-purple-500/50',
    barHover: 'group-hover:bg-purple-500',
    icon: 'bg-purple-500/10 text-purple-400',
  },
  emerald: {
    bar: 'bg-emerald-500/50',
    barHover: 'group-hover:bg-emerald-500',
    icon: 'bg-emerald-500/10 text-emerald-400',
  },
  cyan: {
    bar: 'bg-cyan-500/50',
    barHover: 'group-hover:bg-cyan-500',
    icon: 'bg-cyan-500/10 text-cyan-400',
  },
  sky: {
    bar: 'bg-sky-500/50',
    barHover: 'group-hover:bg-sky-500',
    icon: 'bg-sky-500/10 text-sky-400',
  },
  orange: {
    bar: 'bg-orange-500/50',
    barHover: 'group-hover:bg-orange-500',
    icon: 'bg-orange-500/10 text-orange-400',
  },
  zinc: {
    bar: 'bg-zinc-500/50',
    barHover: 'group-hover:bg-zinc-500',
    icon: 'bg-zinc-500/10 text-zinc-300',
  },
};

const governancePresets: PresetCardData[] = [
  {
    id: 'starter',
    name: 'Solo Quickstart',
    description: 'Perfect for hackathons or hobby projects. Minimal friction, standard defaults.',
    icon: Rocket,
    tone: 'blue',
    bundleIds: ['bundle.governance.solo-quickstart'],
    config: {
      type: 'Web App',
      structure: 'Polyrepo',
    },
  },
  {
    id: 'team',
    name: 'Team Standard',
    description: 'Balanced for small to medium teams. Enforces code quality without slowing you down.',
    icon: Box,
    tone: 'purple',
    bundleIds: ['bundle.governance.team-standard'],
    config: {
      type: 'Service',
      structure: 'Polyrepo',
    },
  },
  {
    id: 'enterprise',
    name: 'Hardened Enterprise',
    description: 'Maximum security and governance. Strict gates, full documentation required.',
    icon: Shield,
    tone: 'emerald',
    bundleIds: ['bundle.governance.enterprise'],
    config: {
      type: 'Library',
    },
  },
];

const stackTemplates: PresetCardData[] = [
  {
    id: 'next-full',
    name: 'Full-Stack Next.js',
    description: 'Opinionated web stack with TypeScript, Tailwind, Vitest, and Playwright.',
    icon: Layout,
    tone: 'cyan',
    bundleIds: ['bundle.stack.next-full'],
    config: {
      type: 'Web App',
    },
  },
  {
    id: 'go-api',
    name: 'High-Performance API Service',
    description: 'Go microservice with Gin, Docker builds, and Clean Architecture folders.',
    icon: Server,
    tone: 'sky',
    bundleIds: ['bundle.stack.go-api'],
  },
  {
    id: 'docs-site',
    name: 'VitePress Documentation',
    description: 'Static documentation site pre-configured for GitHub Pages deployment.',
    icon: BookOpen,
    tone: 'orange',
    bundleIds: ['bundle.stack.docs-site'],
    config: {
      type: 'Web App',
    },
  },
];

export const Presets = () => {
  const { applyPreset, customPresets, addCustomPreset, deleteCustomPreset, config: currentConfig } = useStore();
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');

  const handleSavePreset = () => {
    const trimmedName = newPresetName.trim();
    if (!trimmedName) return;

    const preset: Preset = {
      id: `custom-${Date.now()}`,
      name: trimmedName,
      description: newPresetDesc || 'Custom configuration',
      config: structuredClone(currentConfig),
      bundleIds: [],
    };

    addCustomPreset(preset);
    setIsSaveModalOpen(false);
    setNewPresetName('');
    setNewPresetDesc('');
  };

  const renderCard = (preset: PresetCardData, isCustom = false) => {
    const style = toneStyles[preset.tone];
    const Icon = preset.icon ?? Save;

    return (
      <Card key={preset.id} className="bg-zinc-900 border-white/10 flex flex-col hover:border-white/20 transition-all hover:-translate-y-1 group relative overflow-hidden">
        <div className={cn('h-1 w-full rounded-t-xl transition-colors', style.bar, style.barHover)} />
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className={cn('p-3 rounded-xl flex items-center justify-center', style.icon)}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex gap-2">
              {preset.id === 'next-full' && <Badge variant="cyber" className="opacity-80">Popular</Badge>}
              {isCustom && <Badge variant="outline" className="border-zinc-700 bg-zinc-800">Custom</Badge>}
            </div>
          </div>

          <h3 className="text-lg font-bold text-white mb-2">{preset.name}</h3>
          <p className="text-sm text-zinc-400 leading-relaxed mb-6 flex-1">
            {preset.description}
          </p>

          <div className="flex gap-2">
            <Button
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/5"
              variant="ghost"
              onClick={() => applyPreset({ config: preset.config, bundleIds: preset.bundleIds })}
            >
              Use Template
            </Button>
            {isCustom && (
              <Button
                className="bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/20 px-3"
                variant="ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  deleteCustomPreset(preset.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const customPresetCards: PresetCardData[] = customPresets.map((preset) => ({
    ...preset,
    tone: 'zinc',
  }));

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold text-white mb-3">Project Blueprints</h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">Start from a governance baseline or a fully-configured tech stack template. You can also save your own configurations.</p>
      </div>

      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Save className="w-4 h-4" /> My Custom Presets
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => setIsSaveModalOpen(true)}
            className="border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-zinc-700 hover:bg-zinc-900/30 transition-all group min-h-[250px]"
          >
            <div className="p-4 bg-zinc-900 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-zinc-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-300">Save Current Config</h3>
            <p className="text-sm text-zinc-500 text-center mt-2 max-w-[200px]">
              Create a new preset based on your current wizard selections
            </p>
          </div>

          {customPresetCards.map((preset) => renderCard(preset, true))}
        </div>
      </div>

      <div className="mb-12">
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Governance Baselines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {governancePresets.map((preset) => renderCard(preset))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Layers className="w-4 h-4" /> Stack Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stackTemplates.map((preset) => renderCard(preset))}
        </div>
      </div>

      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsSaveModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 p-6 rounded-xl shadow-2xl w-full max-w-md relative z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Save Preset</h3>
                <button onClick={() => setIsSaveModalOpen(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Preset Name</Label>
                  <Input
                    autoFocus
                    value={newPresetName}
                    onChange={(event) => setNewPresetName(event.target.value)}
                    placeholder="e.g. My Microservice Standard"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newPresetDesc}
                    onChange={(event) => setNewPresetDesc(event.target.value)}
                    placeholder="Optional description..."
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button variant="ghost" className="flex-1" onClick={() => setIsSaveModalOpen(false)}>Cancel</Button>
                <Button className="flex-1 bg-white text-black hover:bg-zinc-200" onClick={handleSavePreset} disabled={!newPresetName.trim()}>
                  Save Preset
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
