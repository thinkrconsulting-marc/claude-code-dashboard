'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Bookmark, BookmarkCheck, Copy, Check, ChevronRight, BookOpen, Code, Table2, Hash, History, X, Play, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ContentBlock {
  id: string;
  type: string;
  content: string;
  language: string | null;
  imageUrl: string | null;
  orderIndex: number;
}

interface Section {
  id: string;
  title: string;
  tags: string[];
  blocks: ContentBlock[];
}

interface ChapterData {
  id: string;
  title: string;
  number: number;
  guide: { title: string };
  sections: Section[];
}

function CodeBlock({ content, language }: { content: string; language: string | null }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator?.clipboard?.writeText?.(content ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group my-3">
      <div className="absolute right-2 top-2 z-10">
        <Button variant="ghost" size="icon" onClick={handleCopy} className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80">
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
      </div>
      {language && (
        <span className="absolute left-3 top-2 text-[10px] font-mono text-muted-foreground/70 uppercase">{language}</span>
      )}
      <pre className={cn('bg-muted/70 rounded-lg p-4 overflow-x-auto text-sm font-mono text-foreground', language && 'pt-7')}>
        <code className="text-foreground">{content ?? ''}</code>
      </pre>
    </div>
  );
}

function TableBlock({ content }: { content: string }) {
  let tableData: string[][] = [];
  try {
    tableData = JSON.parse(content ?? '[]');
  } catch {
    // Try parsing as markdown table
    const lines = (content ?? '').split('\n').filter((l: string) => l?.trim?.() && !l?.match?.(/^\|?[\s-|]+\|?$/));
    tableData = lines?.map?.((line: string) => line?.split?.('|')?.map?.((cell: string) => cell?.trim?.())?.filter?.(Boolean) ?? []) ?? [];
  }
  if ((tableData?.length ?? 0) === 0) return null;
  const headers = tableData?.[0] ?? [];
  const rows = tableData?.slice?.(1) ?? [];
  return (
    <div className="my-3 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            {headers?.map?.((h: string, i: number) => (
              <th key={i} className="px-4 py-2.5 text-left font-semibold text-xs uppercase tracking-wider text-foreground">{h ?? ''}</th>
            )) ?? []}
          </tr>
        </thead>
        <tbody>
          {rows?.map?.((row: string[], i: number) => (
            <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
              {row?.map?.((cell: string, j: number) => (
                <td key={j} className="px-4 py-2 text-sm text-foreground">{cell ?? ''}</td>
              )) ?? []}
            </tr>
          )) ?? []}
        </tbody>
      </table>
    </div>
  );
}

interface SectionVersionData {
  id: string;
  versionNumber: number;
  title: string;
  contentSnapshot: string;
  action: string;
  changeNote: string | null;
  createdAt: string;
}

