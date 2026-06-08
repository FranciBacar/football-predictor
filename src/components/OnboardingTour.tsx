'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'onboarding_done_v1'

type Step = {
  title: string
  description: string
  // CSS selector za element ki ga highlightamo
  selector: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

const STEPS: Step[] = [
  {
    title: '⚽ Napovedi tekem',
    description: 'Tu napoveš rezultat vsake tekme. Napovedi se zaklenejo 15 minut pred začetkom tekme.',
    selector: '[data-tour="matches-tab"]',
    position: 'bottom',
  },
  {
    title: '🔮 Posebne napovedi',
    description: 'Napovej zmagovalca SP, najboljšega strelca, MVP-ja in zmagovalce skupin za bonus točke.',
    selector: '[data-tour="special-tab"]',
    position: 'bottom',
  },
  {
    title: '👥 Preklop profila',
    description: 'Tukaj preklopljaš med svojim profilom in profili otrok. Ko izbereš otroka, se napovedi shranijo njemu.',
    selector: '[data-tour="profile-switcher"]',
    position: 'bottom',
  },
  {
    title: '👤 Dodaj otroka',
    description: 'Na profilni strani lahko dodaš otrokov profil brez e-maila. Otrok bo prikazan na skupni in otroški lestvici.',
    selector: '[data-tour="profile-link"]',
    position: 'top',
  },
]

export default function OnboardingTour() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) {
      // Kratek delay da se stran naloži
      setTimeout(() => setVisible(true), 800)
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    const el = document.querySelector(STEPS[step].selector)
    if (el) {
      const rect = el.getBoundingClientRect()
      setTargetRect(rect)
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      setTargetRect(null)
    }
  }, [step, visible])

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else finish()
  }

  if (!visible) return null

  const current = STEPS[step]
  const hasTarget = !!targetRect

  // Izračunaj pozicijo tooltipa glede na target element
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
      }
    }

    const pad = 14
    const tooltipW = 300

    if (current.position === 'bottom') {
      return {
        position: 'fixed',
        top: targetRect.bottom + pad,
        left: Math.min(
          Math.max(targetRect.left + targetRect.width / 2 - tooltipW / 2, 16),
          window.innerWidth - tooltipW - 16
        ),
        width: tooltipW,
        zIndex: 10001,
      }
    }
    if (current.position === 'top') {
      return {
        position: 'fixed',
        bottom: window.innerHeight - targetRect.top + pad,
        left: Math.min(
          Math.max(targetRect.left + targetRect.width / 2 - tooltipW / 2, 16),
          window.innerWidth - tooltipW - 16
        ),
        width: tooltipW,
        zIndex: 10001,
      }
    }
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 10001,
    }
  }

  return (
    <>
      {/* Dark overlay */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.55)',
          pointerEvents: 'none',
        }}
      />

      {/* Highlight cutout around target */}
      {hasTarget && (
        <div
          style={{
            position: 'fixed',
            top: targetRect!.top - 6,
            left: targetRect!.left - 6,
            width: targetRect!.width + 12,
            height: targetRect!.height + 12,
            borderRadius: 12,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
            border: '2px solid rgba(45,212,191,0.8)',
            zIndex: 10000,
            pointerEvents: 'none',
            transition: 'all 0.3s ease',
          }}
        />
      )}

      {/* Tooltip */}
      <div style={{
        ...getTooltipStyle(),
        background: '#fff',
        borderRadius: 16,
        padding: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        pointerEvents: 'all',
      }}>
        {/* Step dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 8, height: 8,
              borderRadius: 999,
              background: i === step ? '#0f766e' : '#e5e7eb',
              transition: 'all 0.2s',
            }} />
          ))}
        </div>

        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>
          {current.title}
        </h3>
        <p style={{ margin: '0 0 18px', fontSize: 14, color: '#4b5563', lineHeight: 1.55 }}>
          {current.description}
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={finish}
            style={{
              fontSize: 13, color: '#9ca3af', background: 'none',
              border: 'none', cursor: 'pointer', padding: '4px 0',
            }}
          >
            Preskoči
          </button>
          <button
            onClick={next}
            style={{
              background: 'linear-gradient(115deg, #0f766e 0%, #2dd4bf 100%)',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '10px 22px', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 4px 14px rgba(15,118,110,0.3)',
            }}
          >
            {step < STEPS.length - 1 ? 'Naprej →' : '✓ Razumem'}
          </button>
        </div>
      </div>
    </>
  )
}
