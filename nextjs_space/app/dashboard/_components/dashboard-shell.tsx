'use client';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Terminal, BookOpen, Search, FileText, Bookmark, Upload, Users, Settings,
  ChevronLeft, ChevronRight, LogOut, Menu, X, Zap, Wrench, Server,
  LayoutDashboard, PlusCircle, ChevronDown, GitBranch, Shield, Play, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Chapter {
  id: string;
  title: string;
  number: number;
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession() || {};
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersOpen, setChaptersOpen] = useState(true);
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  useEffect(() => {
    fetch('/api/chapters')
      .then((r) => r?.json?.())
      .then((data: any) => setChapters(data?.chapters ?? []))
      .catch(() => {});
  }, []);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/zoeken', label: 'Zoeken', icon: Search },
    { href: '/dashboard/templates', label: 'CLAUDE.md Templates', icon: FileText },
    { href: '/dashboard/bladwijzers', label: 'Bladwijzers', icon: Bookmark },
    { href: '/dashboard/commando-referentie', label: 'Commando Referentie', icon: Terminal },
    { href: '/dashboard/repos', label: 'Repo Bibliotheek', icon: GitBranch },
    { href: '/dashboard/videos', label: "Video's", icon: Play },
    { href: '/dashboard/security', label: 'Security', icon: Shield },
  ];

  const adminItems = [
    { href: '/dashboard/admin/upload', label: 'Bestanden Uploaden', icon: Upload },
    { href: '/dashboard/admin/gidsen', label: 'Gidsen Beheren', icon: PlusCircle },
    { href: '/dashboard/admin/gebruikers', label: 'Gebruikers', icon: Users },
    { href: '/dashboard/admin/tekst-invoer', label: 'Tekst Invoer', icon: FileText },
    { href: '/dashboard/admin/repos', label: 'Repos Beheren', icon: GitBranch },
    { href: '/dashboard/admin/activiteit', label: 'Activiteiten Log', icon: Activity },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-3 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Terminal className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && <span className="font-display font-bold text-base tracking-tight truncate">Claude Code KB</span>}
      </div>
      <ScrollArea className="flex-1 px-2 py-3">
        <div className="space-y-1">
          {navItems?.map?.((item: any) => {
            const Icon = item?.icon;
            const active = pathname === item?.href;
            return (
              <Link key={item?.href} href={item?.href ?? '#'} onClick={() => setMobileOpen(false)}>
                <div className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}>
                  {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                  {!collapsed && <span className="truncate">{item?.label ?? ''}</span>}
                </div>
              </Link>
            );
          }) ?? []}
        </div>

        {!collapsed && (chapters?.length ?? 0) > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setChaptersOpen(!chaptersOpen)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground w-full"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Hoofdstukken</span>
              <ChevronDown className={cn('w-3.5 h-3.5 ml-auto transition-transform', chaptersOpen && 'rotate-180')} />
            </button>
            {chaptersOpen && (
              <div className="space-y-0.5 mt-1">
                {chapters?.map?.((ch: any) => {
                  const active = pathname === `/dashboard/hoofdstuk/${ch?.id}`;
                  return (
                    <Link key={ch?.id} href={`/dashboard/hoofdstuk/${ch?.id}`} onClick={() => setMobileOpen(false)}>
                      <div className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                        active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}>
                        <span className="w-5 h-5 rounded text-xs flex items-center justify-center bg-muted font-mono flex-shrink-0">{ch?.number ?? 0}</span>
                        <span className="truncate">{ch?.title?.replace?.(/^Hoofdstuk \d+:\s*/i, '') ?? ''}</span>
                      </div>
                    </Link>
                  );
                }) ?? []}
              </div>
            )}
          </div>
        )}

        {isAdmin && (
          <div className="mt-4">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" />
              Admin
            </div>
            <div className="space-y-0.5 mt-1">
              {adminItems?.map?.((item: any) => {
                const Icon = item?.icon;
                const active = pathname === item?.href;
                return (
                  <Link key={item?.href} href={item?.href ?? '#'} onClick={() => setMobileOpen(false)}>
                    <div className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                      active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}>
                      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                      {!collapsed && <span className="truncate">{item?.label ?? ''}</span>}
                    </div>
                  </Link>
                );
              }) ?? []}
            </div>
          </div>
        )}
      </ScrollArea>
      <div className="p-3 border-t border-border">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
            {(session?.user?.name ?? session?.user?.email ?? 'U')?.[0]?.toUpperCase?.() ?? 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session?.user?.name ?? 'Gebruiker'}</p>
              <p className="text-xs text-muted-foreground truncate">{isAdmin ? 'Admin' : 'Gebruiker'}</p>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/login' })} title="Uitloggen">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden md:flex flex-col border-r border-border bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center p-2 border-t border-border text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card/50 backdrop-blur-sm">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
          <a href="/dashboard/zoeken" className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Zoeken</span>
          </a>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
