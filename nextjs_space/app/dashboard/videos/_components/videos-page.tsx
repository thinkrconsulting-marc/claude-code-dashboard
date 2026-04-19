'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Search, Star, Eye, EyeOff, ExternalLink, Plus, Clock, Users, Filter,
  RefreshCw, Globe, Tag, MessageSquare, X, ChevronDown, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Image from 'next/image';

interface Video {
  id: string;
  videoId: string;
  title: string;
  url: string;
  channelName: string;
  channelHandle: string | null;
  description: string | null;
  summary: string | null;
  thumbnailUrl: string | null;
  publishedAt: string;
  duration: string | null;
  viewCount: number | null;
  language: 'NL' | 'EN';
  category: string;
  tags: string[];
  watched: boolean;
  rating: number;
  notes: string | null;
  chapter: { id: string; title: string; number: number } | null;
}

const categories = ['ALL', 'INSTALLATIE', 'SKILLS', 'MCP', 'WORKFLOWS', 'TIPS', 'FINANCE', 'PROMPTING', 'PROJECTEN', 'BEGINNERS', 'GEAVANCEERD', 'NIEUWS', 'OVERIG'];
const catLabels: Record<string, string> = {
  ALL: 'Alles', INSTALLATIE: 'Installatie', SKILLS: 'Skills', MCP: 'MCP',
  WORKFLOWS: 'Workflows', TIPS: 'Tips', FINANCE: 'Finance', PROMPTING: 'Prompting',
  PROJECTEN: 'Projecten', BEGINNERS: 'Beginners', GEAVANCEERD: 'Geavanceerd',
  NIEUWS: 'Nieuws', OVERIG: 'Overig',
};
const catColor: Record<string, string> = {
  INSTALLATIE: 'bg-green-500/20 text-green-400', SKILLS: 'bg-blue-500/20 text-blue-400',
  MCP: 'bg-purple-500/20 text-purple-400', WORKFLOWS: 'bg-cyan-500/20 text-cyan-400',
  TIPS: 'bg-amber-500/20 text-amber-400', FINANCE: 'bg-emerald-500/20 text-emerald-400',
  PROMPTING: 'bg-pink-500/20 text-pink-400', PROJECTEN: 'bg-orange-500/20 text-orange-400',
  BEGINNERS: 'bg-lime-500/20 text-lime-400', GEAVANCEERD: 'bg-red-500/20 text-red-400',
  NIEUWS: 'bg-sky-500/20 text-sky-400', OVERIG: 'bg-zinc-500/20 text-zinc-400',
};

function formatDuration(d: string | null): string {
  if (!d) return '';
  const m = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return d;
  const h = m[1] ? `${m[1]}:` : '';
  const min = m[2] || '0';
  const sec = (m[3] || '0').padStart(2, '0');
  return h ? `${h}${min.padStart(2, '0')}:${sec}` : `${min}:${sec}`;
}

