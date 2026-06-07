/**
 * GET /api/debug — preveri kaj API-Football vrne za WC 2026
 * Samo za razvoj, zbriši po uporabi!
 */
import { NextResponse } from 'next/server'

export async function GET() {
  // Poišči leagues za sezono 2026
  const leaguesRes = await fetch(
    'https://v3.football.api-sports.io/leagues?season=2026&type=Cup&search=World+Cup',
    { headers: { 'x-apisports-key': process.env.FOOTBALL_API_KEY! }, cache: 'no-store' }
  )
  const leaguesData = await leaguesRes.json()

  // Poizkusi z league=1
  const fixturesRes = await fetch(
    'https://v3.football.api-sports.io/fixtures?league=1&season=2026&last=5',
    { headers: { 'x-apisports-key': process.env.FOOTBALL_API_KEY! }, cache: 'no-store' }
  )
  const fixturesData = await fixturesRes.json()

  return NextResponse.json({
    leagues: leaguesData.response?.slice(0, 5),
    fixtureCount: fixturesData.results,
    firstFixture: fixturesData.response?.[0] ?? null,
    errors: fixturesData.errors,
  })
}
