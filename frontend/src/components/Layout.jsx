import { useState } from 'react'
import Header from './Header'
import Footer from './Footer'
import Sidebar from './Sidebar'

export default function Layout({ children, showSidebar = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />

      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        <main className={`flex-1 overflow-y-auto ${showSidebar ? 'md:pl-0' : ''}`}>
          {children}
        </main>
      </div>

      <Footer />
    </div>
  )
}