'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Bookmark, BookmarkCheck, Copy, Check, ChevronRight, BookOpen, Code, Table2, Hash } from 'lucide-react';
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

export default function ChapterView({ chapterId }: { chapterId: string }) {
  const { data: session } = useSession() || {};
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkedSections, setBookmarkedSections] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState<string>('');

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
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-primary" />
                      <h2 className="font-display text-lg font-semibold">{section?.title ?? ''}</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleBookmark(section?.id ?? '')}
                      className="flex-shrink-0"
                    >
                      {bookmarkedSections?.has?.(section?.id ?? '') ? (
                        <BookmarkCheck className="w-4 h-4 text-primary" />
                      ) : (
                        <Bookmark className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
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
                      return (
                        <div key={block?.id} className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                          {block?.content ?? ''}
                        </div>
                      );
                    }) ?? []}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )) ?? []}
        </div>
      </div>
    </div>
  );
}
