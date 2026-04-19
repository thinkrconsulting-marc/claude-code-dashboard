'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Loader2, Check, GitBranch, Star, Copy, Sparkles, History, ChevronDown, ChevronUp, Plus, RefreshCw, AlertTriangle, BookOpen, Image as ImageIcon, Link2, X, Upload, Globe, Trash2 } from 'lucide-react';
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

interface EmbeddedImage {
  id: string;
  file?: File;
  previewUrl: string;
  publicUrl?: string;
  uploading?: boolean;
  uploaded?: boolean;
  error?: string;
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

type InputMode = 'text' | 'url';

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
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [urlInput, setUrlInput] = useState('');
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [images, setImages] = useState<EmbeddedImage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) return <div className="p-6 text-center text-zinc-400">Geen toegang</div>;

  // Upload a single image to S3 and return the public URL
  const uploadImageToS3 = async (file: File): Promise<string | null> => {
    try {
      // 1. Get presigned URL
      const presignedRes = await fetch('/api/text-input/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });
      const presignedData = await presignedRes?.json?.();
      if (!presignedRes?.ok) throw new Error(presignedData?.error || 'Presigned URL mislukt');

      // 2. Upload to S3
      const { uploadUrl, publicUrl } = presignedData;
      // Check if content-disposition is in signed headers
      const signedHeaders = new URL(uploadUrl).searchParams.get('X-Amz-SignedHeaders') || '';
      const headers: Record<string, string> = { 'Content-Type': file.type };
      if (signedHeaders.includes('content-disposition')) {
        headers['Content-Disposition'] = 'attachment';
      }
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers,
        body: file,
      });
      if (!uploadRes?.ok) throw new Error('Upload naar S3 mislukt');

      return publicUrl;
    } catch (err: any) {
      console.error('Image upload error:', err);
      return null;
    }
  };

  // Handle paste event with images
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageItems: DataTransferItem[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        imageItems.push(items[i]);
      }
    }

    if (imageItems.length === 0) return; // No images, let normal paste handle it

    e.preventDefault();

    for (const item of imageItems) {
      const file = item.getAsFile();
      if (!file) continue;

      const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const previewUrl = URL.createObjectURL(file);

      // Add image with preview immediately
      setImages(prev => [...prev, { id, file, previewUrl, uploading: true }]);

      // Upload to S3
      const publicUrl = await uploadImageToS3(file);
      if (publicUrl) {
        setImages(prev => prev.map(img => img.id === id ? { ...img, publicUrl, uploading: false, uploaded: true } : img));
        // Insert image reference in content
        const imgRef = `\n![Afbeelding](${publicUrl})\n`;
        setContent(prev => prev + imgRef);
        toast.success('Afbeelding geüpload!');
      } else {
        setImages(prev => prev.map(img => img.id === id ? { ...img, uploading: false, error: 'Upload mislukt' } : img));
        toast.error('Afbeelding upload mislukt');
      }
    }
  }, []);

  // Handle file input for images
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is geen afbeelding`);
        continue;
      }

      const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const previewUrl = URL.createObjectURL(file);

      setImages(prev => [...prev, { id, file, previewUrl, uploading: true }]);

      const publicUrl = await uploadImageToS3(file);
      if (publicUrl) {
        setImages(prev => prev.map(img => img.id === id ? { ...img, publicUrl, uploading: false, uploaded: true } : img));
        const imgRef = `\n![Afbeelding](${publicUrl})\n`;
        setContent(prev => prev + imgRef);
        toast.success('Afbeelding geüpload!');
      } else {
        setImages(prev => prev.map(img => img.id === id ? { ...img, uploading: false, error: 'Upload mislukt' } : img));
        toast.error('Afbeelding upload mislukt');
      }
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Remove an image
  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img?.publicUrl) {
        // Also remove from content
        setContent(c => c.replace(`![Afbeelding](${img.publicUrl})`, '').replace(/\n\n\n+/g, '\n\n'));
      }
      if (img?.previewUrl) URL.revokeObjectURL(img.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  }, []);

  // Fetch URL content
  const handleFetchUrl = async () => {
    if (!urlInput.trim()) {
      toast.error('Voer een URL in');
      return;
    }
    setFetchingUrl(true);
    try {
      const res = await fetch('/api/text-input/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await res?.json?.();
      if (!res?.ok) {
        toast.error(data?.error ?? 'URL ophalen mislukt');
        return;
      }
      setContent(data?.content ?? '');
      if (data?.title) setTitle(data.title);
      // Add found images
      if (data?.imageUrls?.length > 0) {
        const webImages: EmbeddedImage[] = data.imageUrls.slice(0, 10).map((url: string, i: number) => ({
          id: `web-${Date.now()}-${i}`,
          previewUrl: url,
          publicUrl: url,
          uploaded: true,
        }));
        setImages(webImages);
      }
      toast.success(`Content ge\u00ebtraheerd: ${data?.contentLength ?? 0} tekens`);
      // Switch to text mode to show the extracted content
      setInputMode('text');
    } catch {
      toast.error('Fout bij ophalen URL');
    } finally {
      setFetchingUrl(false);
    }
  };

  const handleProcess = async () => {
    if (content.trim().length < 10) {
      toast.error('Tekst moet minimaal 10 tekens bevatten');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      // Include image URLs in the content for processing
      let processContent = content;
      const uploadedImages = images.filter(i => i.uploaded && i.publicUrl);
      if (uploadedImages.length > 0) {
        const imageList = uploadedImages.map(i => i.publicUrl).join('\n');
        processContent += `\n\n---\nAfbeeldingen:\n${imageList}`;
      }

      const res = await fetch('/api/text-input/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: processContent, imageUrls: uploadedImages.map(i => i.publicUrl) }),
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
    setUrlInput('');
    images.forEach(img => { if (img.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(img.previewUrl); });
    setImages([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight mb-1 text-zinc-100">Tekst Invoer & Verwerking</h1>
            <p className="text-zinc-400 text-sm">Plak tekst met afbeeldingen, of geef een URL in om automatisch content te verwerken.</p>
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
            {/* Mode Tabs */}
            <div className="flex gap-1 p-1 bg-muted/30 rounded-lg w-fit">
              <button
                onClick={() => setInputMode('text')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  inputMode === 'text'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-muted/50'
                }`}
              >
                <FileText className="w-4 h-4" />
                Tekst Plakken
              </button>
              <button
                onClick={() => setInputMode('url')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  inputMode === 'url'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-muted/50'
                }`}
              >
                <Globe className="w-4 h-4" />
                URL Inlezen
              </button>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-zinc-300">Titel (optioneel)</Label>
              <Input id="title" value={title} onChange={(e: any) => setTitle(e?.target?.value ?? '')} placeholder="Bijv. Nieuwe MCP servers update" />
            </div>

            {/* URL Input Mode */}
            <AnimatePresence mode="wait">
              {inputMode === 'url' && (
                <motion.div
                  key="url-input"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="space-y-2">
                    <Label htmlFor="url-field" className="text-zinc-300">URL</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <Input
                          id="url-field"
                          value={urlInput}
                          onChange={(e: any) => setUrlInput(e?.target?.value ?? '')}
                          placeholder="https://docs.example.com/article"
                          className="pl-10"
                          onKeyDown={(e: any) => e?.key === 'Enter' && handleFetchUrl()}
                        />
                      </div>
                      <Button onClick={handleFetchUrl} disabled={fetchingUrl || !urlInput.trim()} className="gap-2 shrink-0">
                        {fetchingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                        {fetchingUrl ? 'Laden...' : 'Inlezen'}
                      </Button>
                    </div>
                    <p className="text-xs text-zinc-500">De pagina wordt opgehaald en de content wordt automatisch geëxtraheerd met AI.</p>
                  </div>

                  {/* Show content preview if fetched */}
                  {content && (
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Geëxtraheerde Content</Label>
                      <Textarea
                        value={content}
                        onChange={(e: any) => setContent(e?.target?.value ?? '')}
                        className="min-h-[250px] font-mono text-sm"
                      />
                      <p className="text-xs text-zinc-500">{content.length} tekens — Je kunt de content bewerken voordat je verwerkt.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Text Input Mode */}
            <AnimatePresence mode="wait">
              {inputMode === 'text' && (
                <motion.div
                  key="text-input"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="content" className="text-zinc-300">Tekst *</Label>
                      <div className="flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs gap-1 text-zinc-400 hover:text-zinc-200"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          Afbeelding Toevoegen
                        </Button>
                      </div>
                    </div>
                    <div className="relative">
                      <Textarea
                        ref={textareaRef}
                        id="content"
                        value={content}
                        onChange={(e: any) => setContent(e?.target?.value ?? '')}
                        onPaste={handlePaste}
                        placeholder={'Plak hier je tekst (inclusief afbeeldingen via Ctrl+V)...\n\nHet systeem zal automatisch:\n• Vergelijken met bestaande hoofdstukken\n• Nieuwe content toevoegen waar nodig\n• Bestaande secties updaten\n• Duplicaten overslaan\n• GitHub repos extraheren en opslaan\n• Afbeeldingen opslaan in de cloud'}
                        className="min-h-[300px] font-mono text-sm"
                      />
                      <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-50 pointer-events-none">
                        <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-[10px] text-zinc-500">Ctrl+V om afbeeldingen te plakken</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>{content.length} tekens</span>
                      <span>Min. 10 tekens vereist</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="space-y-2">
                <Label className="text-zinc-300">Afbeeldingen ({images.length})</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map(img => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden border border-border bg-muted/20">
                      <div className="aspect-video relative">
                        <img
                          src={img.previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        {img.uploading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                          </div>
                        )}
                        {img.error && (
                          <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                          </div>
                        )}
                        {img.uploaded && (
                          <div className="absolute top-1 left-1">
                            <Check className="w-4 h-4 text-green-400 drop-shadow" />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Process Button */}
            <Button onClick={handleProcess} disabled={loading || content.trim().length < 10} className="w-full gap-2" size="lg">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'AI analyseert en verwerkt...' : 'Analyseren & Automatisch Verwerken'}
            </Button>
            {loading && (
              <div className="text-center">
                <p className="text-sm text-zinc-400 animate-pulse">De AI vergelijkt je tekst met alle hoofdstukken en secties...</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Summary Card */}
          <Card className="border-primary/30" style={{ boxShadow: 'var(--shadow-md)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-zinc-100">
                <Check className="w-5 h-5 text-green-400" /> Verwerking Voltooid
              </CardTitle>
              <CardDescription className="text-zinc-400">{result.summary}</CardDescription>
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
                    <p className="text-[10px] text-zinc-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions Detail */}
          <Card style={{ boxShadow: 'var(--shadow-md)' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-zinc-200">Uitgevoerde Acties ({result.actions.length})</CardTitle>
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
                      <span className="font-medium text-sm text-zinc-200">
                        {action.chapterTitle || action.sectionTitle}
                      </span>
                    </div>
                    {action.reason && <p className="text-xs text-zinc-400 mt-1">{action.reason}</p>}
                    {action.error && <p className="text-xs text-red-400 mt-1">⚠️ {action.error}</p>}
                  </div>
                </div>
              ))}
              {result.actions.length === 0 && (
                <p className="text-sm text-zinc-400 text-center py-4">Geen acties uitgevoerd — de tekst bevatte geen nieuwe informatie.</p>
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
                <CardTitle className="text-base flex items-center gap-2 text-zinc-200">
                  <History className="w-4 h-4" /> Verwerkingsgeschiedenis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingLogs ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-zinc-400" /></div>
                ) : logs.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-4">Nog geen verwerkingen uitgevoerd.</p>
                ) : (
                  <div className="space-y-3">
                    {logs.map(log => {
                      let parsedActions: any[] = [];
                      try { parsedActions = JSON.parse(log.actionsJson); } catch {}
                      return (
                        <div key={log.id} className="p-3 rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-zinc-200">{log.inputTitle || 'Zonder titel'}</span>
                              <span className="text-xs text-zinc-500">{log.inputLength} tekens</span>
                            </div>
                            <span className="text-xs text-zinc-500">
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
                                <p key={i} className="text-xs text-zinc-500">
                                  {actionIcons[a.action] ?? '•'} {a.sectionTitle || a.chapterTitle} — {a.reason || actionLabels[a.action]}
                                </p>
                              ))}
                              {parsedActions.length > 5 && <p className="text-xs text-zinc-500">...en {parsedActions.length - 5} meer</p>}
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
