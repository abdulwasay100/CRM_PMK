import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default function HomePage() {
  const cookieStore = cookies()
  const auth = cookieStore.get('auth-token')

  // If logged in, go to dashboard; otherwise go to login.
  if (auth?.value) redirect('/dashboard')
  redirect('/login')
}
