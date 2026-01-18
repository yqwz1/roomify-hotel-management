import Header from './Header'
import Footer from './Footer'
import Sidebar from './Sidebar'

export default function Layout({ children, showSidebar = false }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        {showSidebar && <Sidebar />}
        
        <main className="flex-1 bg-gray-50">
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  )
}