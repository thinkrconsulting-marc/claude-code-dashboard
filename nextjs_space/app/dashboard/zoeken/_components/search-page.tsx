'use client';
import { useState, useCallback } from 'react';
import { Search, BookOpen, Hash, ChevronRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  tags: string[];
  chapter: { id: string; title: string; number: number };
  blocks: { id: string; type: string; content: string }[];
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const debounceTimer = { current: null as any };

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if ((value?.length ?? 0) < 2) { setResults([]); setSearched(false); return; }
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setResults(data?.results ?? []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
  }, []);

  const highlightText = (text: string, q: string) => {
    if (!q || !text) return text ?? '';
    const parts = text?.split?.(new RegExp(`(${q?.replace?.(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')) ?? [text];
    return parts?.map?.((part: string, i: number) =>
      part?.toLowerCase?.() === q?.toLowerCase?.() ? <mark key={i} className="bg-primary/20 text-primary rounded px-0.5">{part}</mark> : part
    ) ?? text;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Zoeken</h1>
        <p className="text-muted-foreground text-sm mb-6">Doorzoek alle hoofdstukken, secties en content</p>
      </motion.div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Zoek naar commando's, skills, tips..."
          value={query}
          onChange={(e: any) => handleSearch(e?.target?.value ?? '')}
          className="pl-12 h-12 text-base"
          autoFocus
        />
        {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />}
      </div>

      {searched && !loading && (results?.length ?? 0) === 0 && (
        <div className="text-center text-muted-foreground py-12">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Geen resultaten gevonden voor "{query}"</p>
        </div>
      )}

      <div className="space-y-3">
        {results?.map?.((result: SearchResult, i: number) => (
          <motion.div key={result?.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link href={`/dashboard/hoofdstuk/${result?.chapter?.id}#${result?.id}`}>
              <Card className="hover:bg-accent/30 transition-colors cursor-pointer" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <BookOpen className="w-3 h-3" />
                    <span>Hoofdstuk {result?.chapter?.number ?? 0}</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="truncate">{result?.chapter?.title?.replace?.(/^Hoofdstuk \d+:\s*/i, '') ?? ''}</span>
                  </div>
                  <h3 className="font-medium text-sm mb-1">{highlightText(result?.title ?? '', query)}</h3>
                  {(result?.blocks?.length ?? 0) > 0 && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {highlightText((result?.blocks?.[0]?.content ?? '')?.slice?.(0, 200), query)}
                    </p>
                  )}
                  {(result?.tags?.length ?? 0) > 0 && (
                    <div className="flex gap-1 mt-2">
                      {result?.tags?.map?.((t: string, ti: number) => <Badge key={ti} variant="secondary" className="text-[10px]">{t}</Badge>) ?? []}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )) ?? []}
      </div>
    </div>
  );
}
