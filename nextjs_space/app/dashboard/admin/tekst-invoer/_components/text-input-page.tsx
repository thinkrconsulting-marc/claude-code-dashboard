'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Loader2, Check, X, GitBranch, Star, Copy, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface RepoInfo {
  url: string;
  name: string;
  description: string | null;
  contextNote: string | null;
  category: string;
  installCommand: string | null;
  stars: number | null;
  license: string | null;
  language: string | null;
  selected?: boolean;
}

interface ContentAnalysis {
  summary: string;
  suggestedChapterId: string | null;
  suggestedChapterTitle: string;
  suggestedSectionTitle: string;
  suggestedTags: string[];
  contentType: string;
}

export default function TextInputPage() {
  const { data: session } = useSession() || {};
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);

  if (!isAdmin) return <div className="p-6 text-center text-muted-foreground">Geen toegang</div>;

  const handleAnalyze = async () => {
    if (content.trim().length < 10) {
      toast.error('Tekst moet minimaal 10 tekens bevatten');
      return;
    }
    setLoading(true);
    setAnalysis(null);
    setRepos([]);
    setShowResults(false);
    try {
      const res = await fetch('/api/text-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      const data = await res?.json?.();
      if (!res?.ok) {
        toast.error(data?.error ?? 'Analyse mislukt');
        return;
      }
      setUploadId(data?.uploadId ?? null);
      setAnalysis(data?.contentAnalysis ?? null);
      setRepos((data?.extractedRepos ?? []).map((r: RepoInfo) => ({ ...r, selected: true })));
      setShowResults(true);
      toast.success(`Analyse voltooid! ${(data?.extractedRepos?.length ?? 0)} repo(s) gevonden.`);
    } catch {
      toast.error('Fout bij analyseren');
    } finally {
      setLoading(false);
    }
  };

  const toggleRepo = (idx: number) => {
    setRepos((prev) => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Save selected repos
      const selectedRepos = repos.filter((r) => r.selected);
      let savedCount = 0;
      for (const repo of selectedRepos) {
        try {
          const res = await fetch('/api/repos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(repo),
          });
          if (res?.ok) savedCount++;
        } catch {}
      }

      // Approve upload content
      if (uploadId && analysis?.suggestedChapterId) {
        try {
          await fetch('/api/upload/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uploadId,
              chapterId: analysis.suggestedChapterId,
              sectionTitle: analysis.suggestedSectionTitle,
              tags: analysis.suggestedTags,
            }),
          });
        } catch {}
      }

      toast.success(`${savedCount} repo(s) opgeslagen! Content goedgekeurd.`);
      // Reset
      setTitle('');
      setContent('');
      setAnalysis(null);
      setRepos([]);
      setUploadId(null);
      setShowResults(false);
    } catch {
      toast.error('Fout bij opslaan');
    } finally {
      setSaving(false);
    }
  };

  const catColor: Record<string, string> = {
    SKILL: 'bg-blue-500/20 text-blue-400',
    MCP: 'bg-purple-500/20 text-purple-400',
    TOOL: 'bg-green-500/20 text-green-400',
    PLUGIN: 'bg-amber-500/20 text-amber-400',
    OTHER: 'bg-zinc-500/20 text-zinc-400',
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Tekst Invoer</h1>
        <p className="text-muted-foreground text-sm mb-6">Plak tekst om te analyseren. GitHub links worden automatisch geëxtraheerd en gecategoriseerd.</p>
      </motion.div>

      <Card style={{ boxShadow: 'var(--shadow-md)' }}>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel (optioneel)</Label>
            <Input id="title" value={title} onChange={(e: any) => setTitle(e?.target?.value ?? '')} placeholder="Bijv. Nieuwe MCP servers artikel" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Tekst *</Label>
            <Textarea id="content" value={content} onChange={(e: any) => setContent(e?.target?.value ?? '')} placeholder="Plak hier je tekst... GitHub links worden automatisch herkend en verwerkt." className="min-h-[250px] font-mono text-sm" />
            <p className="text-xs text-muted-foreground">{content.length} tekens</p>
          </div>
          <Button onClick={handleAnalyze} disabled={loading || content.trim().length < 10} className="w-full gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'AI analyseert...' : 'Analyseren'}
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {showResults && analysis && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 space-y-4">
            {/* Content Analysis */}
            <Card style={{ boxShadow: 'var(--shadow-md)' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Content Analyse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground">{analysis.summary}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-foreground">📂 {analysis.suggestedChapterTitle}</Badge>
                  <Badge variant="outline" className="text-foreground">📝 {analysis.suggestedSectionTitle}</Badge>
                  <Badge className={catColor[analysis.contentType] ?? catColor.OTHER}>{analysis.contentType}</Badge>
                </div>
                {(analysis.suggestedTags?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {analysis.suggestedTags.map((tag, i) => <Badge key={i} variant="secondary" className="text-[10px] text-foreground">{tag}</Badge>)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Extracted Repos */}
            {repos.length > 0 && (
              <Card style={{ boxShadow: 'var(--shadow-md)' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2"><GitBranch className="w-5 h-5 text-primary" /> Gevonden Repos ({repos.length})</CardTitle>
                  <CardDescription>Selecteer welke repos je wilt toevoegen aan de bibliotheek</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {repos.map((repo, idx) => (
                    <motion.div key={repo.url} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
                      <div className={`p-4 rounded-lg border transition-colors ${repo.selected ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/20 opacity-60'}`}>
                        <div className="flex items-start gap-3">
                          <button onClick={() => toggleRepo(idx)} className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${repo.selected ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                            {repo.selected && <Check className="w-3 h-3 text-primary-foreground" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-foreground">{repo.name}</span>
                              <Badge className={catColor[repo.category] ?? catColor.OTHER}>{repo.category}</Badge>
                              {repo.stars != null && <span className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3" />{repo.stars.toLocaleString()}</span>}
                              {repo.language && <span className="text-xs text-muted-foreground">{repo.language}</span>}
                            </div>
                            <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all">{repo.url}</a>
                            {repo.contextNote && <p className="text-xs text-muted-foreground mt-1 italic">💬 {repo.contextNote}</p>}
                            {repo.installCommand && (
                              <div className="mt-2 flex items-center gap-2">
                                <code className="text-xs bg-muted/50 px-2 py-1 rounded font-mono text-amber-400 break-all">{repo.installCommand}</code>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { navigator?.clipboard?.writeText?.(repo.installCommand ?? ''); toast.success('Gekopieerd!'); }}>
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Save Button */}
            <Button onClick={handleSaveAll} disabled={saving} className="w-full gap-2" size="lg">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Opslaan...' : `Alles Goedkeuren & Opslaan (${repos.filter(r => r.selected).length} repos)`}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
