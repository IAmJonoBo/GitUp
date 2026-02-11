import React, { useState } from 'react';
import { useStore } from '../../store';
import { Button, Card } from '../ui/primitives';
import { Download, Copy, Check, FileJson } from 'lucide-react';

export const Export = () => {
    const config = useStore((state) => state.config);
    const [copied, setCopied] = useState(false);

    const jsonString = JSON.stringify(config, null, 2);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(jsonString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([jsonString], {type: 'application/json'});
        element.href = URL.createObjectURL(file);
        element.download = `${config.projectName}-config.json`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-6 animate-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <FileJson className="w-8 h-8 text-emerald-400" />
                        Export Configuration
                    </h2>
                    <p className="text-zinc-400">Review your generated project plan in JSON format. Use this to hydrate CLI tools or share with your team.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleCopy} className="border-zinc-700 text-zinc-300 hover:text-white">
                        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? 'Copied' : 'Copy JSON'}
                    </Button>
                    <Button variant="cyber" onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                </div>
            </div>

            <Card className="flex-1 bg-[#0d1117] border-white/10 relative overflow-hidden font-mono text-sm shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-8 bg-[#161b22] border-b border-white/5 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/20" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/20" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
                    <span className="ml-2 text-xs text-zinc-500">config.json</span>
                </div>
                <div className="p-6 pt-12 h-full overflow-y-auto scrollbar-thin text-zinc-300">
                    <pre>{jsonString}</pre>
                </div>
            </Card>
        </div>
    );
};
