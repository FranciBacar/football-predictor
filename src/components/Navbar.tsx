import Link from 'next/link'
import { Trophy, Users } from 'lucide-react'

export default function Navbar({ activePath }: { activePath: string }) {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-3xl mx-auto px-4 flex gap-8">
        <Link 
          href="/dashboard" 
          className={`py-4 flex items-center gap-2 font-medium border-b-2 transition-colors ${
            activePath === '/dashboard' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          <Trophy size={18} />
          Napovedi
        </Link>
        
        <Link 
          href="/groups" 
          className={`py-4 flex items-center gap-2 font-medium border-b-2 transition-colors ${
            activePath === '/groups' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          <Users size={18} />
          Skupine
        </Link>
      </div>
    </nav>
  )
}