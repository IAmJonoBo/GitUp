import React, { Suspense } from 'react';
import { useStore, AppView } from './store';
import { Package, Settings as SettingsIcon, HelpCircle, FileText, Download, Rocket, X, Menu, Check, type LucideIcon } from 'lucide-react';
import { Button } from './components/ui/primitives';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { FileIcon } from './components/ui/FileIcon';
import { cn } from './lib/utils';
import { MultiplierBadge } from './components/app/MultiplierBadge';

const Wizard = React.lazy(() => import('./components/wizard/Wizard').then((module) => ({ default: module.Wizard })));
const Presets = React.lazy(() => import('./components/app/Presets').then((module) => ({ default: module.Presets })));
const Glossary = React.lazy(() => import('./components/app/Glossary').then((module) => ({ default: module.Glossary })));
const Settings = React.lazy(() => import('./components/app/Settings').then((module) => ({ default: module.Settings })));
const Export = React.lazy(() => import('./components/app/Export').then((module) => ({ default: module.Export })));
const RepoTree = React.lazy(() => import('./components/preview/RepoTree').then((module) => ({ default: module.RepoTree })));
const WorkflowGraph = React.lazy(() => import('./components/preview/WorkflowGraph').then((module) => ({ default: module.WorkflowGraph })));
const PostureChart = React.lazy(() => import('./components/preview/Charts').then((module) => ({ default: module.PostureChart })));
const MaintenanceForecast = React.lazy(() => import('./components/preview/Charts').then((module) => ({ default: module.MaintenanceForecast })));

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

interface NavigationItem {
  view: AppView;
  label: string;
  icon: LucideIcon;
}

const primaryNavigation: NavigationItem[] = [
  { view: 'wizard', label: 'New Project', icon: Package },
  { view: 'presets', label: 'Presets', icon: FileText },
  { view: 'export', label: 'Export Plan', icon: Download },
];

const secondaryNavigation: NavigationItem[] = [
  { view: 'settings', label: 'Settings', icon: SettingsIcon },
  { view: 'help', label: 'Help & Glossary', icon: HelpCircle },
];

const viewTitles: Record<AppView, string> = {
  wizard: 'New Project Wizard',
  presets: 'Presets',
  settings: 'Settings',
  help: 'Help',
  export: 'Export',
};

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: SidebarItemProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors',
      active
        ? 'bg-zinc-800 text-white shadow-inner shadow-black/20'
        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50',
    )}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const LoadingState = ({ message }: { message: string }) => (
  <div className="h-full w-full flex items-center justify-center text-zinc-500 text-sm">
    <span className="animate-pulse">{message}</span>
  </div>
);

