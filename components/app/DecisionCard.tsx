import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "../ui/primitives";
import { EngineDecisionPayload } from "../../types";
import { Lightbulb, GitBranch, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export const DecisionCard: React.FC<{ decision: EngineDecisionPayload }> = ({
  decision,
}) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-zinc-900 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)] overflow-hidden">
        <div className="bg-amber-500/10 px-6 py-3 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-100">
              {decision.title}
            </span>
          </div>
          <Badge
            variant="outline"
            className="text-amber-300 border-amber-500/30 bg-amber-500/10"
          >
            {decision.stage} • {decision.confidence}
          </Badge>
        </div>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm uppercase tracking-wider text-zinc-500 font-semibold mb-1">
                Why {decision.recommendation}?
              </h4>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {decision.why}
              </p>
            </div>

            {decision.rankedCandidates?.length ? (
              <motion.div
                className="bg-zinc-950/50 p-3 rounded-lg border border-emerald-500/20"
                whileHover={{
                  scale: 1.01,
                  borderColor: "rgba(16, 185, 129, 0.45)",
                  backgroundColor: "rgba(16, 185, 129, 0.05)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <h5 className="text-xs font-semibold text-emerald-300 mb-2">
                  Ranked Recommendations
                </h5>
                <div className="space-y-2">
                  {decision.rankedCandidates.map((candidate, i) => (
                    <div
                      key={candidate.label}
                      className="rounded border border-white/5 bg-zinc-900/70 p-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-zinc-100 font-medium">
                          {i === 0 ? "Recommended" : `Alternative ${i}`}: {candidate.label}
                        </p>
                        <span className="text-[11px] text-emerald-300">
                          Score {candidate.score}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-400">
                        ~{candidate.botPrsPerMonth} bot PRs/mo • {candidate.ciMinutesProxy} CI-min proxy
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-500">
                        {candidate.securityPostureNote}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div
                className="bg-zinc-950/50 p-3 rounded-lg border border-white/5"
                whileHover={{
                  scale: 1.02,
                  borderColor: "rgba(244, 63, 94, 0.3)",
                  backgroundColor: "rgba(244, 63, 94, 0.05)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <h5 className="text-xs font-semibold text-rose-400 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Trade-offs
                </h5>
                <ul className="text-xs text-zinc-400 space-y-1.5">
                  {decision.tradeOffs.map((t, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-1.5"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <span className="text-rose-500/70 mt-0.5">•</span>
                      <span>{t}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                className="bg-zinc-950/50 p-3 rounded-lg border border-white/5"
                whileHover={{
                  scale: 1.02,
                  borderColor: "rgba(34, 211, 238, 0.3)",
                  backgroundColor: "rgba(34, 211, 238, 0.05)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <h5 className="text-xs font-semibold text-cyan-400 mb-2 flex items-center gap-1">
                  <GitBranch className="w-3 h-3" /> Alternatives
                </h5>
                <div className="flex flex-wrap gap-2">
                  {decision.alternatives.map((a, i) => (
                    <motion.span
                      key={i}
                      className="text-xs bg-zinc-800 border border-zinc-700 px-2 py-1 rounded text-zinc-300 cursor-default"
                      whileHover={{
                        scale: 1.05,
                        backgroundColor: "#27272a",
                        borderColor: "#22d3ee",
                        color: "#22d3ee",
                      }}
                      layout
                    >
                      {a}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
