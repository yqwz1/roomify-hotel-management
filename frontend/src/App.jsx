import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Rooms from './pages/Rooms'
import Bookings from './pages/Bookings'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-md">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="text-xl font-bold text-blue-600">
                Roomify
              </Link>
              <div className="flex space-x-4">
                <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                  Home
                </Link>
                <Link to="/rooms" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                  Rooms
                </Link>
                <Link to="/bookings" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                  Bookings
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}