const SimulationOverlay = () => {
  const { isSimulating, simulationLog, reset, config } = useStore();
  const showOverlay = isSimulating || simulationLog.length > 0;
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [simulationLog]);

  const handleDownload = () => {
    const file = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const element = document.createElement('a');
    element.href = url;
    element.download = `${config.projectName}-bootstrapper-plan.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-950 text-emerald-400 font-mono p-6 rounded-xl shadow-[0_0_50px_rgba(16,185,129,0.2)] w-[600px] max-w-full border border-emerald-500/30 flex flex-col max-h-[80vh]"
          >
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4 mb-4 shrink-0">
              <span className="text-emerald-300 font-bold flex items-center gap-2">
                <Rocket className="w-4 h-4 animate-pulse" />
                {isSimulating ? 'Bootstrapping Repo...' : 'Bootstrap Complete'}
              </span>
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/20" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/20" />
                  <div className={cn('w-3 h-3 rounded-full', !isSimulating ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-emerald-500/20')} />
                </div>
                {!isSimulating && (
                  <button onClick={reset} className="text-zinc-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <div ref={scrollRef} className="space-y-1 overflow-y-auto font-mono text-sm leading-relaxed scrollbar-thin flex-1 min-h-0 pr-2">
              {simulationLog.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 py-0.5"
                >
                  {log.type === 'file' ? (
                    <>
                      <div className="w-4 h-4 flex items-center justify-center">
                        <FileIcon name={log.fileName || ''} />
                      </div>
                      <span className="text-zinc-300">{log.message}</span>
                    </>
                  ) : log.type === 'success' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-400 font-bold">{log.message}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-zinc-600 w-4 text-center">{'>'}</span>
                      <span className="text-emerald-400/80">{log.message}</span>
                    </>
                  )}
                </motion.div>
              ))}
              {isSimulating && <div className="animate-pulse text-zinc-500 ml-6">_</div>}
            </div>

            {!isSimulating && (
              <div className="mt-6 pt-4 border-t border-emerald-500/20 flex justify-between items-center shrink-0">
                <span className="text-xs text-zinc-500">Repo created in /tmp/preview</span>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleDownload} className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-950">
                    <Download className="w-4 h-4 mr-2" /> Download Plan
                  </Button>
                  <Button onClick={reset} className="bg-emerald-900/50 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                    Close
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const PreviewPane = ({ className }: { className?: string }) => (
  <div className={cn('bg-[#0B0F19] p-6 overflow-y-auto space-y-6 scrollbar-thin shadow-inner h-full', className)}>
    <div className="flex items-center justify-between">
      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Live Preview</h2>
      <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        Auto-updating
      </span>
    </div>

    <Suspense fallback={<LoadingState message="Loading previews..." />}>
      <div className="space-y-6">
        <RepoTree />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <PostureChart />
          <WorkflowGraph />
        </div>
        <MaintenanceForecast />
      </div>
    </Suspense>
  </div>
);

const App = () => {
  const {
    currentView,
    setCurrentView,
    reset,
    mobilePreviewOpen,
    toggleMobilePreview,
    theme,
    reducedMotion,
  } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const handleNav = (view: AppView) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'wizard':
        return <Wizard />;
      case 'presets':
        return <Presets />;
      case 'help':
        return <Glossary />;
      case 'settings':
        return <Settings />;
      case 'export':
        return <Export />;
      default:
        return <Wizard />;
    }
  };

  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'never'}>
      <div className="flex h-screen bg-zinc-950 overflow-hidden font-sans text-zinc-200 selection:bg-purple-500/30 transition-colors duration-300">
        <aside className="w-64 bg-[#0B0F19] border-r border-white/5 flex-col p-4 z-10 hidden md:flex shadow-2xl">
          <button
            type="button"
            className="flex items-center gap-2 px-2 mb-8 mt-2 cursor-pointer text-left"
            onClick={() => handleNav('wizard')}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <Rocket className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">Bootstrapper</span>
          </button>

          <nav className="flex-1 space-y-1">
            {primaryNavigation.map((item) => (
              <SidebarItem
                key={item.view}
                icon={item.icon}
                label={item.label}
                active={currentView === item.view}
                onClick={() => handleNav(item.view)}
              />
            ))}
          </nav>

          <div className="pt-4 mt-4 border-t border-white/5 space-y-1">
            {secondaryNavigation.map((item) => (
              <SidebarItem
                key={item.view}
                icon={item.icon}
                label={item.label}
                active={currentView === item.view}
                onClick={() => handleNav(item.view)}
              />
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative transition-colors duration-300">
          <header className="h-16 bg-[#0B0F19]/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-20">
            <div className="flex items-center gap-4">
              <button className="md:hidden text-zinc-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-sm font-semibold text-white">{viewTitles[currentView]}</h1>
                <p className="text-xs text-zinc-500 hidden sm:block">Configure your repository defaults</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentView === 'wizard' && (
                <>
                  <MultiplierBadge />
                  <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hidden sm:inline-flex" onClick={reset}>
                    Reset
                  </Button>
                </>
              )}
            </div>
          </header>

          {mobileMenuOpen && (
            <div className="absolute top-16 left-0 w-full bg-zinc-900 border-b border-white/10 z-30 p-4 md:hidden shadow-xl animate-in slide-in-from-top-2">
              <nav className="space-y-1">
                {[...primaryNavigation, ...secondaryNavigation].map((item) => (
                  <SidebarItem
                    key={item.view}
                    icon={item.icon}
                    label={item.label}
                    active={currentView === item.view}
                    onClick={() => handleNav(item.view)}
                  />
                ))}
              </nav>
            </div>
          )}

          <div className="flex-1 flex overflow-hidden relative">
            <div className="w-full md:w-1/2 lg:w-7/12 overflow-y-auto border-r border-white/5 bg-zinc-950 scrollbar-thin">
              <Suspense fallback={<LoadingState message="Loading view..." />}>
                {renderContent()}
              </Suspense>
            </div>

            <div className="hidden md:block w-1/2 lg:w-5/12">
              <PreviewPane />
            </div>

            <AnimatePresence>
              {mobilePreviewOpen && (
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="absolute inset-0 z-40 md:hidden bg-[#0B0F19]"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b border-white/5 bg-zinc-900/50">
                      <span className="font-bold text-white">Preview</span>
                      <Button variant="ghost" size="sm" onClick={() => toggleMobilePreview(false)}>
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <PreviewPane className="shadow-none bg-transparent" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <SimulationOverlay />
      </div>
    </MotionConfig>
  );
};

export default App;
