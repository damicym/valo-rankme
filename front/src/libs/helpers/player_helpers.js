const IMMORTAL_ELO = 2100

export function getPlayerRank(matches) {
    let currentElo = 50
    let shieldLevel = 0
    const skirmishMatches = matches.filter(m => getMatchMode(m) === "Skirmish")
    const matches_rr = skirmishMatches.map(m => m.rr_change)

    matches_rr.forEach(match_rr => {
        // al bajar de 0, el rr se queda en 0
        const newRawElo = currentElo + match_rr
        const rank = Math.floor(currentElo / 100)
        const nextRank = Math.floor(newRawElo / 100)
        const won = match_rr > 0

        if (newRawElo < 0) {
            currentElo = 0
        }
        // al pasar un múltiplo de 100 por menos de 10 rr antes de immortal, se le suma lo necesario para pasarlo por 10 rr
        else if (!(currentElo >= IMMORTAL_ELO) && won && rank < nextRank) {
            currentElo = Math.max(newRawElo, nextRank * 100 + 10)
            // si sube al primer rengo de la división, se le da 2 escudos. Pero si está en hierro 1 no
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
    })
    return { elo: currentElo, rr: getRRByElo(currentElo), rank: Math.floor(currentElo / 100), shield: shieldLevel}
}

function getRRByElo(elo){
    return elo < IMMORTAL_ELO ? elo % 100 : elo - IMMORTAL_ELO
}

function getMatchMode(match) {
    if (match?.mode) return match.mode
    return match.metadata.queue.id === 'custom' ? match.metadata.queue.mode_type : match.metadata.queue.name 
}