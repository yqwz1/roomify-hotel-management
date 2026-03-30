import Header from './Header'
import AppShell from './shell/AppShell'

export default function Layout({ children, showSidebar = false }) {
  if (showSidebar) {
    return <AppShell>{children}</AppShell>
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-zinc-50 font-sans">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  )
}
