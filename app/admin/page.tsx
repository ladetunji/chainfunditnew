import { redirect } from 'next/navigation';

export default function AdminPage() {
  redirect('/admin/admin-dashboard/overview');
}
