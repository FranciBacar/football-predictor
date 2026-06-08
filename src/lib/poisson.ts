// Poissonov model za napoved rezultatov
// lambda = pričakovano število golov

// Faktorial s predpomnenjem
const factCache: number[] = [1]
function factorial(n: number): number {
  if (factCache[n] !== undefined) return factCache[n]
  factCache[n] = n * factorial(n - 1)
  return factCache[n]
}

// Poissonova verjetnost: P(X = k) = e^(-λ) * λ^k / k!
function poissonProb(lambda: number, k: number): number {
  return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k)
}

// Izračunaj matriko verjetnosti rezultatov (do maxGoals golov na stran)
function scoreMatrix(lambdaHome: number, lambdaAway: number, maxGoals = 6): number[][] {
  const matrix: number[][] = []
  for (let h = 0; h <= maxGoals; h++) {
    matrix[h] = []
    for (let a = 0; a <= maxGoals; a++) {
      matrix[h][a] = poissonProb(lambdaHome, h) * poissonProb(lambdaAway, a)
    }
  }
  return matrix
}

export type PoissonResult = {
  lambdaHome: number
  lambdaAway: number
  probHome: number
  probDraw: number
  probAway: number
  topScore: string
  topScoreProb: number
}

// ELO faktor: prilagodi lambda glede na razliko v ELO
// +100 ELO ≈ 14% večja verjetnost zmage
function eloFactor(eloHome: number, eloAway: number): number {
  const diff = eloHome - eloAway
  return Math.pow(10, diff / 400)
}

export function calculatePoisson(
  avgGoalsHome: number,  // povprečje danih golov domačih
  avgGoalsAway: number,  // povprečje danih golov gostov
  avgConcededHome: number, // povprečje prejetih golov domačih
  avgConcededAway: number, // povprečje prejetih golov gostov
  eloHome: number,
  eloAway: number,
  leagueAvgGoals = 2.6  // povprečje golov na tekmo na SP
): PoissonResult {
  const eloAdj = eloFactor(eloHome, eloAway)

  // Dixon-Coles lambda formula
  const lambdaHome = (avgGoalsHome * avgConcededAway / leagueAvgGoals) * eloAdj
  const lambdaAway = (avgGoalsAway * avgConcededHome / leagueAvgGoals) / eloAdj

  const matrix = scoreMatrix(lambdaHome, lambdaAway)

  let probHome = 0, probDraw = 0, probAway = 0
  let topScore = '1:0'
  let topScoreProb = 0

  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      const p = matrix[h][a]
      if (h > a) probHome += p
      else if (h === a) probDraw += p
      else probAway += p

      if (p > topScoreProb) {
        topScoreProb = p
        topScore = `${h}:${a}`
      }
    }
  }

  return {
    lambdaHome: Math.round(lambdaHome * 100) / 100,
    lambdaAway: Math.round(lambdaAway * 100) / 100,
    probHome: Math.round(probHome * 1000) / 1000,
    probDraw: Math.round(probDraw * 1000) / 1000,
    probAway: Math.round(probAway * 1000) / 1000,
    topScore,
    topScoreProb: Math.round(topScoreProb * 1000) / 1000,
  }
}

// Pretvori decimalne kvote v verjetnosti (z margin removal)
export function oddsToProbs(home: number, draw: number, away: number) {
  const margin = 1/home + 1/draw + 1/away
  return {
    probHome: Math.round((1/home / margin) * 1000) / 1000,
    probDraw: Math.round((1/draw / margin) * 1000) / 1000,
    probAway: Math.round((1/away / margin) * 1000) / 1000,
  }
}
