import './globals.css'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import CookieBanner from '@/components/CookieBanner'
import { ProfileProvider } from '@/context/ProfileContext'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'Goodish Football Predictor ⚽',
  description: 'Napovej rezultate tekem SP 2026 — Goodish ekipa',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          !function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="$i ji init en nn Ar tn an Yi capture calculateEventProperties dn register register_once register_for_session unregister unregister_for_session gn getFeatureFlag getFeatureFlagPayload getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync mn identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty fn hn createPersonProfile setInternalOrTestUser pn Ji opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing un debug Dr vn getPageViewId captureTraceFeedback captureTraceMetric Zi".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
          posthog.init('phc_wwTn6Dd9j4iGk8f3EbighLYkW2uicof5pbfKLmbYMnZv', {
            api_host: 'https://eu.i.posthog.com',
            defaults: '2026-05-30',
            person_profiles: 'identified_only',
          });
        `}} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex flex-col`}
        style={{ background: 'var(--page)', color: 'var(--ink)', fontFamily: 'var(--font)' }}>
        <ProfileProvider>
        <main className="flex-1 flex flex-col">
          {children}
        </main>

        <CookieBanner />
        </ProfileProvider>

        <footer className="w-full border-t pb-20 md:pb-4" style={{ borderColor: 'var(--line)', background: 'white' }}>
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="https://goodish.agency" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', lineHeight: 0 }}>
              <img
                src="https://goodish.agency/wp-content/uploads/2023/06/goodish-logotype-full-color-rgb-1024x251.png"
                alt="Goodish"
                style={{ height: 22, objectFit: 'contain', filter: 'hue-rotate(0deg) saturate(1)' }}
              />
            </a>
            <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right', lineHeight: 1.7 }}>
              SP 2026 Predictor<br />
              <a href="/pravila" style={{ color: 'var(--teal)', textDecoration: 'none', fontWeight: 600 }}>Pravila igre</a>
              {' · '}
              <a href="/zasebnost" style={{ color: 'var(--teal)', textDecoration: 'none', fontWeight: 600 }}>Zasebnost</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
