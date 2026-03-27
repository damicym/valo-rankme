import { EVAL_PARAMS, IMMORTAL_ELO } from '../valorant_config.js'

export function isUsefulMatch(match, lastStoredMatchId) {
    return ( match &&
        match.metadata.is_completed && // no está en partida
        match.metadata.party_rr_penaltys.length > 0 && // no es custom
        // match.metadata.season.id === targetAct.id && // es del act actual
        getMatchMode(match) !== "Deathmatch" && // no es deathmatch
        (!lastStoredMatchId || getMatchId(match) !== lastStoredMatchId) // es nueva
    )
}

export function compareActsByDate(actA, actB) {
    const dateA = new Date(actA.startTime).getTime()
    const dateB = new Date(actB.startTime).getTime()

    if (dateA === dateB) return 0
    return dateA < dateB ? -1 : 1
}

export function getMatchId(match) {
    return match.metadata?.match_id || match.match_id
}

export function getStartedAt(match) {
    return match.metadata?.started_at || match.started_at
}

export function getShortId(id) {
    return id.slice(0, 4) + ".." + id.slice(-4)
}

export function getRRByElo(elo){
    return elo < IMMORTAL_ELO ? elo % 100 : elo - IMMORTAL_ELO
}

export function normalize(acs) {
    return Math.max(0, Math.min(1, (acs - EVAL_PARAMS.min_acs) / (EVAL_PARAMS.max_acs - EVAL_PARAMS.min_acs)))
}

// transformación no lineal para balancear los performances medios
export function curve(x, p = 1.5) {
    return 0.5 + Math.sign(x - 0.5) * Math.pow(Math.abs(x - 0.5) * 2, p) / 2
}

export function getMatchMode(match) {
    if (match?.mode) return match.mode
    return match.metadata.queue.name || match.metadata.mode_type
}

export function getUniqueMatchesById(matches = []) {
    const uniqueById = new Map()
    for (const match of matches) {
        const matchId = getMatchId(match)
        if (!matchId) continue
        uniqueById.set(matchId, match)
    }
    return [...uniqueById.values()]
}