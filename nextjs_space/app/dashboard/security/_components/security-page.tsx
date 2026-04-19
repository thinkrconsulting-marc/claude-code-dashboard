'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldAlert, ShieldCheck, ShieldQuestion, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Repo {
  id: string;
  name: string;
  fullName: string;
  url: string;
  category: string;
  securityStatus: string;
  securityScore: number | null;
  lastScannedAt: string | null;
  riskSummary: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  SAFE: { label: 'Veilig', color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: ShieldCheck },
  WARNING: { label: 'Waarschuwing', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: ShieldAlert },
  DANGEROUS: { label: 'Gevaarlijk', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: ShieldAlert },
  NOT_SCANNED: { label: 'Niet Gescand', color: 'bg-muted text-muted-foreground border-border', icon: ShieldQuestion },
};

const categoryLabels: Record<string, string> = {
  SKILL: 'Skill',
  MCP_SERVER: 'MCP Server',
  TOOL: 'Tool',
  PLUGIN: 'Plugin',
  OTHER: 'Overig',
};

export default function SecurityPage() {
  const { data: session } = useSession() || {};
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);
  const [bulkScanning, setBulkScanning] = useState(false);

  const fetchRepos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/repos');
      const data = await res.json();
      setRepos(data?.repos ?? []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRepos(); }, [fetchRepos]);

  const scanRepo = async (id: string) => {
    setScanning(id);
    try {
      await fetch(`/api/repos/${id}/scan`, { method: 'POST' });
      await fetchRepos();
    } catch { } finally { setScanning(null); }
  };

  const bulkScan = async () => {
    setBulkScanning(true);
    const unscanned = repos.filter(r => r.securityStatus === 'NOT_SCANNED');
    for (const repo of unscanned) {
      setScanning(repo.id);
      try {
        await fetch(`/api/repos/${repo.id}/scan`, { method: 'POST' });
      } catch { }
    }
    setScanning(null);
    setBulkScanning(false);
    await fetchRepos();
  };

  const stats = {
    total: repos.length,
    safe: repos.filter(r => r.securityStatus === 'SAFE').length,
    warning: repos.filter(r => r.securityStatus === 'WARNING').length,
    dangerous: repos.filter(r => r.securityStatus === 'DANGEROUS').length,
    notScanned: repos.filter(r => r.securityStatus === 'NOT_SCANNED').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6" /> Security Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overzicht van beveiligingsscans voor alle repositories</p>
        </div>
        {isAdmin && stats.notScanned > 0 && (
          <Button onClick={bulkScan} disabled={bulkScanning} variant="outline">
            {bulkScanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Scan alle ({stats.notScanned})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Totaal', value: stats.total, cls: 'text-foreground' },
          { label: 'Veilig', value: stats.safe, cls: 'text-green-400' },
          { label: 'Waarschuwing', value: stats.warning, cls: 'text-yellow-400' },
          { label: 'Gevaarlijk', value: stats.dangerous, cls: 'text-red-400' },
          { label: 'Niet Gescand', value: stats.notScanned, cls: 'text-muted-foreground' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : repos.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Geen repositories gevonden. Voeg repos toe via de Repo Bibliotheek of Tekst Invoer.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {repos.map(repo => {
            const cfg = statusConfig[repo.securityStatus] || statusConfig.NOT_SCANNED;
            const StatusIcon = cfg.icon;
            return (
              <Card key={repo.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <StatusIcon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/dashboard/repos/${repo.id}`} className="font-medium hover:text-primary transition-colors truncate">
                          {repo.fullName || repo.name}
                        </Link>
                        <Badge variant="outline" className="text-xs">{categoryLabels[repo.category] || repo.category}</Badge>
                        <Badge className={`text-xs border ${cfg.color}`}>{cfg.label}</Badge>
                      </div>
                      {repo.riskSummary && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{repo.riskSummary}</p>
                      )}
                      {repo.securityScore !== null && (
                        <p className="text-xs text-muted-foreground mt-0.5">Score: {repo.securityScore}/100</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {repo.lastScannedAt && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {new Date(repo.lastScannedAt).toLocaleDateString('nl-NL')}
                        </span>
                      )}
                      <a href={repo.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="w-3.5 h-3.5" /></Button>
                      </a>
                      {isAdmin && (
                        <Button variant="outline" size="sm" onClick={() => scanRepo(repo.id)} disabled={scanning === repo.id}>
                          {scanning === repo.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          <span className="ml-1 hidden sm:inline">Scan</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
