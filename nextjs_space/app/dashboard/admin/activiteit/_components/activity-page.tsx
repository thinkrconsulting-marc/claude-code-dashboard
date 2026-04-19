'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Activity, Users, Eye, Clock, Search, RefreshCw, User, Globe, Monitor,
  Star, Bookmark, Play, LogIn, FileText, ChevronDown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface OnlineUser {
  id: string;
  userId: string;
  user: { id: string; name: string | null; email: string; role: string };
  startedAt: string;
  lastSeenAt: string;
  pagesViewed: number;
  lastPage: string | null;
  lastAction: string | null;
  sessionDuration: number; // minutes
}

interface LogEntry {
  id: string;
  userId: string;
  user: { id: string; name: string | null; email: string };
  action: string;
  page: string | null;
  details: string | null;
  createdAt: string;
}

interface UserStat {
  id: string;
  name: string | null;
  email: string;
  role: string;
  totalActions: number;
  totalSessions: number;
  pageViews: number;
  totalMinutesOnline: number;
  lastActivity: string | null;
  lastPage: string | null;
}

const actionIcons: Record<string, any> = {
  PAGE_VIEW: Eye,
  VIDEO_WATCH: Play,
  VIDEO_RATE: Star,
  BOOKMARK: Bookmark,
  SEARCH: Search,
  LOGIN: LogIn,
  SESSION_START: Monitor,
  HEARTBEAT: Activity,
};

const actionLabels: Record<string, string> = {
  PAGE_VIEW: 'Pagina bekeken',
  VIDEO_WATCH: 'Video bekeken',
  VIDEO_RATE: 'Video beoordeeld',
  BOOKMARK: 'Bladwijzer',
  SEARCH: 'Zoekopdracht',
  LOGIN: 'Ingelogd',
  SESSION_START: 'Sessie gestart',
  SESSION_END: 'Sessie be\u00ebindigd',
  HEARTBEAT: 'Heartbeat',
};

const pageLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/videos': "Video's",
  '/dashboard/zoeken': 'Zoeken',
  '/dashboard/templates': 'Templates',
  '/dashboard/bladwijzers': 'Bladwijzers',
  '/dashboard/commando-referentie': 'Commando Ref.',
  '/dashboard/repos': 'Repo Bibliotheek',
  '/dashboard/security': 'Security',
};

function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return minutes + ' min';
  var h = Math.floor(minutes / 60);
  var m = minutes % 60;
  return h + 'u ' + m + 'min';
}

function getPageLabel(path: string | null): string {
  if (!path) return '-';
  if (pageLabels[path]) return pageLabels[path];
  if (path.startsWith('/dashboard/hoofdstuk/')) return 'Hoofdstuk ' + path.split('/').pop();
  if (path.startsWith('/dashboard/repos/')) return 'Repo Detail';
  if (path.startsWith('/dashboard/admin/')) return 'Admin: ' + path.split('/').pop();
  return path;
}

