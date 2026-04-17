'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Copy, Check, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  content: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r?.json?.())
      .then((data: any) => setTemplates(data?.templates ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = (content: string, id: string) => {
    navigator?.clipboard?.writeText?.(content ?? '');
    setCopiedId(id);
    toast.success('Gekopieerd naar klembord!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories = [...new Set(templates?.map?.((t: any) => t?.category) ?? [])];

  if (loading) {
    return <div className="p-6 max-w-4xl mx-auto"><div className="space-y-4">{[1,2,3]?.map?.((i: number) => <div key={i} className="h-32 bg-muted/50 animate-pulse rounded-lg" />)}</div></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">CLAUDE.md Templates</h1>
        <p className="text-muted-foreground text-sm mb-6">Kant-en-klare CLAUDE.md bestanden voor verschillende projecttypes</p>
      </motion.div>

      <Tabs defaultValue={categories?.[0] ?? 'all'}>
        <TabsList className="mb-4">
          {categories?.map?.((cat: string) => (
            <TabsTrigger key={cat} value={cat} className="capitalize">
              {cat ?? ''}
            </TabsTrigger>
          )) ?? []}
        </TabsList>

        {categories?.map?.((cat: string) => (
          <TabsContent key={cat} value={cat} className="space-y-4">
            {templates?.filter?.((t: any) => t?.category === cat)?.map?.((template: Template, i: number) => (
              <motion.div
                key={template?.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{template?.name ?? ''}</CardTitle>
                          {template?.description && <CardDescription className="text-xs mt-0.5">{template.description}</CardDescription>}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(template?.content ?? '', template?.id ?? '')}
                        className="gap-1.5"
                      >
                        {copiedId === template?.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === template?.id ? 'Gekopieerd!' : 'Kopiëren'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted/70 rounded-lg p-4 overflow-x-auto text-xs font-mono max-h-96 overflow-y-auto whitespace-pre-wrap">
                      {template?.content ?? ''}
                    </pre>
                  </CardContent>
                </Card>
              </motion.div>
            )) ?? []}
          </TabsContent>
        )) ?? []}
      </Tabs>
    </div>
  );
}
