export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-bold mb-3">Roomify</h3>
            <p className="text-gray-400 text-sm">
              Modern hotel management system for efficient booking and room management.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-gray-400 hover:text-white transition">
                  Home
                </a>
              </li>
              <li>
                <a href="/rooms" className="text-gray-400 hover:text-white transition">
                  Rooms
                </a>
              </li>
              <li>
                <a href="/bookings" className="text-gray-400 hover:text-white transition">
                  Bookings
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-3">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Email: info@roomify.com</li>
              <li>Phone: +1 (555) 123-4567</li>
              <li>Address: 123 Hotel Street</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-6 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Roomify. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}