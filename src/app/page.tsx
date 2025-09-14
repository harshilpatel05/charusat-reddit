
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';

import DashboardClient from './DashboardClient';

export default async function Home() {
  let user: { email: string; isFaculty: boolean } | null = null;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    if (!token) throw new Error('No token');
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not set');
    user = jwt.verify(token, secret) as { email: string; isFaculty: boolean };
  } catch {
    redirect('/auth/login');
  }

  return <DashboardClient email={user!.email} isFaculty={user!.isFaculty} />;
}
