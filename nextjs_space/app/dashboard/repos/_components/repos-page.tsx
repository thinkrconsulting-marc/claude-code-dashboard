'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { GitBranch, Search, Star, Copy, Shield, ExternalLink, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';

interface Repo {
  id: string;
  name: string;
  url: string;
  description: string | null;
  contextNote: string | null;
  category: string;
  installCommand: string | null;
  stars: number | null;
  license: string | null;
  language: string | null;
  securityStatus: string;
  addedBy: { name: string | null; email: string };
  createdAt: string;
}

const categories = ['ALL', 'SKILL', 'MCP', 'TOOL', 'PLUGIN', 'OTHER'];
const catLabels: Record<string, string> = { ALL: 'Alles', SKILL: 'Skill', MCP: 'MCP Server', TOOL: 'Tool', PLUGIN: 'Plugin', OTHER: 'Overig' };

const catColor: Record<string, string> = {
  SKILL: 'bg-blue-500/20 text-blue-400',
  MCP: 'bg-purple-500/20 text-purple-400',
  TOOL: 'bg-green-500/20 text-green-400',
  PLUGIN: 'bg-amber-500/20 text-amber-400',
  OTHER: 'bg-zinc-500/20 text-zinc-400',
};

const secColor: Record<string, string> = {
  SAFE: 'text-green-400',
  WARNING: 'text-yellow-400',
  DANGEROUS: 'text-red-400',
  PENDING: 'text-zinc-400',
};

const secLabel: Record<string, string> = {
  SAFE: '🟢 Veilig',
  WARNING: '🟡 Let op',
  DANGEROUS: '🔴 Gevaarlijk',
  PENDING: '⏳ Niet gescand',
};

export default function ReposPage() {
  const { data: session } = useSession() || {};
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');

  useEffect(() => {
    fetchRepos();
  }, [selectedCat]);

  const fetchRepos = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCat !== 'ALL') params.set('category', selectedCat);
    fetch(`/api/repos?${params}`)
      .then((r) => r?.json?.())
      .then((d) => setRepos(d?.repos ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const filtered = repos.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.name?.toLowerCase()?.includes(q) || r.description?.toLowerCase()?.includes(q) || r.contextNote?.toLowerCase()?.includes(q) || r.url?.toLowerCase()?.includes(q));
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Repo Bibliotheek</h1>
        <p className="text-muted-foreground text-sm mb-6">Skills, MCP servers, tools en plugins voor Claude Code</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Zoek repos..." value={search} onChange={(e: any) => setSearch(e?.target?.value ?? '')} className="pl-10" />
        </div>
        <div className="flex flex-wrap gap-1">
          {categories.map((cat) => (
            <Button key={cat} variant={selectedCat === cat ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCat(cat)}>
              {catLabels[cat] ?? cat}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted/50 animate-pulse rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Geen repos gevonden</p>
          <p className="text-xs mt-1">Voeg repos toe via Tekst Invoer of Admin Repos</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((repo, i) => (
            <motion.div key={repo.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link href={`/dashboard/repos/${repo.id}`}>
                <Card className="hover:bg-accent/20 transition-colors cursor-pointer" style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-zinc-100">{repo.name}</span>
                          <Badge className={catColor[repo.category] ?? catColor.OTHER}>{catLabels[repo.category] ?? repo.category}</Badge>
                          <span className={`text-xs ${secColor[repo.securityStatus] ?? secColor.PENDING}`}>
                            {secLabel[repo.securityStatus] ?? secLabel.PENDING}
                          </span>
                        </div>
                        <p className="text-xs text-orange-400 break-all mb-1">{repo.url}</p>
                        {repo.description && <p className="text-sm text-zinc-300 line-clamp-2">{repo.description}</p>}
                        {repo.contextNote && <p className="text-xs text-zinc-400 italic mt-1 line-clamp-1">💬 {repo.contextNote}</p>}
                        {repo.installCommand && (
                          <div className="mt-2 flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                            <code className="text-xs bg-zinc-800/70 px-2 py-1 rounded font-mono text-amber-400 truncate max-w-md">{repo.installCommand}</code>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => {
                              e.preventDefault();
                              navigator?.clipboard?.writeText?.(repo.installCommand ?? '');
                              toast.success('Gekopieerd!');
                            }}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {repo.stars != null && (
                          <span className="text-xs text-zinc-400 flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400" />{repo.stars.toLocaleString()}
                          </span>
                        )}
                        {repo.language && <span className="text-[10px] text-zinc-400">{repo.language}</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
