import React from 'react';
import { Card, Input } from '../ui/primitives';
import { Search, BookOpen } from 'lucide-react';

const terms = [
    { term: 'Monorepo', def: 'A software development strategy where code for many projects is stored in the same repository.' },
    { term: 'Polyrepo', def: 'The standard practice of keeping distinct projects in separate repositories.' },
    { term: 'CI/CD', def: 'Continuous Integration and Continuous Delivery. A method to frequently deliver apps to customers by introducing automation into the stages of app development.' },
    { term: 'Linting', def: 'The process of running a program that will analyze code for potential errors, stylistic errors, and suspicious constructs.' },
    { term: 'Code Scanning', def: 'A feature in GitHub that analyzes code in a repository to find security vulnerabilities and coding errors.' },
    { term: 'Secret Scanning', def: 'Scans repositories for known types of secrets (keys, tokens, credentials) to prevent fraudulent use.' },
    { term: 'Dependency Drift', def: 'The phenomenon where the dependencies of your project become outdated over time, potentially leading to security risks or compatibility issues.' },
    { term: 'ADR', def: 'Architecture Decision Record. A document that captures an important architectural decision made along with its context and consequences.' },
    { term: 'CODEOWNERS', def: 'A file to define individuals or teams that are responsible for code in a repository.' },
    { term: 'Conventional Commits', def: 'A specification for adding human and machine readable meaning to commit messages (e.g., "feat: allow login").' },
];

export const Glossary = () => {
    const [search, setSearch] = React.useState('');

    const filtered = terms.filter(t => t.term.toLowerCase().includes(search.toLowerCase()) || t.def.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="max-w-3xl mx-auto py-10 px-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-purple-400" />
                    Glossary
                </h2>
                <p className="text-zinc-400">Common terminology used in modern software development and GitHub workflows.</p>
            </div>

            <div className="relative mb-8">
                <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <Input 
                    placeholder="Search terms..." 
                    className="pl-10 bg-zinc-900 border-white/10 text-white focus:border-purple-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="grid gap-4">
                {filtered.map((item, i) => (
                    <Card key={i} className="bg-zinc-900/50 border-white/5 hover:border-white/10 transition-colors">
                        <div className="p-4">
                            <h3 className="text-lg font-bold text-purple-300 mb-1">{item.term}</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">{item.def}</p>
                        </div>
                    </Card>
                ))}
                {filtered.length === 0 && (
                    <div className="text-center py-10 text-zinc-500">
                        No terms found matching "{search}"
                    </div>
                )}
            </div>
        </div>
    );
};