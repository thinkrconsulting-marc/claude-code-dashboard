'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitBranch, Plus, Trash2, Loader2, ExternalLink, RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';

interface Repo {
  id: string;
  name: string;
  fullName: string;
  url: string;
  category: string;
  securityStatus: string;
  stars: number | null;
  description: string | null;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  SKILL: 'Skill', MCP_SERVER: 'MCP Server', TOOL: 'Tool', PLUGIN: 'Plugin', OTHER: 'Overig',
};

export default function AdminReposPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [repoUrl, setRepoUrl] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchRepos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/repos');
      const data = await res.json();
      setRepos(data?.repos ?? []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRepos(); }, [fetchRepos]);

  const addRepo = async () => {
    if (!repoUrl.trim()) return;
    setAdding(true);
    setError('');
    try {
      // Extract owner/repo from URL
      const match = repoUrl.match(/github\.com\/([^/]+\/[^/\s?#]+)/);
      const fullName = match ? match[1].replace(/\.git$/, '') : repoUrl.trim();

      // Fetch GitHub info
      const infoRes = await fetch('/api/repos/github-info', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: `https://github.com/${fullName}` }),
      });
      const info = await infoRes.json();

      // Create repo
      const createRes = await fetch('/api/repos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `https://github.com/${fullName}`,
          name: info?.name || fullName.split('/').pop(),
          fullName: info?.fullName || fullName,
          category,
          description: info?.description || null,
          stars: info?.stars ?? null,
          language: info?.language || null,
          topics: info?.topics || [],
          lastCommitAt: info?.lastCommitAt || null,
          readme: info?.readme || null,
        }),
      });
      if (!createRes.ok) {
        const errData = await createRes.json();
        setError(errData?.error || 'Fout bij toevoegen');
      } else {
        setRepoUrl('');
        await fetchRepos();
      }
    } catch { setError('Fout bij toevoegen'); } finally { setAdding(false); }
  };

  const deleteRepo = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze repo wilt verwijderen?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/repos/${id}`, { method: 'DELETE' });
      await fetchRepos();
    } catch { } finally { setDeleting(null); }
  };

  const filtered = repos.filter(r =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><GitBranch className="w-6 h-6" /> Repos Beheren</h1>
        <p className="text-muted-foreground mt-1">Voeg GitHub repositories toe en beheer ze</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Nieuwe Repository Toevoegen</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="GitHub URL (bijv. https://github.com/owner/repo)"
              value={repoUrl}
              onChange={e => setRepoUrl(e.target.value)}
              className="flex-1"
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={addRepo} disabled={adding || !repoUrl.trim()}>
              {adding ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              Toevoegen
            </Button>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Zoek repos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="outline">{filtered.length} repos</Badge>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Geen repositories gevonden.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(repo => (
            <Card key={repo.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/dashboard/repos/${repo.id}`} className="font-medium hover:text-primary transition-colors">
                      {repo.fullName || repo.name}
                    </Link>
                    <Badge variant="outline" className="text-xs">{categoryLabels[repo.category] || repo.category}</Badge>
                    {repo.stars !== null && <span className="text-xs text-muted-foreground">⭐ {repo.stars}</span>}
                  </div>
                  {repo.description && <p className="text-sm text-muted-foreground mt-0.5 truncate">{repo.description}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a href={repo.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="w-3.5 h-3.5" /></Button>
                  </a>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => deleteRepo(repo.id)} disabled={deleting === repo.id}>
                    {deleting === repo.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
