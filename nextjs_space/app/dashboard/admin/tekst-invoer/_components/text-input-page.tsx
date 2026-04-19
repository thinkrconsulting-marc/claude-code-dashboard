'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Loader2, Check, GitBranch, Star, Copy, Sparkles, History, ChevronDown, ChevronUp, Plus, RefreshCw, AlertTriangle, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ProcessAction {
  action: string;
  sectionTitle?: string;
  chapterTitle?: string;
  chapterId?: string;
  reason?: string;
  error?: string;
}

interface ProcessResult {
  success: boolean;
  logId: string;
  summary: string;
  stats: {
    sectionsCreated: number;
    sectionsUpdated: number;
    chaptersCreated: number;
    duplicatesSkipped: number;
    reposExtracted: number;
  };
  actions: ProcessAction[];
}

interface LogEntry {
  id: string;
  inputTitle: string | null;
  inputLength: number;
  sectionsCreated: number;
  sectionsUpdated: number;
  chaptersCreated: number;
  duplicatesSkipped: number;
  reposExtracted: number;
  actionsJson: string;
  processedBy: { name: string | null; email: string };
  createdAt: string;
}

const actionIcons: Record<string, string> = {
  NEW_SECTION: '🆕',
  UPDATE_SECTION: '🔄',
  NEW_CHAPTER: '📖',
  DUPLICATE_SKIP: '⏭️',
  OUTDATED_REPLACE: '⚠️',
};

const actionLabels: Record<string, string> = {
  NEW_SECTION: 'Nieuwe Sectie',
  UPDATE_SECTION: 'Sectie Bijgewerkt',
  NEW_CHAPTER: 'Nieuw Hoofdstuk',
  DUPLICATE_SKIP: 'Duplicaat Overgeslagen',
  OUTDATED_REPLACE: 'Verouderd Vervangen',
};

