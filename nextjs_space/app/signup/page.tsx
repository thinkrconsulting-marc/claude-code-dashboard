import { redirect } from 'next/navigation';

export default function SignupPage() {
  // Publieke registratie is uitgeschakeld. Alleen beheerders kunnen gebruikers aanmaken.
  redirect('/login');
}
