import { redirect } from 'next/navigation'

export default function Home() {
  // Avtomatsko preusmerimo začetno stran na dashboard (middleware bo poskrbel, da gre na /login, če uporabnik ni prijavljen)
  redirect('/statistike')
}