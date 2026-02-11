import React, { useMemo } from "react";
import { useStore } from "../../store";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/primitives";
import { Zap, TrendingUp, Trophy, Star, ShieldCheck } from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export const MultiplierBadge = () => {
  const config = useStore((state) => state.config);

  const score = useMemo(() => {
    let s = 1;

    // Quality Gates (+3 max)
    if (config.quality.testing) s += 1;
    if (config.quality.linter !== "None" && config.quality.formatter !== "None")
      s += 1;
    if (config.ci.runTests) s += 1;

    // Security (+3 max)
    if (config.security.codeScanning) s += 1;
    if (config.security.secretScanning) s += 1;
    if (config.security.dependencyUpdates) s += 1;

    // Governance (+2 max)
    if (config.docs.readme && config.docs.contributing) s += 1;
    if (
      config.github.branches.protection.requirePr &&
      config.github.branches.protection.requireStatusChecks
    )
      s += 1;

    return Math.min(s, 9);
  }, [config]);

  const getStyles = (s: number) => {
    if (s >= 9)
      return {
        bg: "bg-amber-500/10",
        border: "border-amber-500/50",
        text: "text-amber-500",
        shadow: "shadow-[0_0_20px_rgba(245,158,11,0.3)]",
        icon: Trophy,
        label: "GODLIKE",
      };
    if (s >= 7)
      return {
        bg: "bg-pink-500/10",
        border: "border-pink-500/50",
        text: "text-pink-500",
        shadow: "shadow-[0_0_15px_rgba(236,72,153,0.2)]",
        icon: Zap,
        label: "LEGENDARY",
      };
    if (s >= 5)
      return {
        bg: "bg-purple-500/10",
        border: "border-purple-500/50",
        text: "text-purple-500",
        shadow: "shadow-[0_0_10px_rgba(168,85,247,0.2)]",
        icon: Star,
        label: "EPIC",
      };
    if (s >= 3)
      return {
        bg: "bg-blue-500/10",
        border: "border-blue-500/50",
        text: "text-blue-500",
        shadow: "shadow-none",
        icon: ShieldCheck,
        label: "RARE",
      };
    return {
      bg: "bg-zinc-500/10",
      border: "border-zinc-500/30",
      text: "text-zinc-500",
      shadow: "shadow-none",
      icon: TrendingUp,
      label: "COMMON",
    };
  };

  const style = getStyles(score);
  const Icon = style.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          type="button"
          key={score}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold font-mono transition-all cursor-help select-none uppercase tracking-wider",
            style.bg,
            style.border,
            style.text,
            style.shadow,
          )}
        >
          <Icon className="w-3 h-3" />
          <AnimatePresence mode="wait">
            <motion.span
              key={score}
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -5, opacity: 0 }}
            >
              {score}x Multiplier
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="end"
        className="max-w-[220px] p-3 bg-zinc-950 border border-white/10"
      >
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
          <span className={cn("text-xs font-bold", style.text)}>
            {style.label} TIER
          </span>
          <span className="text-[10px] text-zinc-500 ml-auto">Max 9X</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Improve your config (Testing, Security, CI/CD) to boost your repo
          score.
        </p>
      </TooltipContent>
    </Tooltip>
  );
};