function formatViews(n: number | null): string {
  if (n == null) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function StarRating({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} onClick={(e) => { e.stopPropagation(); onChange(rating === s ? 0 : s); }} className="p-0 hover:scale-110 transition-transform">
          <Star className={`w-3.5 h-3.5 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
        </button>
      ))}
    </div>
  );
}

export default function VideosPage() {
  const { data: session } = useSession() || {};
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [selectedLang, setSelectedLang] = useState('ALL');
  const [watchedFilter, setWatchedFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('publishedAt');
  const [total, setTotal] = useState(0);
  const [unwatched, setUnwatched] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addUrl, setAddUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [notesId, setNotesId] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');
  const searchTimer = useRef<any>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const fetchVideos = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCat !== 'ALL') params.set('category', selectedCat);
    if (selectedLang !== 'ALL') params.set('language', selectedLang);
    if (watchedFilter !== 'ALL') params.set('watched', watchedFilter === 'WATCHED' ? 'true' : 'false');
    if (debouncedSearch) params.set('search', debouncedSearch);
    params.set('sort', sortBy);
    fetch(`/api/videos?${params}`)
      .then((r) => r?.json?.())
      .then((d) => {
        setVideos(d?.videos ?? []);
        setTotal(d?.total ?? 0);
        setUnwatched(d?.unwatched ?? 0);
        setCategoryCounts(d?.categoryCounts ?? []);
      })
      .catch(() => toast.error('Fout bij laden'))
      .finally(() => setLoading(false));
  }, [selectedCat, selectedLang, watchedFilter, debouncedSearch, sortBy]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const updateVideo = async (id: string, data: any) => {
    try {
      const res = await fetch('/api/videos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!res.ok) throw new Error();
      setVideos((prev) => prev.map((v) => v.id === id ? { ...v, ...data } : v));
    } catch { toast.error('Update mislukt'); }
  };

  const addVideo = async () => {
    if (!addUrl.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/videos/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: addUrl.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || 'Fout');
      toast.success(`"${d?.video?.title}" toegevoegd!`);
      setShowAddModal(false);
      setAddUrl('');
      fetchVideos();
    } catch (e: any) {
      toast.error(e?.message || 'Video toevoegen mislukt');
    } finally {
      setAdding(false);
    }
  };

  const seedVideos = async () => {
    if (!confirm('Dit doorzoekt 15 kanalen en globale zoekopdrachten. Doorgaan?')) return;
    setSeeding(true);
    toast.info('Video\'s worden opgehaald... Dit kan even duren.');
    try {
      const res = await fetch('/api/videos/seed', { method: 'POST' });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || 'Fout');
      toast.success(`${d?.added ?? 0} video's toegevoegd!`);
      fetchVideos();
    } catch (e: any) {
      toast.error(e?.message || 'Seed mislukt');
    } finally {
      setSeeding(false);
    }
  };

  const saveNotes = (id: string) => {
    updateVideo(id, { notes: notesText });
    setNotesId(null);
    toast.success('Notities opgeslagen');
  };

  const getCatCount = (cat: string) => {
    if (cat === 'ALL') return total;
    const found = categoryCounts.find((c: any) => c.category === cat);
    return found?._count ?? 0;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-100">Video Bibliotheek</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Video Toevoegen
            </Button>
            <Button variant="outline" size="sm" onClick={seedVideos} disabled={seeding}>
              {seeding ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
              {seeding ? 'Bezig...' : 'Seed'}
            </Button>
          </div>
        </div>
        <p className="text-zinc-400 text-sm mb-4">
          {total} video's • {unwatched} onbekeken
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Zoek video's..."
              value={search}
              onChange={(e: any) => setSearch(e?.target?.value ?? '')}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">🌐 Alle Talen</option>
              <option value="NL">🇳🇱 Nederlands</option>
              <option value="EN">🇬🇧 Engels</option>
            </select>
            <select
              value={watchedFilter}
              onChange={(e) => setWatchedFilter(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Alle Status</option>
              <option value="UNWATCHED">👁 Onbekeken</option>
              <option value="WATCHED">✅ Bekeken</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="publishedAt">Nieuwste</option>
              <option value="views">Meeste Views</option>
              <option value="rating">Hoogste Beoordeling</option>
            </select>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const count = getCatCount(cat);
            return (
              <Button
                key={cat}
                variant={selectedCat === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCat(cat)}
                className="text-xs"
              >
                {catLabels[cat] ?? cat}
                {count > 0 && <span className="ml-1 opacity-60">({count})</span>}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Video grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-zinc-800/50 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <Play className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Geen video's gevonden</p>
          <p className="text-xs mt-1">Gebruik "Seed" om video's op te halen of voeg er handmatig een toe</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video, i) => (
            <motion.div key={video.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <Card className="overflow-hidden hover:ring-1 hover:ring-primary/30 transition-all group" style={{ boxShadow: 'var(--shadow-sm)' }}>
                {/* Thumbnail */}
                <a href={video.url} target="_blank" rel="noopener noreferrer" className="block relative aspect-video bg-zinc-800">
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-zinc-600" />
                    </div>
                  )}
                  {video.duration && (
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                      {formatDuration(video.duration)}
                    </span>
                  )}
                  <span className={`absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded font-bold ${video.language === 'NL' ? 'bg-orange-500/80 text-white' : 'bg-blue-500/80 text-white'}`}>
                    {video.language === 'NL' ? '🇳🇱 NL' : '🇬🇧 EN'}
                  </span>
                  {video.watched && (
                    <span className="absolute top-2 right-2 bg-green-500/80 text-white text-[10px] px-1.5 py-0.5 rounded">✓ Bekeken</span>
                  )}
                </a>

                <CardContent className="p-3">
                  {/* Title + channel */}
                  <a href={video.url} target="_blank" rel="noopener noreferrer" className="block">
                    <h3 className="font-semibold text-sm text-zinc-100 line-clamp-2 leading-snug mb-1 hover:text-primary transition-colors">
                      {video.title}
                    </h3>
                  </a>
                  <p className="text-xs text-zinc-400 mb-2">{video.channelName}</p>

                  {/* Summary */}
                  {video.summary && (
                    <p className="text-xs text-zinc-300 line-clamp-2 mb-2">{video.summary}</p>
                  )}

                  {/* Category + Tags */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Badge className={`text-[10px] ${catColor[video.category] ?? catColor.OVERIG}`}>
                      {catLabels[video.category] ?? video.category}
                    </Badge>
                    {video.chapter && (
                      <Badge className="text-[10px] bg-primary/20 text-primary">
                        H{video.chapter.number}
                      </Badge>
                    )}
                    {(video.tags ?? []).slice(0, 2).map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">{t}</Badge>
                    ))}
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <div className="flex items-center gap-3">
                      {video.viewCount != null && (
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{formatViews(video.viewCount)}</span>
                      )}
                      <span>{new Date(video.publishedAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800">
                    <StarRating rating={video.rating} onChange={(r) => updateVideo(video.id, { rating: r })} />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateVideo(video.id, { watched: !video.watched })}
                        className={`p-1 rounded hover:bg-zinc-700/50 transition-colors ${video.watched ? 'text-green-400' : 'text-zinc-500'}`}
                        title={video.watched ? 'Markeer als onbekeken' : 'Markeer als bekeken'}
                      >
                        {video.watched ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setNotesId(video.id); setNotesText(video.notes ?? ''); }}
                        className={`p-1 rounded hover:bg-zinc-700/50 transition-colors ${video.notes ? 'text-amber-400' : 'text-zinc-500'}`}
                        title="Notities"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <a href={video.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Video Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-100">Video Toevoegen</h2>
                <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-zinc-400 mb-4">
                Plak een YouTube URL. De video wordt automatisch gecategoriseerd met AI.
              </p>
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={addUrl}
                onChange={(e: any) => setAddUrl(e?.target?.value ?? '')}
                onKeyDown={(e: any) => e.key === 'Enter' && addVideo()}
                className="mb-4"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>Annuleren</Button>
                <Button onClick={addVideo} disabled={adding || !addUrl.trim()}>
                  {adding ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                  {adding ? 'Toevoegen...' : 'Toevoegen'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Modal */}
      <AnimatePresence>
        {notesId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setNotesId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-100">Notities</h2>
                <button onClick={() => setNotesId(null)} className="text-zinc-400 hover:text-zinc-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Voeg je notities toe..."
                className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-md p-3 text-sm text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setNotesId(null)}>Annuleren</Button>
                <Button onClick={() => saveNotes(notesId)}>Opslaan</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
