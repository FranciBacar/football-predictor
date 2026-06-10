import Link from 'next/link'
import { Trophy, Users, BarChart2, UserCircle } from 'lucide-react'
import NavbarProfileSwitcher from './NavbarProfileSwitcher'
import MobileProfileSwitcher from './MobileProfileSwitcher'

export default function Navbar({ activePath }: { activePath: string }) {
  const linkBase = 'py-4 flex items-center gap-2 font-medium border-b-2 transition-colors'
  const active = `border-[#0f766e] text-[#0f766e]`
  const inactive = 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'

  const mobileBase = 'flex-1 py-3 flex flex-col items-center gap-1 text-xs font-medium transition-colors'
  const mobileActive = 'text-[#0f766e]'
  const mobileInactive = 'text-gray-400 hover:text-gray-900'

  return (
    <>
      {/* Desktop */}
      <nav className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 flex items-center gap-8">
          <Link href="/dashboard" className={`${linkBase} ${activePath === '/dashboard' ? active : inactive}`}>
            <Trophy size={18} />
            Napovedi
          </Link>
          <Link href="/leaderboard" className={`${linkBase} ${activePath === '/leaderboard' ? active : inactive}`}>
            <BarChart2 size={18} />
            Lestvica
          </Link>
          <Link href="/groups" className={`${linkBase} ${activePath === '/groups' ? active : inactive}`}>
            <Users size={18} />
            Skupine
          </Link>
          <Link href="/profile" data-tour="profile-link" className={`${linkBase} ${activePath === '/profile' ? active : inactive}`}>
            <UserCircle size={18} />
            Profil
          </Link>
          <div className="ml-auto" data-tour="profile-switcher">
            <NavbarProfileSwitcher />
          </div>
        </div>
      </nav>

      {/* Mobile top bar — profile switcher */}
      <div className="md:hidden fixed top-0 right-0 z-50 p-2">
        <MobileProfileSwitcher />
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around">
          <Link href="/dashboard" className={`${mobileBase} ${activePath === '/dashboard' ? mobileActive : mobileInactive}`}>
            <Trophy size={22} />
            Napovedi
          </Link>
          <Link href="/leaderboard" className={`${mobileBase} ${activePath === '/leaderboard' ? mobileActive : mobileInactive}`}>
            <BarChart2 size={22} />
            Lestvica
          </Link>
          <Link href="/groups" className={`${mobileBase} ${activePath === '/groups' ? mobileActive : mobileInactive}`}>
            <Users size={22} />
            Skupine
          </Link>
          <Link href="/profile" className={`${mobileBase} ${activePath === '/profile' ? mobileActive : mobileInactive}`}>
            <UserCircle size={22} />
            Profil
          </Link>
        </div>
      </nav>
    </>
  )
}