export default function ChapterView({ chapterId }: { chapterId: string }) {
  const { data: session } = useSession() || {};
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkedSections, setBookmarkedSections] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState<string>('');
  const [versionPanel, setVersionPanel] = useState<string | null>(null);
  const [versions, setVersions] = useState<SectionVersionData[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);

  const showVersions = async (sectionId: string) => {
    if (versionPanel === sectionId) { setVersionPanel(null); return; }
    setVersionPanel(sectionId);
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/sections/${sectionId}/versions`);
      const data = await res.json();
      setVersions(data?.versions ?? []);
    } catch { setVersions([]); } finally { setLoadingVersions(false); }
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/chapters/${chapterId}`)
      .then((r) => r?.json?.())
      .then((data: any) => {
        setChapter(data?.chapter ?? null);
        if (data?.chapter?.sections?.[0]?.id) setActiveSection(data.chapter.sections[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [chapterId]);

  useEffect(() => {
    fetch('/api/bookmarks')
      .then((r) => r?.json?.())
      .then((data: any) => {
        const ids = new Set<string>((data?.bookmarks ?? [])?.map?.((b: any) => b?.sectionId)?.filter?.(Boolean) ?? []);
        setBookmarkedSections(ids);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!chapterId) return;
    fetch(`/api/videos?chapterId=${chapterId}&limit=6`)
      .then((r) => r?.json?.())
      .then((d) => setRelatedVideos(d?.videos ?? []))
      .catch(() => {});
  }, [chapterId]);

  const toggleBookmark = useCallback(async (sectionId: string) => {
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId }),
      });
      const data = await res.json();
      setBookmarkedSections((prev) => {
        const next = new Set(prev);
        if (data?.bookmarked) { next.add(sectionId); toast.success('Bladwijzer toegevoegd'); }
        else { next.delete(sectionId); toast.success('Bladwijzer verwijderd'); }
        return next;
      });
    } catch { toast.error('Fout bij bladwijzer'); }
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="space-y-4">
          {[1,2,3]?.map?.((i: number) => (
            <div key={i} className="h-24 bg-muted/50 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!chapter) {
    return <div className="p-6 text-center text-muted-foreground">Hoofdstuk niet gevonden</div>;
  }

  return (
    <div className="flex">
      {/* Section sidebar (desktop) */}
      <aside className="hidden lg:block w-56 border-r border-border p-4 sticky top-0 h-screen overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Secties</p>
        <div className="space-y-1">
          {chapter?.sections?.map?.((s: Section) => (
            <button
              key={s?.id}
              onClick={() => {
                setActiveSection(s?.id ?? '');
                document?.getElementById?.(s?.id ?? '')?.scrollIntoView?.({ behavior: 'smooth' });
              }}
              className={cn(
                'text-left text-xs px-2 py-1.5 rounded-md w-full truncate transition-colors',
                activeSection === s?.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {s?.title ?? ''}
            </button>
          )) ?? []}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 p-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <BookOpen className="w-4 h-4" />
            <span>{chapter?.guide?.title ?? 'Gids'}</span>
            <ChevronRight className="w-3 h-3" />
            <span>Hoofdstuk {chapter?.number ?? 0}</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-6">
            {chapter?.title ?? ''}
          </h1>
        </motion.div>

        <div className="space-y-8">
          {chapter?.sections?.map?.((section: Section, si: number) => (
            <motion.div
              key={section?.id}
              id={section?.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.05 }}
            >
              <Card style={{ boxShadow: 'var(--shadow-sm)' }}>
                <CardContent className="p-6 chapter-content">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-primary" />
                      <h2 className="font-display text-lg font-semibold text-foreground">{section?.title ?? ''}</h2>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => showVersions(section?.id ?? '')} title="Versiegeschiedenis">
                          <History className={cn('w-4 h-4', versionPanel === section?.id ? 'text-primary' : 'text-muted-foreground')} />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => toggleBookmark(section?.id ?? '')} className="flex-shrink-0">
                        {bookmarkedSections?.has?.(section?.id ?? '') ? (
                          <BookmarkCheck className="w-4 h-4 text-primary" />
                        ) : (
                          <Bookmark className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {(section?.tags?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {section?.tags?.map?.((tag: string, ti: number) => (
                        <Badge key={ti} variant="outline" className="text-[10px]">{tag ?? ''}</Badge>
                      )) ?? []}
                    </div>
                  )}
                  <div className="space-y-2">
                    {section?.blocks?.map?.((block: ContentBlock) => {
                      if (block?.type === 'CODE') return <CodeBlock key={block?.id} content={block?.content ?? ''} language={block?.language ?? null} />;
                      if (block?.type === 'TABLE') return <TableBlock key={block?.id} content={block?.content ?? ''} />;
                      if (block?.type === 'IMAGE' && block?.imageUrl) return (
                        <div key={block?.id} className="my-3">
                          <div className="rounded-lg overflow-hidden border border-border bg-muted/20 max-w-2xl">
                            <img src={block.imageUrl} alt={block?.content || 'Afbeelding'} className="w-full h-auto max-h-[500px] object-contain" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            {block?.content && block.content !== 'Afbeelding' && (
                              <p className="text-xs text-zinc-400 px-3 py-1.5 border-t border-border">{block.content}</p>
                            )}
                          </div>
                        </div>
                      );
                      return (
                        <div key={block?.id} className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                          {block?.content ?? ''}
                        </div>
                      );
                    }) ?? []}
                  </div>
                  {/* Version History Panel */}
                  {versionPanel === section?.id && (
                    <div className="mt-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                          <History className="w-3.5 h-3.5" /> Versiegeschiedenis
                        </h4>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setVersionPanel(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      {loadingVersions ? (
                        <p className="text-xs text-muted-foreground">Laden...</p>
                      ) : versions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Geen versiegeschiedenis beschikbaar voor deze sectie.</p>
                      ) : (
                        <div className="space-y-2">
                          {versions.map((v) => (
                            <div key={v.id} className="p-2 rounded bg-muted/30 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-foreground">v{v.versionNumber} — {v.action.replace(/_/g, ' ')}</span>
                                <span className="text-muted-foreground">{new Date(v.createdAt).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              {v.changeNote && <p className="text-muted-foreground mt-0.5">{v.changeNote}</p>}
                              <details className="mt-1">
                                <summary className="cursor-pointer text-primary hover:underline">Bekijk content</summary>
                                <pre className="mt-1 p-2 bg-muted/50 rounded text-[11px] whitespace-pre-wrap max-h-40 overflow-y-auto text-foreground">{v.contentSnapshot?.substring(0, 2000)}</pre>
                              </details>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )) ?? []}
        </div>

        {/* Related Videos */}
        {relatedVideos.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Play className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-zinc-100">Gerelateerde Video&apos;s</h2>
              <Badge variant="outline" className="text-xs">{relatedVideos.length}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {relatedVideos.map((v: any) => (
                <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" className="block">
                  <Card className="overflow-hidden hover:ring-1 hover:ring-primary/30 transition-all group" style={{ boxShadow: 'var(--shadow-sm)' }}>
                    <div className="relative aspect-video bg-zinc-800">
                      {v.thumbnailUrl ? (
                        <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Play className="w-6 h-6 text-zinc-600" /></div>
                      )}
                      <span className={`absolute top-1.5 left-1.5 text-[9px] px-1 py-0.5 rounded font-bold ${v.language === 'NL' ? 'bg-orange-500/80 text-white' : 'bg-blue-500/80 text-white'}`}>
                        {v.language === 'NL' ? '🇳🇱' : '🇬🇧'}
                      </span>
                    </div>
                    <CardContent className="p-2.5">
                      <h3 className="font-medium text-xs text-zinc-200 line-clamp-2 leading-snug">{v.title}</h3>
                      <p className="text-[10px] text-zinc-500 mt-1">{v.channelName}</p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