const actionColors: Record<string, string> = {
  NEW_SECTION: 'bg-green-500/10 text-green-400 border-green-500/20',
  UPDATE_SECTION: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  NEW_CHAPTER: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  DUPLICATE_SKIP: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  OUTDATED_REPLACE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function TextInputPage() {
  const { data: session } = useSession() || {};
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  if (!isAdmin) return <div className="p-6 text-center text-muted-foreground">Geen toegang</div>;

  const handleProcess = async () => {
    if (content.trim().length < 10) {
      toast.error('Tekst moet minimaal 10 tekens bevatten');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/text-input/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      const data = await res?.json?.();
      if (!res?.ok) {
        toast.error(data?.error ?? 'Verwerking mislukt');
        return;
      }
      setResult(data);
      toast.success(`Verwerking voltooid! ${data?.stats?.sectionsCreated ?? 0} nieuwe secties, ${data?.stats?.sectionsUpdated ?? 0} updates.`);
    } catch {
      toast.error('Fout bij verwerken');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/processing-logs');
      const data = await res?.json?.();
      setLogs(data?.logs ?? []);
    } catch {} finally { setLoadingLogs(false); }
  };

  const toggleHistory = () => {
    if (!showHistory) fetchLogs();
    setShowHistory(!showHistory);
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setResult(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Tekst Invoer & Verwerking</h1>
            <p className="text-muted-foreground text-sm">Plak tekst om automatisch te analyseren, vergelijken en verwerken in de kennisbank.</p>
          </div>
          <Button variant="outline" size="sm" onClick={toggleHistory}>
            <History className="w-4 h-4 mr-1" />
            Geschiedenis
          </Button>
        </div>
      </motion.div>

      {!result ? (
        <Card style={{ boxShadow: 'var(--shadow-md)' }}>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel (optioneel)</Label>
              <Input id="title" value={title} onChange={(e: any) => setTitle(e?.target?.value ?? '')} placeholder="Bijv. Nieuwe MCP servers update" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Tekst *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e: any) => setContent(e?.target?.value ?? '')}
                placeholder="Plak hier je tekst...&#10;&#10;Het systeem zal automatisch:&#10;• Vergelijken met bestaande hoofdstukken (14 hoofdstukken, 150+ secties)&#10;• Nieuwe content toevoegen waar nodig&#10;• Bestaande secties updaten als de nieuwe versie beter is&#10;• Duplicaten overslaan&#10;• Verouderde info vervangen&#10;• GitHub repos extraheren en opslaan"
                className="min-h-[300px] font-mono text-sm"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{content.length} tekens</span>
                <span>Min. 10 tekens vereist</span>
              </div>
            </div>
            <Button onClick={handleProcess} disabled={loading || content.trim().length < 10} className="w-full gap-2" size="lg">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'AI analyseert en verwerkt...' : 'Analyseren & Automatisch Verwerken'}
            </Button>
            {loading && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground animate-pulse">De AI vergelijkt je tekst met 14 hoofdstukken en 150+ secties...</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Summary Card */}
          <Card className="border-primary/30" style={{ boxShadow: 'var(--shadow-md)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" /> Verwerking Voltooid
              </CardTitle>
              <CardDescription>{result.summary}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Nieuwe Secties', value: result.stats.sectionsCreated, color: 'text-green-400' },
                  { label: 'Bijgewerkt', value: result.stats.sectionsUpdated, color: 'text-blue-400' },
                  { label: 'Nieuwe Hoofdst.', value: result.stats.chaptersCreated, color: 'text-purple-400' },
                  { label: 'Overgeslagen', value: result.stats.duplicatesSkipped, color: 'text-zinc-400' },
                  { label: 'Repos', value: result.stats.reposExtracted, color: 'text-amber-400' },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 rounded-lg bg-muted/30">
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions Detail */}
          <Card style={{ boxShadow: 'var(--shadow-md)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Uitgevoerde Acties ({result.actions.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.actions.map((action, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                  <span className="text-lg">{actionIcons[action.action] ?? '❓'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-xs border ${actionColors[action.action] ?? ''}`}>
                        {actionLabels[action.action] ?? action.action}
                      </Badge>
                      <span className="font-medium text-sm text-foreground">
                        {action.chapterTitle || action.sectionTitle}
                      </span>
                    </div>
                    {action.reason && <p className="text-xs text-muted-foreground mt-1">{action.reason}</p>}
                    {action.error && <p className="text-xs text-red-400 mt-1">⚠️ {action.error}</p>}
                  </div>
                </div>
              ))}
              {result.actions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Geen acties uitgevoerd — de tekst bevatte geen nieuwe informatie.</p>
              )}
            </CardContent>
          </Card>

          {/* New Input Button */}
          <Button onClick={resetForm} className="w-full gap-2" variant="outline" size="lg">
            <Plus className="w-4 h-4" /> Nieuwe Tekst Verwerken
          </Button>
        </motion.div>
      )}

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6">
            <Card style={{ boxShadow: 'var(--shadow-md)' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-4 h-4" /> Verwerkingsgeschiedenis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingLogs ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nog geen verwerkingen uitgevoerd.</p>
                ) : (
                  <div className="space-y-3">
                    {logs.map(log => {
                      let parsedActions: any[] = [];
                      try { parsedActions = JSON.parse(log.actionsJson); } catch {}
                      return (
                        <div key={log.id} className="p-3 rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{log.inputTitle || 'Zonder titel'}</span>
                              <span className="text-xs text-muted-foreground">{log.inputLength} tekens</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {log.sectionsCreated > 0 && <Badge className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20">🆕 {log.sectionsCreated} nieuw</Badge>}
                            {log.sectionsUpdated > 0 && <Badge className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">🔄 {log.sectionsUpdated} bijgewerkt</Badge>}
                            {log.chaptersCreated > 0 && <Badge className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20">📖 {log.chaptersCreated} hoofdstuk</Badge>}
                            {log.duplicatesSkipped > 0 && <Badge className="text-[10px] bg-zinc-500/10 text-zinc-400 border-zinc-500/20">⏭️ {log.duplicatesSkipped} overgeslagen</Badge>}
                            {log.reposExtracted > 0 && <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">📦 {log.reposExtracted} repos</Badge>}
                          </div>
                          {parsedActions.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {parsedActions.slice(0, 5).map((a: any, i: number) => (
                                <p key={i} className="text-xs text-muted-foreground">
                                  {actionIcons[a.action] ?? '•'} {a.sectionTitle || a.chapterTitle} — {a.reason || actionLabels[a.action]}
                                </p>
                              ))}
                              {parsedActions.length > 5 && <p className="text-xs text-muted-foreground">...en {parsedActions.length - 5} meer</p>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
