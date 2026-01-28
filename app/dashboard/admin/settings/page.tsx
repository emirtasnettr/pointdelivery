import { redirect } from 'next/navigation';

export default function AdminSettingsPage() {
  // Sistem ayarları artık kullanılmıyor.
  redirect('/dashboard/admin');
}
