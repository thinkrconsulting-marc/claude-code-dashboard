export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return { ok: false as const, session: null };
  }
  return { ok: true as const, session };
}

export async function GET() {
  try {
    const { ok } = await requireAdmin();
    if (!ok) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true, plainPassword: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ users: users ?? [] });
  } catch (error: any) {
    console.error('Users fetch error:', error);
    return NextResponse.json({ users: [] });
  }
}

export async function POST(request: Request) {
  try {
    const { ok } = await requireAdmin();
    if (!ok) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

    const body = await request.json();
    const { email, password, name, role } = body ?? {};

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mailadres en wachtwoord zijn verplicht' },
        { status: 400 },
      );
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Wachtwoord moet minimaal 6 tekens bevatten' },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const finalRole = role === 'ADMIN' ? 'ADMIN' : 'USER';

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: 'Dit e-mailadres is al in gebruik' },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        plainPassword: String(password),
        name: (name && String(name).trim()) || normalizedEmail.split('@')[0] || 'User',
        role: finalRole,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true, plainPassword: true },
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Fout bij aanmaken gebruiker' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { ok, session } = await requireAdmin();
    if (!ok) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

    const { userId, role, password, name } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId is verplicht' }, { status: 400 });
    }

    const data: Record<string, any> = {};
    if (role === 'ADMIN' || role === 'USER') data.role = role;
    if (typeof name === 'string' && name.trim().length > 0) data.name = name.trim();
    if (typeof password === 'string' && password.length >= 6) {
      data.password = await bcrypt.hash(password, 12);
      data.plainPassword = password;
    }

    // Prevent an admin from demoting themselves if they are the only admin
    if (data.role === 'USER') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, id: true } });
      if (target?.role === 'ADMIN' && adminCount <= 1) {
        return NextResponse.json(
          { error: 'Je kunt de enige admin niet degraderen' },
          { status: 400 },
        );
      }
      if (target?.id === (session?.user as any)?.id) {
        return NextResponse.json(
          { error: 'Je kunt je eigen rol niet verlagen' },
          { status: 400 },
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, role: true, plainPassword: true },
    });
    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Fout bij bijwerken gebruiker' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { ok, session } = await requireAdmin();
    if (!ok) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is verplicht' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!target) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    if (target.id === (session?.user as any)?.id) {
      return NextResponse.json(
        { error: 'Je kunt je eigen account niet verwijderen' },
        { status: 400 },
      );
    }

    if (target.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Je kunt de laatste admin niet verwijderen' },
          { status: 400 },
        );
      }
    }

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Fout bij verwijderen gebruiker' }, { status: 500 });
  }
}
