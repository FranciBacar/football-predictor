/**
 * Script: dodaj člane v skupino
 * Uporaba: node scripts/add_group_members.mjs
 *
 * Potrebuje: .env.local z NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Preberi .env.local
const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dir, '..', '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => l.split('=').map(s => s.trim()))
)

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Konfiguracija ──────────────────────────────────────────────────
const GROUP_NAME = 'Bačarji'            // Ime skupine
const NAMES_TO_ADD = ['Mija Bačar', 'Erazem Bačar']  // Imena za dodati

async function main() {
  console.log(`\n🔍 Iščem skupino "${GROUP_NAME}"...\n`)

  // 1. Poišči skupino
  const { data: groups, error: gErr } = await supabase
    .from('groups')
    .select('id, name, invite_code')
    .ilike('name', `%${GROUP_NAME.replace('č','_')}%`)

  if (gErr) { console.error('❌ Napaka pri iskanju skupin:', gErr.message); process.exit(1) }
  if (!groups?.length) {
    console.log('❌ Skupina ni najdena. Vse skupine:')
    const { data: all } = await supabase.from('groups').select('id, name')
    for (const g of all ?? []) console.log(`  - ${g.name} (${g.id})`)
    process.exit(1)
  }

  const group = groups[0]
  console.log(`✅ Skupina: ${group.name} (${group.id})`)

  // 2. Poišči vse uporabnike
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, name, email')
    .order('name')

  console.log(`\n👤 Vsi uporabniki (${allUsers?.length ?? 0}):`)
  for (const u of allUsers ?? []) {
    console.log(`  ${u.name} | ${u.email}`)
  }

  // 3. Za vsako ime iz NAMES_TO_ADD
  console.log('\n')
  for (const name of NAMES_TO_ADD) {
    const user = allUsers?.find(u => u.name.toLowerCase() === name.toLowerCase())
    if (!user) {
      console.log(`⚠️  "${name}" nima računa — pošlji mu/ji vabilo: ${group.invite_code}`)
      continue
    }

    // Preveri ali je že član
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      console.log(`ℹ️  ${user.name} je že član/ica`)
      continue
    }

    // Dodaj v skupino
    const { error: insertError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id })

    if (insertError) {
      console.log(`❌ Napaka pri dodajanju ${user.name}: ${insertError.message}`)
    } else {
      console.log(`✅ ${user.name} (${user.email}) dodan/a v ${group.name}`)
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
