'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal, Mail, Lock, Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    setError('');
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError('Ongeldige inloggegevens. Probeer opnieuw.');
      } else {
        router.replace('/dashboard');
      }
    } catch {
      setError('Er is een fout opgetreden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md" style={{ boxShadow: 'var(--shadow-lg)' }}>
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
          <Terminal className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="font-display text-2xl tracking-tight">Claude Code Kennisbank</CardTitle>
        <CardDescription>Log in om toegang te krijgen tot de gids</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="je@email.nl"
                value={email}
                onChange={(e: any) => setEmail(e?.target?.value ?? '')}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Wachtwoord</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e: any) => setPassword(e?.target?.value ?? '')}
                className="pl-10"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Inloggen
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Nog geen account?{' '}
            <Link href="/signup" className="text-primary hover:underline inline-flex items-center gap-1">
              <UserPlus className="w-3 h-3" /> Registreren
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
