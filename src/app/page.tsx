import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import MatchCard from '@/components/MatchCard'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const dummyMatches = [
    {
      id: '1',
      competition: 'Svetovno prvenstvo',
      home_team: 'Brazilija',
      away_team: 'Francija',
      home_flag: '🇧🇷',
      away_flag: '🇫🇷',
      time: 'Danes ob 21:00 (vaš čas)',
      is_knockout: false,
      status: 'open' as const
    },
    {
      id: '2',
      competition: 'Svetovno prvenstvo',
      home_team: 'ZDA',
      away_team: 'Anglija',
      home_flag: '🇺🇸',
      away_flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      time: 'Danes ob 21:00 (vaš čas)',
      is_knockout: true,
      status: 'open' as const
    },
    {
      id: '3',
      competition: 'Svetovno prvenstvo',
      home_team: 'Argentina',
      away_team: 'Španija',
      home_flag: '🇦🇷',
      away_flag: '🇪🇸',
      time: 'Jutri ob 18:00 (vaš čas)',
      is_knockout: true,
      status: 'locked' as const
    }
  ]

  return (
    <div className="flex-1 w-full flex flex-col items-center bg-[#f8f9f7] min-h-screen font-sans">
      {/* Top Navigation (Mockup Style) */}
      <nav className="w-full bg-white border-b sticky top-0 z-10">
        <div className="w-full max-w-xl mx-auto flex justify-between px-6 pt-4">
          <button className="flex flex-col items-center pb-3 border-b-2 border-emerald-800 text-emerald-800">
            <svg className="mb-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            <span className="text-sm font-semibold">Napovedi</span>
          </button>
          <button className="flex flex-col items-center pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-800">
            <svg className="mb-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
            <span className="text-sm font-medium">Lestvica</span>
          </button>
          <button className="flex flex-col items-center pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-800">
            <svg className="mb-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span className="text-sm font-medium">Skupine</span>
          </button>
          <button className="flex flex-col items-center pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-800">
            <svg className="mb-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span className="text-sm font-medium">Rezultati</span>
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col max-w-xl px-4 py-6 w-full">
        {/* Stats Row */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-[#f0ede5] p-3 rounded-xl flex flex-col justify-center">
            <span className="text-2xl font-bold text-gray-900">4</span>
            <span className="text-xs text-gray-600 font-medium mt-1">tekme danes</span>
          </div>
          <div className="flex-1 bg-[#f0ede5] p-3 rounded-xl flex flex-col justify-center">
            <span className="text-2xl font-bold text-gray-900">2</span>
            <span className="text-xs text-gray-600 font-medium mt-1">čaka napoved</span>
          </div>
          <div className="flex-1 bg-[#f0ede5] p-3 rounded-xl flex flex-col justify-center">
            <span className="text-2xl font-bold text-gray-900">47</span>
            <span className="text-xs text-gray-600 font-medium mt-1">skupaj točk</span>
          </div>
        </div>

        {/* Date Header */}
        <h3 className="text-gray-800 font-semibold mb-4 ml-1 border-b pb-2">Sreda, 4. junij</h3>

        {/* Match Cards List */}
        <div className="flex flex-col gap-2">
          {dummyMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
        
        {/* Odjava Button (temporary location at bottom) */}
        <div className="mt-8 flex justify-center pb-8">
          <form action="/auth/signout" method="post">
            <button className="text-sm bg-white border shadow-sm hover:bg-gray-50 text-gray-800 py-2 px-6 rounded-full font-medium transition-colors">
              Odjava ({user.email})
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}