'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Shield, User, Plus, Trash2, Loader2, UserPlus, Eye, EyeOff, KeyRound, Pencil, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  plainPassword: string | null;
}

export default function UsersPage() {
  const { data: session } = useSession() || {};
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const currentUserId = (session?.user as any)?.id as string | undefined;

  // Add-user dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'USER' | 'ADMIN'>('USER');

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Password visibility & edit state
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [editingPassword, setEditingPassword] = useState<string | null>(null);
  const [editPasswordValue, setEditPasswordValue] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const startEditPassword = (user: UserData) => {
    setEditingPassword(user.id);
    setEditPasswordValue(user.plainPassword || '');
  };

  const cancelEditPassword = () => {
    setEditingPassword(null);
    setEditPasswordValue('');
  };

  const savePassword = async (userId: string) => {
    if (editPasswordValue.length < 6) {
      toast.error('Wachtwoord moet minimaal 6 tekens bevatten');
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password: editPasswordValue }),
      });
      const data = await res?.json?.();
      if (!res?.ok) {
        toast.error(data?.error ?? 'Fout bij wijzigen wachtwoord');
        return;
      }
      toast.success('Wachtwoord gewijzigd');
      setEditingPassword(null);
      setEditPasswordValue('');
      fetchUsers();
    } catch {
      toast.error('Fout bij wijzigen wachtwoord');
    } finally {
      setSavingPassword(false);
    }
  };

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/admin/users')
      .then((r) => r?.json?.())
      .then((d) => setUsers(d?.users ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-muted-foreground">Geen toegang</div>
    );
  }

  const resetAddForm = () => {
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('USER');
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    if (!newEmail || !newPassword) {
      toast.error('Vul alle verplichte velden in');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Wachtwoord moet minimaal 6 tekens bevatten');
      return;
    }
    setAddLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });
      const data = await res?.json?.();
      if (!res?.ok) {
        toast.error(data?.error ?? 'Fout bij aanmaken gebruiker');
        return;
      }
      toast.success('Gebruiker aangemaakt');
      resetAddForm();
      setAddOpen(false);
      fetchUsers();
    } catch {
      toast.error('Fout bij aanmaken gebruiker');
    } finally {
      setAddLoading(false);
    }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRoleValue = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRoleValue }),
      });
      const data = await res?.json?.();
      if (!res?.ok) {
        toast.error(data?.error ?? 'Fout bij wijzigen rol');
        return;
      }
      toast.success(`Rol gewijzigd naar ${newRoleValue}`);
      fetchUsers();
    } catch {
      toast.error('Fout bij wijzigen rol');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/admin/users?userId=${encodeURIComponent(deleteTarget.id)}`,
        { method: 'DELETE' },
      );
      const data = await res?.json?.();
      if (!res?.ok) {
        toast.error(data?.error ?? 'Fout bij verwijderen gebruiker');
        return;
      }
      toast.success('Gebruiker verwijderd');
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      toast.error('Fout bij verwijderen gebruiker');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-6 gap-4 flex-wrap"
      >
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
            Gebruikers Beheren
          </h1>
          <p className="text-muted-foreground text-sm">
            Beheer gebruikers, rollen en toegang
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nieuwe gebruiker
        </Button>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3]?.map?.((i: number) => (
            <div
              key={i}
              className="h-16 bg-muted/50 animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : users?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Geen gebruikers gevonden.
        </div>
      ) : (
        <div className="space-y-2">
          {users?.map?.((user: UserData, i: number) => {
            const isSelf = user?.id === currentUserId;
            return (
              <motion.div
                key={user?.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {user?.role === 'ADMIN' ? (
                          <Shield className="w-4 h-4 text-primary" />
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {user?.name ?? user?.email ?? ''}
                          {isSelf ? (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (jij)
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email ?? ''}
                        </p>
                      </div>
                      <Badge
                        variant={user?.role === 'ADMIN' ? 'default' : 'secondary'}
                      >
                        {user?.role ?? ''}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSelf}
                        onClick={() =>
                          toggleRole(user?.id ?? '', user?.role ?? '')
                        }
                      >
                        {user?.role === 'ADMIN' ? 'Maak User' : 'Maak Admin'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={isSelf}
                        onClick={() => setDeleteTarget(user)}
                        aria-label="Gebruiker verwijderen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Password row */}
                    <div className="flex items-center gap-2 pl-12 flex-wrap">
                      <KeyRound className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {editingPassword === user.id ? (
                        <>
                          <Input
                            type="text"
                            value={editPasswordValue}
                            onChange={(e: any) => setEditPasswordValue(e?.target?.value ?? '')}
                            className="h-7 text-xs w-48 font-mono"
                            placeholder="Nieuw wachtwoord (min. 6)"
                            autoFocus
                            onKeyDown={(e: any) => {
                              if (e.key === 'Enter') savePassword(user.id);
                              if (e.key === 'Escape') cancelEditPassword();
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-green-500 hover:text-green-400"
                            onClick={() => savePassword(user.id)}
                            disabled={savingPassword}
                          >
                            {savingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={cancelEditPassword}
                            disabled={savingPassword}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-mono text-muted-foreground select-all">
                            {visiblePasswords.has(user.id)
                              ? (user.plainPassword || '—')
                              : '••••••••'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => togglePasswordVisibility(user.id)}
                            aria-label={visiblePasswords.has(user.id) ? 'Verberg wachtwoord' : 'Toon wachtwoord'}
                          >
                            {visiblePasswords.has(user.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => startEditPassword(user)}
                            aria-label="Wachtwoord wijzigen"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          }) ?? []}
        </div>
      )}

      {/* Add user dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(o: boolean) => {
          setAddOpen(o);
          if (!o) resetAddForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Nieuwe gebruiker
            </DialogTitle>
            <DialogDescription>
              Maak een nieuw account aan. Deel de inloggegevens veilig met de
              gebruiker.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Naam</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e: any) => setNewName(e?.target?.value ?? '')}
                placeholder="Volledige naam"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">E-mailadres *</Label>
              <Input
                id="new-email"
                type="email"
                required
                value={newEmail}
                onChange={(e: any) => setNewEmail(e?.target?.value ?? '')}
                placeholder="gebruiker@voorbeeld.nl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Wachtwoord *</Label>
              <Input
                id="new-password"
                type="text"
                required
                minLength={6}
                value={newPassword}
                onChange={(e: any) => setNewPassword(e?.target?.value ?? '')}
                placeholder="Minimaal 6 tekens"
              />
              <p className="text-xs text-muted-foreground">
                Deel dit wachtwoord veilig met de gebruiker.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">Rol</Label>
              <Select
                value={newRole}
                onValueChange={(v: string) =>
                  setNewRole(v === 'ADMIN' ? 'ADMIN' : 'USER')
                }
              >
                <SelectTrigger id="new-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User (alleen lezen)</SelectItem>
                  <SelectItem value="ADMIN">
                    Admin (volledige toegang)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
                disabled={addLoading}
              >
                Annuleren
              </Button>
              <Button type="submit" disabled={addLoading}>
                {addLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Aanmaken
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o: boolean) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gebruiker verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Je staat op het punt om{' '}
              <span className="font-medium text-foreground">
                {deleteTarget?.name ?? deleteTarget?.email}
              </span>{' '}
              permanent te verwijderen. Deze actie kan niet ongedaan worden
              gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Annuleren
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e: any) => {
                e?.preventDefault?.();
                confirmDelete();
              }}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
