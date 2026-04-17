'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, BookOpen, ChevronRight, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';

interface BookmarkData {
  id: string;
  sectionId: string;
  section: {
    id: string;
    title: string;
    chapter: { id: string; title: string; number: number };
  };
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = () => {
    fetch('/api/bookmarks')
      .then((r) => r?.json?.())
      .then((data: any) => setBookmarks(data?.bookmarks ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookmarks(); }, []);

  const removeBookmark = async (sectionId: string) => {
    try {
      await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId }),
      });
      setBookmarks((prev) => (prev ?? [])?.filter?.((b: any) => b?.sectionId !== sectionId) ?? []);
      toast.success('Bladwijzer verwijderd');
    } catch { toast.error('Fout bij verwijderen'); }
  };

  if (loading) {
    return <div className="p-6 max-w-4xl mx-auto"><div className="space-y-3">{[1,2,3]?.map?.((i: number) => <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-lg" />)}</div></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Bladwijzers</h1>
        <p className="text-muted-foreground text-sm mb-6">Je opgeslagen secties voor snelle toegang</p>
      </motion.div>

      {(bookmarks?.length ?? 0) === 0 ? (
        <div className="text-center text-muted-foreground py-16">
          <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nog geen bladwijzers</p>
          <p className="text-xs mt-1">Klik op het bladwijzer-icoon bij een sectie om deze op te slaan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks?.map?.((bm: BookmarkData, i: number) => (
            <motion.div key={bm?.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card style={{ boxShadow: 'var(--shadow-sm)' }}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bookmark className="w-4 h-4 text-primary" />
                  </div>
                  <Link href={`/dashboard/hoofdstuk/${bm?.section?.chapter?.id}#${bm?.sectionId}`} className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{bm?.section?.title ?? ''}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <BookOpen className="w-3 h-3" />
                      <span>Hoofdstuk {bm?.section?.chapter?.number ?? 0}</span>
                      <ChevronRight className="w-3 h-3" />
                      <span className="truncate">{bm?.section?.chapter?.title?.replace?.(/^Hoofdstuk \d+:\s*/i, '') ?? ''}</span>
                    </div>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => removeBookmark(bm?.sectionId ?? '')} className="flex-shrink-0">
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )) ?? []}
        </div>
      )}
    </div>
  );
}
