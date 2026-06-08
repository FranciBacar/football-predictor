'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type KidProfile = {
  id: string
  name: string
  avatar_emoji: string
}

type ProfileContextType = {
  activeKidId: string | null
  activeKidName: string | null
  setActiveKid: (kid: KidProfile | null) => void
  isPlayingAsKid: boolean
}

const ProfileContext = createContext<ProfileContextType>({
  activeKidId: null,
  activeKidName: null,
  setActiveKid: () => {},
  isPlayingAsKid: false,
})

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [activeKidId, setActiveKidId] = useState<string | null>(null)
  const [activeKidName, setActiveKidName] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('active_kid')
    if (stored) {
      try {
        const kid = JSON.parse(stored) as KidProfile
        setActiveKidId(kid.id)
        setActiveKidName(kid.name)
      } catch {}
    }
  }, [])

  const setActiveKid = (kid: KidProfile | null) => {
    if (kid) {
      localStorage.setItem('active_kid', JSON.stringify(kid))
      setActiveKidId(kid.id)
      setActiveKidName(kid.name)
    } else {
      localStorage.removeItem('active_kid')
      setActiveKidId(null)
      setActiveKidName(null)
    }
  }

  return (
    <ProfileContext.Provider value={{
      activeKidId,
      activeKidName,
      setActiveKid,
      isPlayingAsKid: !!activeKidId,
    }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  return useContext(ProfileContext)
}
