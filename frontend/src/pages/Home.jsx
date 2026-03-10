import { useState, useEffect } from 'react'
import { checkHealth } from '../services/healthService'

export default function Home() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await checkHealth()
        setHealth(data)
        setError(null)
      } catch (err) {
        setError('Failed to connect to backend')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchHealth()
  }, [])

  return (
    <div className="h-full bg-zinc-50 p-6 lg:p-10 flex flex-col items-center justify-center text-center">
      <h1 className="text-5xl font-extrabold mb-4 text-black tracking-tight">Welcome to Roomify</h1>
      <p className="text-lg font-bold text-zinc-500 tracking-widest uppercase mb-12">Hotel Management System</p>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 max-w-md w-full">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Backend Connection Status</h2>
        
        {loading && (
          <p className="text-zinc-500 font-bold animate-pulse">Checking connection...</p>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 font-bold px-6 py-4 rounded-2xl">
            <span className="mr-2">❌</span> {error}
          </div>
        )}
        
        {health && (
          <div className="bg-zinc-50 border border-zinc-200 px-6 py-6 rounded-2xl text-left">
            <p className="font-extrabold text-black text-lg flex items-center gap-2"><span className="text-green-500">●</span> Backend Connected!</p>
            <p className="text-xs font-bold text-zinc-500 uppercase mt-4 tracking-wider">Status: <span className="text-black">{health.status}</span></p>
            <p className="text-xs font-bold text-zinc-500 uppercase mt-2 tracking-wider">Time: <span className="text-black">{new Date(health.timestamp).toLocaleString()}</span></p>
          </div>
        )}
      </div>
    </div>
  )
}
