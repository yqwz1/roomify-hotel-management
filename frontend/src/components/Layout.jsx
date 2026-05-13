import Header from './Header'
import AppShell from './shell/AppShell'
import SmoothScroll from './motion/SmoothScroll'

export default function Layout({ children, showSidebar = false }) {
  if (showSidebar) {
    return <AppShell>{children}</AppShell>
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#f7f3ed] font-sans">
      <SmoothScroll />
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  )
}
