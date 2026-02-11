import React from "react";
import { useStore } from "../../store";
import { Button, Switch, Label } from "../ui/primitives";
import {
  StepBasics,
  StepType,
  StepCI,
  StepStack,
  StepQuality,
  StepDocs,
  StepSecurity,
  StepReview,
  StepGitHub,
} from "./StepForms";
import {
  ChevronRight,
  ChevronLeft,
  Flag,
  Check,
  Zap,
  Eye,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import { DiffInterstitial } from "../app/DiffInterstitial";

const steps = [
  { id: "basics", title: "Basics", component: StepBasics },
  { id: "type", title: "Project Type", component: StepType },
  { id: "stack", title: "Tech Stack", component: StepStack },
  { id: "quality", title: "Quality Gates", component: StepQuality },
  { id: "ci", title: "CI Pipeline", component: StepCI },
  { id: "security", title: "Security", component: StepSecurity },
  { id: "github", title: "GitHub Ops", component: StepGitHub },
  { id: "docs", title: "Files", component: StepDocs },
  { id: "review", title: "Review", component: StepReview },
];

export const Wizard = () => {
  const step = useStore((state) => state.step);
  const setStep = useStore((state) => state.setStep);
  const maxStepVisited = useStore((state) => state.maxStepVisited);
  const isSimulating = useStore((state) => state.isSimulating);
  const userMode = useStore((state) => state.userMode);
  const setUserMode = useStore((state) => state.setUserMode);
  const toggleMobilePreview = useStore((state) => state.toggleMobilePreview);
  const mobilePreviewOpen = useStore((state) => state.mobilePreviewOpen);
  const setWorkflowPhase = useStore((state) => state.setWorkflowPhase);
  const CurrentStepComponent = steps[step].component;

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-1">
            {steps[step].title}
          </h2>
          <p className="text-zinc-500 text-sm">
            Step {step + 1} of {steps.length}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            className="md:hidden border-zinc-700 text-zinc-300"
            onClick={() => toggleMobilePreview(!mobilePreviewOpen)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>

          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setUserMode("basic")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                userMode === "basic"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              Basic
            </button>
            <button
              onClick={() => setUserMode("power")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1",
                userMode === "power"
                  ? "bg-purple-900/30 text-purple-300 border border-purple-500/20 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              Power <Zap className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <DiffInterstitial />

      {/* Interactive Stepper */}
      <div className="flex items-center justify-between mb-10 relative px-1">
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-zinc-800 -z-10" />
        <motion.div
          className="absolute top-1/2 left-0 h-[2px] bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 -z-10"
          initial={{ width: "0%" }}
          animate={{ width: `${(step / (steps.length - 1)) * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        {steps.map((s, i) => {
          const isCompleted = i < step;
          const isActive = i === step;
          const canNav = i <= maxStepVisited;

          return (
            <div
              key={s.id}
              className="flex flex-col items-center gap-2 relative bg-zinc-950 px-2 rounded-full group"
            >
              <button
                onClick={() => canNav && setStep(i)}
                disabled={!canNav}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 relative focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-zinc-950 z-10",

                  // Active (Current)
                  isActive &&
                    "bg-zinc-900 text-white border border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)] scale-110",

                  // Completed (Past)
                  isCompleted &&
                    "bg-zinc-900 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(52,211,153,0.3)] cursor-pointer hover:bg-zinc-800 hover:border-emerald-400 hover:scale-105 hover:text-emerald-300",

                  // Future (but visited/navigable - e.g. went back)
                  !isActive &&
                    !isCompleted &&
                    canNav &&
                    "bg-zinc-900 text-zinc-400 border border-zinc-700 cursor-pointer hover:border-zinc-500 hover:text-zinc-200 hover:bg-zinc-800",

                  // Future (Locked)
                  !canNav &&
                    "bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed",
                )}
                aria-label={`Go to step ${s.title}`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : i + 1}

                {/* Tooltip for step title on hover */}
                <span
                  className={cn(
                    "absolute -bottom-8 whitespace-nowrap text-[10px] font-medium tracking-wide transition-opacity bg-zinc-900 border border-white/10 px-2 py-1 rounded shadow-xl z-20",
                    isActive
                      ? "opacity-100 text-purple-300"
                      : "opacity-0 group-hover:opacity-100 text-zinc-400",
                  )}
                >
                  {s.title}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto mb-8 min-h-[450px] scrollbar-thin pr-1">
        <CurrentStepComponent />
      </div>

      {/* Footer Nav */}
      <div className="flex items-center justify-between pt-6 border-t border-white/5 bg-zinc-950">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={step === 0 || isSimulating}
          className="pl-2 hover:bg-zinc-900 text-zinc-400 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        {step === steps.length - 1 ? (
          <Button
            variant="cyber"
            onClick={() => setWorkflowPhase("apply")}
            disabled={isSimulating}
          >
            <Flag className="w-4 h-4 mr-2" />
            {isSimulating ? "Initializing..." : "Continue to Apply"}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            variant="default"
            className="bg-zinc-100 text-zinc-950 hover:bg-white"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};
