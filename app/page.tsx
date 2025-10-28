import { redirect } from 'next/navigation'

export default function HomePage() {
  // Server-side redirect - instant, no client-side overhead
  // Dashboard's loading.tsx will show the beautiful loader during data load
  redirect('/dashboard')
}
