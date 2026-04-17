'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Users, Shield, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const { data: session } = useSession() || {};
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const fetchUsers = () => {
    fetch('/api/admin/users')
      .then(r => r?.json?.())
      .then(d => setUsers(d?.users ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  if (!isAdmin) return <div className="p-6 text-center text-muted-foreground">Geen toegang</div>;

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res?.ok) {
        toast.success(`Rol gewijzigd naar ${newRole}`);
        fetchUsers();
      }
    } catch { toast.error('Fout bij wijzigen rol'); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Gebruikers Beheren</h1>
        <p className="text-muted-foreground text-sm mb-6">Beheer gebruikersrollen en toegang</p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">{[1,2,3]?.map?.((i: number) => <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-lg" />)}</div>
      ) : (
        <div className="space-y-2">
          {users?.map?.((user: UserData, i: number) => (
            <motion.div key={user?.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card style={{ boxShadow: 'var(--shadow-sm)' }}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {user?.role === 'ADMIN' ? <Shield className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{user?.name ?? user?.email ?? ''}</p>
                    <p className="text-xs text-muted-foreground">{user?.email ?? ''}</p>
                  </div>
                  <Badge variant={user?.role === 'ADMIN' ? 'default' : 'secondary'}>{user?.role ?? ''}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleRole(user?.id ?? '', user?.role ?? '')}
                  >
                    {user?.role === 'ADMIN' ? 'Maak User' : 'Maak Admin'}
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
