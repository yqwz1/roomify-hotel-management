import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import FloatingGuestAssistant from './guest-assistant/FloatingGuestAssistant'
import AppShell from './shell/AppShell'
import PageTransition from './motion/PageTransition'
import SmoothScroll from './motion/SmoothScroll'

function HashScroller() {
  const { hash, pathname } = useLocation()
  useEffect(() => {
    if (!hash) return undefined
    // wait one frame so the target section is mounted, then scroll
    const id = hash.replace(/^#/, '')
    const tick = window.requestAnimationFrame(() => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => window.cancelAnimationFrame(tick)
  }, [hash, pathname])
  return null
}

export default function Layout({ children, showSidebar = false }) {
  if (showSidebar) {
    return <AppShell>{children}</AppShell>
  }

  return (
    <div className="flex min-w-0 min-h-screen flex-col overflow-x-hidden bg-brand-surface font-sans">
      <SmoothScroll />
      <HashScroller />
      <Header />
      <main className="min-w-0 flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <FloatingGuestAssistant />
    </div>
  )
}
