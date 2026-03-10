import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

export default function Layout({ children, showSidebar = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-screen flex flex-col bg-zinc-50 overflow-hidden">
      <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />

      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        <main className={`flex-1 overflow-y-auto ${showSidebar ? 'md:ps-0' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
