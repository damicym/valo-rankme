import { IMMORTAL_ELO, EVAL_PARAMS } from '../valorant_config.js'
import { getRRByElo, curve, normalize, getMatchId, getStartedAt, getMatchMode } from './helpers.js'

export function getPlayerRank(matches, puuid) {
    let currentElo = 50
    let shieldLevel = 0
    const matches_rr = matches.map(match => getMatchRR(match, puuid))

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

export function getMatchRR(match, puuid){
    if (match.rr_change) return match.rr_change // para stored matches, sino calcula aca abajo

    const inMatchPlayer = match.players.find(p => p.puuid === puuid)
    if (!inMatchPlayer) {
        console.log("[ERROR] !inMatchPlayer at getMatchRR")
        return 0
    }
    const teamColor = inMatchPlayer.team_id
    const teamInfo = match.teams.find(t => t.team_id === teamColor)

    const won = teamInfo.won
    const roundsDiff = teamInfo.rounds.won - teamInfo.rounds.lost
    const acs = inMatchPlayer.stats.score / (teamInfo.rounds.won + teamInfo.rounds.lost)

    let result = 0
    const acs_normalized = normalize(acs)
    const roundsDiff_normalized = (won ? Math.abs(roundsDiff) : 10 - Math.abs(roundsDiff)) / 10

    let performance = (acs_normalized * 0.65) + (roundsDiff_normalized * 0.35)
    performance = curve(performance)

    if (won) {
        result = EVAL_PARAMS.min_rr + (EVAL_PARAMS.max_rr - EVAL_PARAMS.min_rr) * performance
    }
    else {
        result = EVAL_PARAMS.min_rr + (EVAL_PARAMS.max_rr - EVAL_PARAMS.min_rr) * (1 - performance)
        result = -result
    }

    return Math.round(result)
}

export function getPlayerMatchInfo(match, puuid, previousMatches){
    const inMatchPlayer = match.players.find(p => p.puuid === puuid)
    if (!inMatchPlayer) {
        console.log("[ERROR] !inMatchPlayer at getPlayerMatchInfo")
        return 0
    }
    const teamColor = inMatchPlayer.team_id
    const teamInfo = match.teams.find(t => t.team_id === teamColor)
    const matchClutches = match.rounds.filter(r => r.ceremony === 'CeremonyClutch')

    const roundsWon = teamInfo.rounds.won
    const roundsLost = teamInfo.rounds.lost
    const kills = inMatchPlayer.stats.kills
    const deaths = inMatchPlayer.stats.deaths
    const clutches1v2 = matchClutches.filter(c => {
        const inClutchPlayer = c.stats.find(playerStat => playerStat.player.puuid === puuid)
        if (inClutchPlayer.stats.kills === 2) return true
    })
    const scores = match.players
        .map(p => ({
            puuid: p.puuid,
            team: p.team_id,
            score: p.stats.score
        }))
        .sort((a, b) => b.score - a.score)
    const place = scores.findIndex(p => p.puuid === puuid) + 1
    const allyPlace = scores.findIndex(p => p.team === teamColor && p.puuid !== puuid) + 1

    return {
        match_id: getMatchId(match), // PK
        player_puuid: puuid, // FK
        team_id: teamColor, // FK
        rr_change: getMatchRR(match, puuid),
        rank: getPlayerRank(previousMatches, puuid).rank,
        agent: inMatchPlayer.agent.name,
        won: teamInfo.won,
        roundsWon: roundsWon,
        roundsLost: roundsLost,
        place: place,
        isTeamMVP: place < allyPlace, // skirmish exclusive
        clutches1v2: clutches1v2.length, // skirmish exclusive
        kills: kills,
        deaths: deaths,
        assists: inMatchPlayer.stats.assists,
        kd: deaths === 0
            ? kills
            : Math.round((kills / deaths) * 100) / 100,
        acs: Math.round(inMatchPlayer.stats.score / (roundsWon + roundsLost)),
        map: match.metadata.map.name,
        started_at: getStartedAt(match),
        mode: getMatchMode(match),
        hsPerc: kills / inMatchPlayer.stats.headshots, // not in skirmish
        damageDelta: inMatchPlayer.stats.damage.dealt - inMatchPlayer.stats.damage.received, // not in skirmish
        act_id: match.metadata.season.id // FK
    }
}

export function getUserFromRawMatch(match, puuid) {
    const inMatchPlayer = match.players.find(p => p.puuid === puuid)
    if (!inMatchPlayer) {
        console.log("[ERROR] !inMatchPlayer at getUserFromRawMatch")
        return null
    }
    return { name: inMatchPlayer.name, tag: inMatchPlayer.tag }
}