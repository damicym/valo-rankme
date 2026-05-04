const IMMORTAL_ELO = 2100

export function applyRankToMatches(matches) {
    // ir a back y hacer algo parecido
    const rrs = matches.map(m => m.rr_change)
    const result = matches.map((m, index) => {
        const prevRRs = rrs.slice(0, index)
        const rankInfo = getPlayerRank(prevRRs, null, rrs[index])
        return { ...m, rank: rankInfo.rank, rank_ariation: rankInfo.rankVariation}
    })
    return result
}

export function getPlayerRank(prevRRChanges, initialRank = null, lastRRChange = null) {
    let currentElo = initialRank?.elo || 50
    let shieldLevel = initialRank?.shield || 0
    let allRRChanges = [...prevRRChanges]
    if (lastRRChange !== null) allRRChanges.push(lastRRChange)
    let rankVariation = null

    allRRChanges.forEach((match_rr, index) => {
        const newRawElo = currentElo + match_rr
        const rank = Math.floor(currentElo / 100)
        const nextRank = Math.floor(newRawElo / 100)
        const isImmo = currentElo >= IMMORTAL_ELO
        const won = match_rr > 0
        const atLastMatch = lastRRChange !== null && index === allRRChanges.length - 1

        // si es la ultima partida, en vez de calcular el elo, fijarse si con esa suba o baja de rango
        if (atLastMatch) {
            if (won && rank < nextRank) { 
                rankVariation = true
            } else if (!won && rank > nextRank) {
                rankVariation = false
            }
        } else {
            // no puede bajar de 0 de elo
            if (newRawElo < 0) {
                currentElo = 0
            }
            // al pasar un múltiplo de 100 por menos de 10 rr antes de immortal, se le suma lo necesario para pasarlo por 10 rr
            else if (!isImmo && won && rank < nextRank) {
                currentElo = Math.max(newRawElo, nextRank * 100 + 10)
                // si sube al primer rango de la división, se le da 2 escudos. Pero si está en hierro 1 no
                if (currentElo % 300 < 100 && currentElo > 100) shieldLevel = 2
            }
            // al pasar un múltiplo de 100 por menos de 10 rr, se le suma lo necesario para pasarlo por 10 rr
            // no se aplica en immortal (100 rr, 200 rr, etc.)
            else if (currentElo < IMMORTAL_ELO + 100 && !won && rank > nextRank && (currentElo > rank * 100 || shieldLevel > 0)) {
                currentElo = rank * 100
                // sacarle escudo en vez de bajar
                if (shieldLevel > 0) shieldLevel -= 1
            }
            else {
                currentElo = newRawElo
            }
        }
    })
    
    return { elo: currentElo, rr: getRRByElo(currentElo), rank: Math.floor(currentElo / 100), shield: shieldLevel, rankVariation: rankVariation }
}

function getRRByElo(elo){
    return elo < IMMORTAL_ELO ? elo % 100 : elo - IMMORTAL_ELO
}