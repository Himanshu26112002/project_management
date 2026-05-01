import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-end gap-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-700">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <span className="text-sm font-medium text-gray-700">{user?.name}</span>
      </div>
      <button
        onClick={handleLogout}
        className="text-sm text-gray-500 hover:text-red-600 transition-colors"
      >
        Logout
      </button>
    </header>
  )
}
