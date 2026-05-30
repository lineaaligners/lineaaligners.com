import type { User } from 'firebase/auth';

type RegistrationNotification = {
  userId: string;
  name: string;
  email: string;
  role?: 'doctor' | 'patient';
  status?: string;
  source?: 'password' | 'google' | 'admin';
};

export async function notifyRegistration(user: User | null, data: RegistrationNotification) {
  if (!user) return;

  try {
    const token = await user.getIdToken();
    const response = await fetch('/api/notify-user-created', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...data,
        createdAt: new Date().toISOString(),
        adminLink: `${window.location.origin}/admin`
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      console.warn('Registration email notification failed:', payload?.error || response.statusText);
    }
  } catch (error) {
    console.warn('Registration email notification failed:', error);
  }
}
