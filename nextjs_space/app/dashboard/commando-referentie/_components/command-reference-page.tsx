'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Search, Copy, Check, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const commands = [
  { cmd: '/init', desc: 'Scant je codebase en genereert een CLAUDE.md', cat: 'Setup' },
  { cmd: '/plan', desc: 'Maakt een stapsgewijs plan — read-only mode', cat: 'Workflow' },
  { cmd: '/compact', desc: 'Comprimeert je sessie om context te besparen', cat: 'Context' },
  { cmd: '/context', desc: 'Controleer hoeveel sessiegeheugen je hebt gebruikt', cat: 'Context' },
  { cmd: '/review', desc: 'Bekijk codewijzigingen voor het committen', cat: 'Code' },
  { cmd: '/clear', desc: 'Wis alles en begin opnieuw', cat: 'Sessie' },
  { cmd: '/model', desc: 'Wissel tussen Opus, Sonnet en Haiku', cat: 'Model' },
  { cmd: '/doctor', desc: 'Diagnosticeer problemen met je setup', cat: 'Setup' },
  { cmd: '/find-skills', desc: 'Blader door en installeer pre-built Skills', cat: 'Skills' },
  { cmd: '/add-dir', desc: 'Voeg een andere map toe aan je sessie', cat: 'Context' },
  { cmd: '/agents', desc: 'Bekijk subagents die op de achtergrond draaien', cat: 'Agents' },
  { cmd: '/config', desc: 'Open je instellingen', cat: 'Setup' },
  { cmd: '/loop', desc: 'Draai een terugkerend schema', cat: 'Workflow' },
  { cmd: '/rewind', desc: 'Draai de laatste actie terug', cat: 'Code' },
  { cmd: '/permissions', desc: 'Pre-autoriseer specifieke commando\'s', cat: 'Security' },
  { cmd: '/mcp', desc: 'Bekijk en beheer verbonden MCP servers', cat: 'MCP' },
  { cmd: '/memory', desc: 'Bekijk en bewerk Claude\'s auto-geheugen', cat: 'Context' },
  { cmd: '/effort high', desc: 'Claude redeneert dieper voor complexe taken', cat: 'Model' },
  { cmd: '/cost', desc: 'Bekijk kosteninformatie voor de huidige sessie', cat: 'Kosten' },
  { cmd: '/login', desc: 'Log in of wissel van account', cat: 'Setup' },
  { cmd: '/terminal-setup', desc: 'Configureer terminal-integratie', cat: 'Setup' },
  { cmd: '/hooks', desc: 'Activeer automatiseringsscripts', cat: 'Hooks' },
];

const cliFlags = [
  { cmd: 'claude', desc: 'Start interactieve modus', cat: 'CLI' },
  { cmd: 'claude --enable-auto-mode', desc: 'Start met Auto Mode aan', cat: 'CLI' },
  { cmd: 'claude -p "prompt"', desc: 'Niet-interactieve modus', cat: 'CLI' },
  { cmd: 'claude --model opus', desc: 'Specificeer welk model te gebruiken', cat: 'CLI' },
  { cmd: 'echo "prompt" | claude', desc: 'Pipe input naar Claude', cat: 'CLI' },
];

const allCommands = [...commands, ...cliFlags];
const categories = [...new Set(allCommands?.map?.((c: any) => c?.cat) ?? [])];

export default function CommandReferencePage() {
  const [filter, setFilter] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const filtered = allCommands?.filter?.((c: any) => {
    const matchesFilter = !filter || (c?.cmd ?? '')?.toLowerCase?.()?.includes?.(filter?.toLowerCase?.()) || (c?.desc ?? '')?.toLowerCase?.()?.includes?.(filter?.toLowerCase?.());
    const matchesCat = !selectedCat || c?.cat === selectedCat;
    return matchesFilter && matchesCat;
  }) ?? [];

  const copyCmd = (cmd: string) => {
    navigator?.clipboard?.writeText?.(cmd ?? '');
    setCopiedCmd(cmd);
    toast.success('Gekopieerd!');
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Commando Referentie</h1>
        <p className="text-muted-foreground text-sm mb-6">Alle slash commando's en CLI opties op een rij</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Filter commando's..." value={filter} onChange={(e: any) => setFilter(e?.target?.value ?? '')} className="pl-10" />
        </div>
        <div className="flex flex-wrap gap-1">
          <Button variant={selectedCat === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCat(null)}>Alles</Button>
          {categories?.map?.((cat: string) => (
            <Button key={cat} variant={selectedCat === cat ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCat(cat === selectedCat ? null : cat)}>{cat}</Button>
          )) ?? []}
        </div>
      </div>

      <div className="space-y-2">
        {filtered?.map?.((cmd: any, i: number) => (
          <motion.div key={cmd?.cmd} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
            <Card className="hover:bg-accent/20 transition-colors" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <CardContent className="p-3 flex items-center gap-3">
                <Terminal className="w-4 h-4 text-primary flex-shrink-0" />
                <code className="font-mono text-sm font-medium text-amber-300 min-w-[180px]">{cmd?.cmd ?? ''}</code>
                <span className="text-sm text-zinc-200 flex-1">{cmd?.desc ?? ''}</span>
                <Badge variant="outline" className="text-[10px] flex-shrink-0 text-zinc-300 border-zinc-600">{cmd?.cat ?? ''}</Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => copyCmd(cmd?.cmd ?? '')}>
                  {copiedCmd === cmd?.cmd ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )) ?? []}
      </div>

      {(filtered?.length ?? 0) === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Filter className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Geen commando's gevonden</p>
        </div>
      )}
    </div>
  );
}