export default function ActivityPage() {
  const { data: session } = useSession() || {};
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const [tab, setTab] = useState<'online' | 'logs' | 'stats'>('online');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = () => {
    setLoading(true);
    if (tab === 'online') {
      fetch('/api/activity?view=online')
        .then(r => r?.json?.())
        .then(d => setOnlineUsers(d?.onlineUsers ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (tab === 'stats') {
      fetch('/api/activity?view=stats')
        .then(r => r?.json?.())
        .then(d => setUserStats(d?.userStats ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      fetch('/api/activity?view=logs&limit=200')
        .then(r => r?.json?.())
        .then(d => setLogs(d?.logs ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => { fetchData(); }, [tab]);

  // Auto-refresh for online tab
  useEffect(() => {
    if (tab !== 'online' || !autoRefresh) return;
    var interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [tab, autoRefresh]);

  if (!isAdmin) return <div className="p-6 text-zinc-400">Geen toegang</div>;

  var filteredLogs = logs.filter(function(l) {
    if (!filterUser) return true;
    var q = filterUser.toLowerCase();
    return (l.user?.name?.toLowerCase()?.includes(q) || l.user?.email?.toLowerCase()?.includes(q) || l.action?.toLowerCase()?.includes(q) || l.page?.toLowerCase()?.includes(q));
  });

  // Filter out heartbeats from display
  filteredLogs = filteredLogs.filter(function(l) { return l.action !== 'HEARTBEAT'; });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-100">Activiteiten Log</h1>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={"w-4 h-4 mr-1" + (loading ? " animate-spin" : "")} /> Vernieuwen
          </Button>
        </div>
        <p className="text-zinc-400 text-sm mb-6">Gebruikersactiviteit, sessies en online status</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button variant={tab === 'online' ? 'default' : 'outline'} size="sm" onClick={() => setTab('online')}>
          <Monitor className="w-4 h-4 mr-1" /> Online Nu
        </Button>
        <Button variant={tab === 'logs' ? 'default' : 'outline'} size="sm" onClick={() => setTab('logs')}>
          <Activity className="w-4 h-4 mr-1" /> Activiteiten
        </Button>
        <Button variant={tab === 'stats' ? 'default' : 'outline'} size="sm" onClick={() => setTab('stats')}>
          <Users className="w-4 h-4 mr-1" /> Gebruiker Stats
        </Button>
      </div>

      {/* Online Users */}
      {tab === 'online' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-zinc-300">{onlineUsers.length} gebruiker(s) online</span>
          </div>
          {onlineUsers.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-zinc-400">
              <Monitor className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Niemand online op dit moment</p>
            </CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {onlineUsers.map((u) => (
                <Card key={u.id} style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-100">{u.user?.name || u.user?.email}</span>
                            <Badge className={u.user?.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}>
                              {u.user?.role}
                            </Badge>
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          </div>
                          <p className="text-xs text-zinc-400">{u.user?.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-zinc-300">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatDuration(u.sessionDuration)}
                        </p>
                        <p className="text-xs text-zinc-500">{u.pagesViewed} pagina&apos;s bekeken</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                      <span>
                        <Eye className="w-3 h-3 inline mr-1" />
                        Huidige pagina: <span className="text-zinc-200">{getPageLabel(u.lastPage)}</span>
                      </span>
                      <span>Sessie sinds {new Date(u.startedAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity Logs */}
      {tab === 'logs' && (
        <div>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Filter op gebruiker, actie of pagina..."
                value={filterUser}
                onChange={(e: any) => setFilterUser(e?.target?.value ?? '')}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-1">
            {filteredLogs.slice(0, 100).map((log) => {
              var Icon = actionIcons[log.action] || Activity;
              return (
                <div key={log.id} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800/50 transition-colors">
                  <Icon className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-zinc-200">
                      <span className="font-medium">{log.user?.name || log.user?.email}</span>
                      {' '}
                      <span className="text-zinc-400">{actionLabels[log.action] || log.action}</span>
                      {log.page && <span className="text-zinc-500"> — {getPageLabel(log.page)}</span>}
                    </span>
                    {log.details && <p className="text-xs text-zinc-500 truncate">{log.details}</p>}
                  </div>
                  <span className="text-[11px] text-zinc-600 flex-shrink-0">
                    {new Date(log.createdAt).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            {filteredLogs.length === 0 && (
              <div className="text-center py-12 text-zinc-400">
                <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Geen activiteiten gevonden</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Stats */}
      {tab === 'stats' && (
        <div className="grid gap-3">
          {userStats.map((u) => (
            <Card key={u.id} style={{ boxShadow: 'var(--shadow-sm)' }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                      <User className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-100">{u.name || u.email}</span>
                        <Badge className={u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}>
                          {u.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-400">{u.email}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-zinc-800/50 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-zinc-100">{u.totalSessions}</p>
                    <p className="text-[10px] text-zinc-500">Sessies</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-zinc-100">{u.pageViews}</p>
                    <p className="text-[10px] text-zinc-500">Pagina&apos;s bekeken</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-zinc-100">{formatDuration(u.totalMinutesOnline)}</p>
                    <p className="text-[10px] text-zinc-500">Totaal online</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-zinc-100">{u.totalActions}</p>
                    <p className="text-[10px] text-zinc-500">Acties</p>
                  </div>
                </div>
                {u.lastActivity && (
                  <p className="text-xs text-zinc-500 mt-2">
                    Laatst actief: {new Date(u.lastActivity).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {u.lastPage && <span> op {getPageLabel(u.lastPage)}</span>}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
          {userStats.length === 0 && (
            <div className="text-center py-12 text-zinc-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Geen gebruikerstatistieken beschikbaar</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
