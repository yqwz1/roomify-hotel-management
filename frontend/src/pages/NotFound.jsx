import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-zinc-50 p-8 text-center">
      <h1 className="text-8xl font-extrabold text-black tracking-tighter mb-4">404</h1>
      <p className="text-lg font-bold text-zinc-500 uppercase tracking-widest mb-10">Page not found</p>
      <Link to="/" className="rounded-full bg-black px-8 py-4 text-sm font-extrabold text-white transition-all shadow-md hover:shadow-lg hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 hover:-translate-y-0.5">
        Go back home
      </Link>
    </div>
  )
}
