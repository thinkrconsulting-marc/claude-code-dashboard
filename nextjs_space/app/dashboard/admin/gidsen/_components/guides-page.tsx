'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { BookOpen, PlusCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Guide {
  id: string;
  title: string;
  description: string | null;
  version: string;
  isMain: boolean;
  _count: { chapters: number };
}

export default function GuidesPage() {
  const { data: session } = useSession() || {};
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const fetchGuides = () => {
    fetch('/api/guides')
      .then((r) => r?.json?.())
      .then((d: any) => setGuides(d?.guides ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchGuides(); }, []);

  if (!isAdmin) return <div className="p-6 text-center text-muted-foreground">Geen toegang</div>;

  const handleCreate = async () => {
    if (!newTitle) { toast.error('Titel is verplicht'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDesc || null }),
      });
      if (res?.ok) {
        toast.success('Gids aangemaakt!');
        setNewTitle('');
        setNewDesc('');
        setDialogOpen(false);
        fetchGuides();
      }
    } catch { toast.error('Fout bij aanmaken'); }
    finally { setCreating(false); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Gidsen Beheren</h1>
            <p className="text-muted-foreground text-sm">Maak en beheer meerdere kennisbankgidsen</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><PlusCircle className="w-4 h-4" /> Nieuwe Gids</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nieuwe Gids Aanmaken</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div><Label>Titel</Label><Input value={newTitle} onChange={(e: any) => setNewTitle(e?.target?.value ?? '')} className="mt-1" placeholder="Naam van de gids" /></div>
                <div><Label>Beschrijving</Label><Input value={newDesc} onChange={(e: any) => setNewDesc(e?.target?.value ?? '')} className="mt-1" placeholder="Optionele beschrijving" /></div>
                <Button className="w-full" onClick={handleCreate} disabled={creating}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Aanmaken
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-3">{[1,2]?.map?.((i: number) => <div key={i} className="h-20 bg-muted/50 animate-pulse rounded-lg" />)}</div>
      ) : (
        <div className="space-y-3">
          {guides?.map?.((guide: Guide, i: number) => (
            <motion.div key={guide?.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card style={{ boxShadow: 'var(--shadow-sm)' }}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{guide?.title ?? ''}</p>
                      {guide?.isMain && <Badge variant="secondary" className="text-[10px]">Hoofdgids</Badge>}
                    </div>
                    {guide?.description && <p className="text-xs text-muted-foreground truncate">{guide.description}</p>}
                  </div>
                  <Badge variant="outline">{guide?._count?.chapters ?? 0} hoofdstukken</Badge>
                </CardContent>
              </Card>
            </motion.div>
          )) ?? []}
        </div>
      )}
    </div>
  );
}
