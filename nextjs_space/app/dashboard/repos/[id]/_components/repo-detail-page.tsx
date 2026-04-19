'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { GitBranch, Star, Shield, Copy, ExternalLink, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  readmeContent: string | null;
  securityStatus: string;
  securityReport: string | null;
  addedBy: { name: string | null; email: string };
  createdAt: string;
}

const catColor: Record<string, string> = {
  SKILL: 'bg-blue-500/20 text-blue-400', MCP: 'bg-purple-500/20 text-purple-400',
  TOOL: 'bg-green-500/20 text-green-400', PLUGIN: 'bg-amber-500/20 text-amber-400', OTHER: 'bg-zinc-500/20 text-zinc-400',
};

const sevColor: Record<string, string> = {
  LOW: 'bg-blue-500/20 text-blue-400', MEDIUM: 'bg-yellow-500/20 text-yellow-400',
  HIGH: 'bg-orange-500/20 text-orange-400', CRITICAL: 'bg-red-500/20 text-red-400',
};

export default function RepoDetailPage({ repoId }: { repoId: string }) {
  const { data: session } = useSession() || {};
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const [repo, setRepo] = useState<Repo | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/repos/${repoId}`)
      .then((r) => r?.json?.())
      .then((d) => {
        setRepo(d?.repo ?? null);
        if (d?.repo?.securityReport) {
          try { setReport(JSON.parse(d.repo.securityReport)); } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [repoId]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch(`/api/repos/${repoId}/scan`, { method: 'POST' });
      const data = await res?.json?.();
      if (!res?.ok) { toast.error(data?.error ?? 'Scan mislukt'); return; }
      setReport(data?.report ?? null);
      setRepo((prev) => prev ? { ...prev, securityStatus: data?.securityStatus ?? prev.securityStatus } : prev);
      toast.success('Security scan voltooid');
    } catch { toast.error('Fout bij scan'); } finally { setScanning(false); }
  };

  const fetchReadme = async () => {
    try {
      const res = await fetch('/api/repos/github-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: repo?.url }),
      });
      const data = await res?.json?.();
      if (data?.readmeContent) {
        setRepo((prev) => prev ? { ...prev, readmeContent: data.readmeContent } : prev);
        // Also update in DB
        await fetch(`/api/repos/${repoId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ readmeContent: data.readmeContent }),
        });
      }
    } catch {}
  };

  useEffect(() => {
    if (repo && !repo.readmeContent && repo.url) fetchReadme();
  }, [repo?.id]);

  if (loading) return <div className="p-6"><div className="h-64 bg-muted/50 animate-pulse rounded-lg" /></div>;
  if (!repo) return <div className="p-6 text-center text-muted-foreground">Repo niet gevonden</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/dashboard/repos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Terug naar bibliotheek
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="font-display text-2xl font-bold tracking-tight">{repo.name}</h1>
              <Badge className={catColor[repo.category] ?? catColor.OTHER}>{repo.category}</Badge>
            </div>
            <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
              {repo.url} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {repo.stars != null && <Badge variant="outline" className="text-foreground"><Star className="w-3 h-3 mr-1 text-amber-400" />{repo.stars.toLocaleString()}</Badge>}
            {repo.license && <Badge variant="outline" className="text-foreground">{repo.license}</Badge>}
            {repo.language && <Badge variant="outline" className="text-foreground">{repo.language}</Badge>}
          </div>
        </div>
      </motion.div>

      {repo.description && <p className="text-foreground/80 mb-4">{repo.description}</p>}
      {repo.contextNote && <p className="text-sm text-muted-foreground italic mb-4">💬 Context: {repo.contextNote}</p>}

      {repo.installCommand && (
        <Card className="mb-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <CardContent className="p-4 flex items-center gap-3">
            <span className="text-sm text-muted-foreground shrink-0">Installatie:</span>
            <code className="text-sm font-mono text-amber-400 flex-1 break-all">{repo.installCommand}</code>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { navigator?.clipboard?.writeText?.(repo.installCommand ?? ''); toast.success('Gekopieerd!'); }}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Security Section */}
      <Card className="mb-4" style={{ boxShadow: 'var(--shadow-md)' }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><Shield className="w-5 h-5" /> Security Analyse</CardTitle>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={handleScan} disabled={scanning} className="gap-1">
                {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                {scanning ? 'Scannen...' : 'Scan'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!report ? (
            <p className="text-sm text-muted-foreground">Nog niet gescand. {isAdmin ? 'Klik op Scan om een security analyse te starten.' : 'Vraag een admin om een scan uit te voeren.'}</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className={repo.securityStatus === 'SAFE' ? 'bg-green-500/20 text-green-400' : repo.securityStatus === 'DANGEROUS' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}>
                  {repo.securityStatus === 'SAFE' ? '🟢 Veilig' : repo.securityStatus === 'DANGEROUS' ? '🔴 Gevaarlijk' : '🟡 Let op'}
                </Badge>
                {report?.overallScore != null && <span className="text-sm text-muted-foreground">Score: {report.overallScore}/100</span>}
              </div>
              <p className="text-sm text-foreground">{report?.summary}</p>
              {report?.promptInjectionDetected && (
                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-sm font-medium text-red-400">⚠️ Prompt Injection Gedetecteerd</p>
                  <p className="text-xs text-red-300 mt-1">{report.promptInjectionDetails}</p>
                </div>
              )}
              {(report?.findings?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bevindingen</p>
                  {report.findings.map((f: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={sevColor[f?.severity] ?? sevColor.LOW}>{f?.severity}</Badge>
                        <span className="text-sm font-medium text-foreground">{f?.title}</span>
                      </div>
                      <p className="text-xs text-foreground/80">{f?.description}</p>
                      {f?.recommendation && <p className="text-xs text-muted-foreground mt-1">💡 {f.recommendation}</p>}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">⚠️ LLM-gebaseerde analyse. Geen vervanging voor echte security audit tools.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* README */}
      {repo.readmeContent && (
        <Card style={{ boxShadow: 'var(--shadow-sm)' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">README</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs font-mono whitespace-pre-wrap text-foreground/80 max-h-96 overflow-y-auto">{repo.readmeContent}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
