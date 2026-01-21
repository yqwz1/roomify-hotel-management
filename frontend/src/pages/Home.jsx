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
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to Roomify</h1>
      <p className="text-gray-600 mb-6">Hotel Management System</p>

      <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
        <h2 className="text-xl font-semibold mb-4">Backend Connection Status</h2>
        
        {loading && (
          <p className="text-gray-500">Checking connection...</p>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            ❌ {error}
          </div>
        )}
        
        {health && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <p className="font-semibold">✅ Backend Connected!</p>
            <p className="text-sm mt-2">Status: {health.status}</p>
            <p className="text-sm">Time: {new Date(health.timestamp).toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  )
}