import { redirect } from 'next/navigation'

export default function HomePage() {
  // Server-side redirect - instant, no loading screen needed
  redirect('/dashboard')
}
