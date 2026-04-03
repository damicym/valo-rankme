import { EVAL_PARAMS, IMMORTAL_ELO } from '../valorant_config.js'
import { getSeasonIdByActId } from './db/queries.js'

export function compareActsByDate(actA, actB) {
    const dateA = new Date(actA.startTime).getTime()
    const dateB = new Date(actB.startTime).getTime()

    if (dateA === dateB) return 0
    return dateA < dateB ? -1 : 1
}

export function getShortId(id) {
    return id.slice(0, 4) + ".." + id.slice(-4)
}

export function getRRByElo(elo){
    return elo < IMMORTAL_ELO ? elo % 100 : elo - IMMORTAL_ELO
}

export function normalize(acs, modeId) {
    const { min_acs, max_acs } = EVAL_PARAMS[modeId]
    return Math.max(0, Math.min(1, (acs - min_acs) / (max_acs - min_acs)))
}

// transformación no lineal para balancear los performances medios
export function curve(x, p = 1.5) {
    return 0.5 + Math.sign(x - 0.5) * Math.pow(Math.abs(x - 0.5) * 2, p) / 2
}

export function isUsefulMatch(match, lastStoredMatchId) {
    const availableModes = Object.keys(EVAL_PARAMS)
    return ( match &&
        match.metadata.is_completed && // no está en partida
        match.metadata.party_rr_penaltys.length > 0 && // no es custom
        availableModes.includes(getMatchModeId(match)) && // es un modo válido
        (!lastStoredMatchId || getMatchId(match) !== lastStoredMatchId) // es nueva
    )
}

export function getMatchId(match) {
    return match.metadata?.match_id || match.match_id
}

export function getStartedAt(match) {
    return match.metadata?.started_at || match.started_at
}

export function getMatchMode(match) {
    if (match?.mode) return match.mode
    return match?.metadata?.queue?.name || match?.metadata?.queue?.mode_type || match?.metadata?.mode_type || null
}

export function getMatchModeId(match) {
    if (match?.mode_id) return match.mode_id
    return match?.metadata?.queue?.id || null
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

export function getMatchTeam(m, puuid) {
    const players = m.players.map(p => p.puuid)
    const targetTeam = players.find(p => p.puuid === puuid).team_id
    return players.filter(p => p.team_id === targetTeam) || null
}

export function getUserFromRawMatch(match, puuid) {
    const inMatchPlayer = match.players.find(p => p.puuid === puuid)
    if (!inMatchPlayer) {
        console.log("[ERROR] !inMatchPlayer at getUserFromRawMatch")
        return null
    }
    return { name: inMatchPlayer.name, tag: inMatchPlayer.tag }
}

export async function getMatchSeasonId(match) {
    if (match?.metadata?.season?.id) return match.metadata.season.id
    const actId = match.act_id
    const seasonId = await getSeasonIdByActId(actId)
    return seasonId
}