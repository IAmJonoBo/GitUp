import React from "react";
import { useStore } from "../../store";
import { Switch, Card } from "../ui/primitives";
import { Moon, Sun, Monitor, Zap, Eye } from "lucide-react";
import { cn } from "../../lib/utils";

export const Settings = () => {
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);
  const reducedMotion = useStore((state) => state.reducedMotion);
  const setReducedMotion = useStore((state) => state.setReducedMotion);
  const themeOptions = [
    { id: "dark", label: "Dark", icon: Moon },
    { id: "light", label: "Light", icon: Sun },
    { id: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-white mb-3 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-zinc-400" />
          App Settings
        </h2>
        <p className="text-zinc-400">
          Customize your bootstrapping experience.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
            Appearance
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {themeOptions.map((t) => {
              const isSelected = t.id !== "system" && theme === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    if (t.id === "system") return;
                    setTheme(t.id);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-xl border cursor-pointer transition-all",
                    isSelected
                      ? "bg-zinc-800 border-purple-500 text-purple-200"
                      : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300",
                    t.id === "system" && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <t.icon className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">{t.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
            Accessibility
          </h3>
          <Card className="p-6 bg-zinc-900/50 border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-800 rounded-lg text-zinc-400">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-zinc-200">
                    Reduced Motion
                  </h4>
                  <p className="text-sm text-zinc-500 mt-1">
                    Minimize animations throughout the application.
                  </p>
                </div>
              </div>
              <Switch
                checked={reducedMotion}
                onCheckedChange={setReducedMotion}
              />
            </div>
          </Card>
        </section>

        <section>
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
            Defaults
          </h3>
          <Card className="p-6 bg-zinc-900/50 border-white/5 opacity-60">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-800 rounded-lg text-zinc-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-zinc-200">
                  User Preferences
                </h4>
                <p className="text-sm text-zinc-500 mt-1">
                  Author name and email persistence coming soon.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
