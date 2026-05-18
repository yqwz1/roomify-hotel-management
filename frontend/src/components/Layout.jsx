import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import AppShell from './shell/AppShell'
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
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F5F2EA] font-sans">
      <SmoothScroll />
      <HashScroller />
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  )
}
