import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            Roomify
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition">
              Home
            </Link>
            <Link to="/rooms" className="text-gray-700 hover:text-blue-600 transition">
              Rooms
            </Link>
            <Link to="/bookings" className="text-gray-700 hover:text-blue-600 transition">
              Bookings
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition">
              Login
            </button>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}