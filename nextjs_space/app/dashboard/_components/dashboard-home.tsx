'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen, Search, FileText, Bookmark, Terminal, Zap, Server,
  Wrench, ArrowRight, TrendingUp, Users, Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Chapter {
  id: string;
  title: string;
  number: number;
}

const chapterIcons: Record<number, any> = {
  1: BookOpen, 2: Wrench, 3: FileText, 4: FileText, 5: Terminal,
  6: Zap, 7: Server, 8: BookOpen, 9: Wrench, 10: TrendingUp,
  11: TrendingUp, 12: Zap, 13: BookOpen, 14: BookOpen,
};

export default function DashboardHome() {
  const { data: session } = useSession() || {};
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  useEffect(() => {
    fetch('/api/chapters')
      .then((r) => r?.json?.())
      .then((data: any) => setChapters(data?.chapters ?? []))
      .catch(() => {});
  }, []);

  const quickActions = [
    { href: '/dashboard/zoeken', label: 'Zoeken', icon: Search, desc: 'Doorzoek de hele gids' },
    { href: '/dashboard/templates', label: 'Templates', icon: FileText, desc: 'CLAUDE.md voorbeelden' },
    { href: '/dashboard/bladwijzers', label: 'Bladwijzers', icon: Bookmark, desc: 'Opgeslagen secties' },
    { href: '/dashboard/commando-referentie', label: 'Commando\'s', icon: Terminal, desc: 'Slash commando\'s' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8"
      >
        <div className="relative z-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Welkom, <span className="text-primary">{session?.user?.name ?? 'gebruiker'}</span>
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            De complete Claude Code kennisbank — alles over installatie, skills, MCP servers, workflows en meer.
          </p>
        </div>
        <div className="absolute right-4 top-4 opacity-10">
          <Terminal className="w-32 h-32" />
        </div>
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions?.map?.((action: any, i: number) => {
          const Icon = action?.icon;
          return (
            <motion.div
              key={action?.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={action?.href ?? '#'}>
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full" style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <CardContent className="p-4 flex flex-col items-start gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {Icon && <Icon className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{action?.label ?? ''}</p>
                      <p className="text-xs text-muted-foreground">{action?.desc ?? ''}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        }) ?? []}
      </div>

      {/* Chapters grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold tracking-tight">Hoofdstukken</h2>
          <span className="text-sm text-muted-foreground">{chapters?.length ?? 0} hoofdstukken</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters?.map?.((ch: any, i: number) => {
            const Icon = chapterIcons?.[ch?.number] ?? BookOpen;
            return (
              <motion.div
                key={ch?.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <Link href={`/dashboard/hoofdstuk/${ch?.id}`}>
                  <Card className="hover:bg-accent/30 transition-all cursor-pointer group h-full" style={{ boxShadow: 'var(--shadow-sm)' }}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <span className="font-mono text-sm font-bold text-primary">{ch?.number ?? 0}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm leading-tight truncate">
                            {ch?.title?.replace?.(/^Hoofdstuk \d+:\s*/i, '') ?? ''}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Bekijken</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          }) ?? []}
        </div>
      </div>

      {isAdmin && (
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight mb-4">Admin Snelkoppelingen</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/admin/upload">
              <Card className="hover:bg-accent/30 transition-colors cursor-pointer" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Upload className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm">Bestanden Uploaden</span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/admin/gidsen">
              <Card className="hover:bg-accent/30 transition-colors cursor-pointer" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <CardContent className="p-4 flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm">Gidsen Beheren</span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/admin/gebruikers">
              <Card className="hover:bg-accent/30 transition-colors cursor-pointer" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm">Gebruikers Beheren</span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
