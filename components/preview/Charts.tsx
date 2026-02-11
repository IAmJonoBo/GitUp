import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useStore } from '../../store';
import { Card } from '../ui/primitives';

export const PostureChart = () => {
  const config = useStore((state) => state.config);

  const data = React.useMemo(() => [
    { subject: 'Security', A: config.security.codeScanning ? 90 : 40, fullMark: 100 },
    { subject: 'Quality', A: config.quality.testing ? 85 : 30, fullMark: 100 },
    { subject: 'Auto', A: config.ci.automaticRelease ? 95 : 20, fullMark: 100 },
    { subject: 'Docs', A: config.docs.readme && config.docs.contributing ? 100 : 50, fullMark: 100 },
    { subject: 'Maint', A: config.structure === 'Monorepo' ? 60 : 80, fullMark: 100 },
  ], [config]);

  return (
    <Card className="h-[250px] border border-white/10 bg-zinc-900 p-2 flex flex-col">
      <div className="px-2 pt-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">Project Posture Score</div>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#3f3f46" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#a1a1aa' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Score" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
          <Tooltip
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5' }}
            itemStyle={{ color: '#a78bfa' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export const MaintenanceForecast = () => {
  const config = useStore((state) => state.config);

  const depUpdateFreq = config.security.dependencyUpdateFrequency;
  const basePrs = depUpdateFreq === 'daily' ? 20 : depUpdateFreq === 'weekly' ? 4 : 1;
  const scanningPrs = config.security.codeScanning ? 2 : 0;
  const totalPrs = basePrs + scanningPrs;

  const data = React.useMemo(() => (
    [
      { name: 'Jan', prs: totalPrs },
      { name: 'Feb', prs: totalPrs + 1 },
      { name: 'Mar', prs: totalPrs },
      { name: 'Apr', prs: totalPrs + 1 },
      { name: 'May', prs: totalPrs },
      { name: 'Jun', prs: totalPrs - 1 },
    ]
  ), [totalPrs]);

  return (
    <Card className="h-[250px] border border-white/10 bg-zinc-900 p-2 flex flex-col">
      <div className="px-2 pt-2 flex justify-between items-center">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Bot PR Forecast</span>
        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
          ~{totalPrs} / month
        </span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: '#27272a' }}
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5', fontSize: '12px' }}
          />
          <Bar dataKey="prs" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
