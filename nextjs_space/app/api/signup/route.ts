export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

// Publieke registratie is uitgeschakeld in de UI (geen knop, /signup redirect
// naar /login). Dit endpoint blijft technisch beschikbaar voor
// systeem-integratie / CI, maar wordt niet aangeboden aan eindgebruikers.
// Nieuwe accounts moeten via /dashboard/admin/gebruikers worden aangemaakt.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body ?? {};
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email en wachtwoord zijn verplicht' },
        { status: 400 },
      );
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Dit e-mailadres is al geregistreerd' },
        { status: 400 },
      );
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name:
          (name && String(name).trim()) ||
          normalizedEmail.split('@')[0] ||
          'User',
        role: 'USER',
      },
    });
    return NextResponse.json({
      id: user?.id,
      email: user?.email,
      name: user?.name,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het aanmelden' },
      { status: 500 },
    );
  }
}
