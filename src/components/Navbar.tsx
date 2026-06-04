import Link from 'next/link'
import { Trophy, Users } from 'lucide-react'

export default function Navbar({ activePath }: { activePath: string }) {
  return (
    <>
      {/* Desktop Navbar (prikazano samo na večjih zaslonih) */}
      <nav className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
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

      {/* Mobile Navbar (prikazano samo na telefonih spodaj) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around">
          <Link 
            href="/dashboard" 
            className={`flex-1 py-3 flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              activePath === '/dashboard' 
                ? 'text-blue-600' 
                : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            <Trophy size={24} />
            Napovedi
          </Link>
          
          <Link 
            href="/groups" 
            className={`flex-1 py-3 flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              activePath === '/groups' 
                ? 'text-blue-600' 
                : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            <Users size={24} />
            Skupine
          </Link>
        </div>
      </nav>
    </>
  )
}