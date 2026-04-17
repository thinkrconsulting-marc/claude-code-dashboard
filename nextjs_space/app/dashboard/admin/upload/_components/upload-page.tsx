'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Upload, FileText, Check, X, Loader2, Sparkles, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AISuggestion {
  summary: string;
  suggestedChapterId: string | null;
  suggestedChapterTitle: string;
  suggestedSectionTitle: string;
  suggestedTags: string[];
  contentType: string;
  confidence: number;
}

interface UploadRecord {
  id: string;
  fileName: string;
  fileType: string;
  status: string;
  suggestedChapter: string | null;
  suggestedSection: string | null;
  suggestedTags: string[];
  createdAt: string;
}

interface ChapterOption {
  id: string;
  title: string;
  number: number;
}

export default function UploadPage() {
  const { data: session } = useSession() || {};
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [chapters, setChapters] = useState<ChapterOption[]>([]);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  useEffect(() => {
    fetch('/api/uploads').then(r => r?.json?.()).then(d => setUploads(d?.uploads ?? [])).catch(() => {});
    fetch('/api/chapters').then(r => r?.json?.()).then(d => setChapters(d?.chapters ?? [])).catch(() => {});
  }, []);

  if (!isAdmin) {
    return <div className="p-6 text-center text-muted-foreground">Geen toegang — alleen admins</div>;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e?.target?.files?.[0];
    if (selected) {
      const validTypes = ['.docx', '.pdf', '.md', '.txt'];
      const ext = '.' + (selected?.name?.split?.('.')?.pop?.()?.toLowerCase?.() ?? '');
      if (!validTypes?.includes?.(ext)) {
        toast.error('Alleen .docx, .pdf, .md en .txt bestanden zijn toegestaan');
        return;
      }
      setFile(selected);
      setSuggestion(null);
      setCurrentUploadId(null);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      // 1. Get presigned URL
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/octet-stream', isPublic: false }),
      });
      const { uploadUrl, cloud_storage_path } = await presignedRes.json();
      setProgress(20);

      // 2. Upload to S3
      const uploadHeaders: Record<string, string> = { 'Content-Type': file.type || 'application/octet-stream' };
      if (uploadUrl?.includes?.('content-disposition')) {
        uploadHeaders['Content-Disposition'] = 'attachment';
      }
      await fetch(uploadUrl, { method: 'PUT', headers: uploadHeaders, body: file });
      setProgress(40);

      // 3. Register upload
      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type, cloudStoragePath: cloud_storage_path, isPublic: false }),
      });
      const { upload } = await completeRes.json();
      setCurrentUploadId(upload?.id ?? null);
      setProgress(50);
      setUploading(false);

      // 4. Analyze with AI
      setAnalyzing(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadId', upload?.id ?? '');

      const analyzeRes = await fetch('/api/upload/analyze', { method: 'POST', body: formData });
      
      if (!analyzeRes?.ok) {
        const err = await analyzeRes.json();
        throw new Error(err?.error ?? 'Analyse mislukt');
      }

      // Read SSE stream
      const reader = analyzeRes?.body?.getReader();
      const decoder = new TextDecoder();
      let partialRead = '';
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        partialRead += decoder.decode(value, { stream: true });
        let lines = partialRead.split('\n');
        partialRead = lines?.pop?.() ?? '';
        for (const line of (lines ?? [])) {
          if (line?.startsWith?.('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed?.status === 'processing') {
                setProgress(prev => Math.min((prev ?? 50) + 2, 95));
              } else if (parsed?.status === 'completed') {
                setSuggestion(parsed?.result ?? null);
                setSelectedChapter(parsed?.result?.suggestedChapterId ?? '');
                setSectionTitle(parsed?.result?.suggestedSectionTitle ?? '');
                setProgress(100);
                toast.success('AI analyse voltooid!');
                // Refresh uploads list
                fetch('/api/uploads').then(r => r?.json?.()).then(d => setUploads(d?.uploads ?? [])).catch(() => {});
              } else if (parsed?.status === 'error') {
                throw new Error(parsed?.message ?? 'AI analyse mislukt');
              }
            } catch {}
          }
        }
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error?.message ?? 'Er is een fout opgetreden');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleApprove = async () => {
    if (!currentUploadId || !selectedChapter) {
      toast.error('Selecteer een hoofdstuk');
      return;
    }
    try {
      const res = await fetch('/api/upload/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId: currentUploadId,
          chapterId: selectedChapter,
          sectionTitle: sectionTitle || 'Nieuwe sectie',
          tags: suggestion?.suggestedTags ?? [],
          action: 'approve',
        }),
      });
      if (res?.ok) {
        toast.success('Content goedgekeurd en toegevoegd!');
        setFile(null);
        setSuggestion(null);
        setCurrentUploadId(null);
        fetch('/api/uploads').then(r => r?.json?.()).then(d => setUploads(d?.uploads ?? [])).catch(() => {});
      }
    } catch { toast.error('Fout bij goedkeuren'); }
  };

  const handleReject = async () => {
    if (!currentUploadId) return;
    try {
      await fetch('/api/upload/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId: currentUploadId, action: 'reject' }),
      });
      toast.success('Upload afgewezen');
      setFile(null);
      setSuggestion(null);
      setCurrentUploadId(null);
      fetch('/api/uploads').then(r => r?.json?.()).then(d => setUploads(d?.uploads ?? [])).catch(() => {});
    } catch { toast.error('Fout bij afwijzen'); }
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-500/10 text-yellow-600',
    PROCESSING: 'bg-blue-500/10 text-blue-600',
    REVIEWED: 'bg-purple-500/10 text-purple-600',
    APPROVED: 'bg-green-500/10 text-green-600',
    REJECTED: 'bg-red-500/10 text-red-600',
  };

  const statusIcons: Record<string, any> = {
    PENDING: Clock, PROCESSING: Loader2, REVIEWED: Sparkles, APPROVED: CheckCircle, REJECTED: XCircle,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Bestanden Uploaden</h1>
        <p className="text-muted-foreground text-sm mb-6">Upload bestanden en laat AI de content analyseren en categoriseren</p>
      </motion.div>

      {/* Upload area */}
      <Card style={{ boxShadow: 'var(--shadow-md)' }}>
        <CardContent className="p-6">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef?.current?.click?.()}
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium text-sm">Klik om een bestand te selecteren</p>
            <p className="text-xs text-muted-foreground mt-1">.docx, .pdf, .md, .txt — max 100MB</p>
            <input ref={fileInputRef} type="file" className="hidden" accept=".docx,.pdf,.md,.txt" onChange={handleFileSelect} />
          </div>

          {file && (
            <div className="mt-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file?.name ?? ''}</p>
                  <p className="text-xs text-muted-foreground">{((file?.size ?? 0) / 1024)?.toFixed?.(1)} KB</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setFile(null); setSuggestion(null); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {!suggestion && (
                <Button className="mt-3 w-full gap-2" onClick={handleUploadAndAnalyze} disabled={uploading || analyzing}>
                  {(uploading || analyzing) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {uploading ? 'Uploaden...' : analyzing ? 'AI analyseert...' : 'Uploaden & Analyseren'}
                </Button>
              )}

              {(uploading || analyzing) && (
                <div className="mt-3">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-center">{progress}%</p>
                </div>
              )}
            </div>
          )}

          {/* AI Suggestion */}
          {suggestion && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-display font-semibold">AI Suggestie</h3>
                <Badge variant="secondary">{Math.round((suggestion?.confidence ?? 0) * 100)}% zekerheid</Badge>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Samenvatting</p>
                  <p className="text-sm">{suggestion?.summary ?? ''}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Content Type</p>
                  <Badge>{suggestion?.contentType ?? ''}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase w-full mb-1">Gesuggereerde Tags</p>
                  {suggestion?.suggestedTags?.map?.((tag: string, i: number) => (
                    <Badge key={i} variant="outline">{tag}</Badge>
                  )) ?? []}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Hoofdstuk</Label>
                  <select
                    className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={selectedChapter}
                    onChange={(e: any) => setSelectedChapter(e?.target?.value ?? '')}
                  >
                    <option value="">Selecteer een hoofdstuk...</option>
                    {chapters?.map?.((ch: ChapterOption) => (
                      <option key={ch?.id} value={ch?.id}>{ch?.number}. {ch?.title?.replace?.(/^Hoofdstuk \d+:\s*/i, '') ?? ''}</option>
                    )) ?? []}
                  </select>
                </div>
                <div>
                  <Label>Sectie Titel</Label>
                  <Input value={sectionTitle} onChange={(e: any) => setSectionTitle(e?.target?.value ?? '')} className="mt-1" />
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 gap-2" onClick={handleApprove}>
                  <Check className="w-4 h-4" /> Goedkeuren & Toevoegen
                </Button>
                <Button variant="outline" className="gap-2" onClick={handleReject}>
                  <X className="w-4 h-4" /> Afwijzen
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Upload history */}
      {(uploads?.length ?? 0) > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold mb-3">Upload Geschiedenis</h2>
          <div className="space-y-2">
            {uploads?.map?.((u: UploadRecord) => {
              const StatusIcon = statusIcons?.[u?.status] ?? Clock;
              return (
                <Card key={u?.id} style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium flex-1 truncate">{u?.fileName ?? ''}</span>
                    {u?.suggestedChapter && <span className="text-xs text-muted-foreground hidden sm:block">{u?.suggestedChapter}</span>}
                    <Badge className={cn('text-[10px]', statusColors?.[u?.status] ?? '')}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {u?.status ?? ''}
                    </Badge>
                  </CardContent>
                </Card>
              );
            }) ?? []}
          </div>
        </div>
      )}
    </div>
  );
}
