import { IMMORTAL_ELO, EVAL_PARAMS } from '../valorant_config.js'
import { getRRByElo, curve, normalize, getMatchId, getStartedAt, getMatchMode, getMatchModeId } from './helpers.js'


export function getPlayerModeRank(initialRank, rrChanges) {
    let currentElo = initialRank?.elo || 50
    let shieldLevel = initialRank?.shield || 0

    rrChanges.forEach(match_rr => {
        const newRawElo = currentElo + match_rr
        const rank = Math.floor(currentElo / 100)
        const nextRank = Math.floor(newRawElo / 100)
        const isImmo = currentElo >= IMMORTAL_ELO
        const won = match_rr > 0

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
    })
    
    return { elo: currentElo, rr: getRRByElo(currentElo), rank: Math.floor(currentElo / 100), shield: shieldLevel }
}

export function getMatchRR(match, puuid){
    if (match?.rr_change !== undefined) return match.rr_change // para stored matches, sino calcula aca abajo
    const modeId = getMatchModeId(match)
    const evalParams = EVAL_PARAMS[modeId] || EVAL_PARAMS["default"]
    const roundsToWin = evalParams.rounds_to_win

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
    const acs_normalized = normalize(acs, modeId)
    const roundsDiff_normalized = (won ? Math.abs(roundsDiff) : roundsToWin - Math.abs(roundsDiff)) / roundsToWin

    let performance = (acs_normalized * 0.65) + (roundsDiff_normalized * 0.35)
    performance = curve(performance)

    if (won) {
        result = evalParams.min_rr + (evalParams.max_rr - evalParams.min_rr) * performance
    }
    else {
        result = evalParams.min_rr + (evalParams.max_rr - evalParams.min_rr) * (1 - performance)
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

    const roundsWon = teamInfo.rounds.won
    const roundsLost = teamInfo.rounds.lost
    const kills = inMatchPlayer.stats.kills
    const deaths = inMatchPlayer.stats.deaths
    const scores = match.players
        .map(p => ({
            puuid: p.puuid,
            team: p.team_id,
            score: p.stats.score
        }))
        .sort((a, b) => b.score - a.score)
    const place = scores.findIndex(p => p.puuid === puuid) + 1
    const teamMVP = scores.find(p => p.team === teamColor)?.puuid
    const isShotDataMissing = inMatchPlayer.stats.headshots === 0 && inMatchPlayer.stats.bodyshots === 0 && inMatchPlayer.stats.legshots === 0 && kills > 0
    const shotCount = isShotDataMissing ? null : inMatchPlayer.stats.headshots + inMatchPlayer.stats.bodyshots + inMatchPlayer.stats.legshots
    const isDamageDataMissing = inMatchPlayer.stats.damage.dealt === 0 && inMatchPlayer.stats.damage.received === 0 && kills > 0 && deaths > 0
    
    const playersPerTeam = match.players.filter(p => p.team_id === teamColor).length
    let killedThemAllRounds = 0
    let clutchesNKillThemAllRounds = 0
    match.rounds.forEach(r => {
        const inRoundPlayer = r.stats.find(playerStat => playerStat.player.puuid === puuid)
        if (inRoundPlayer?.stats.kills === playersPerTeam) {
            killedThemAllRounds++
            if (r.ceremony === 'CeremonyClutch') clutchesNKillThemAllRounds++
        }
    })

    return {
        match_id: getMatchId(match), // PK
        player_puuid: puuid, // FK
        team_id: teamColor, // FK
        rr_change: getMatchRR(match, puuid),
        rr_eval_version: '1.0',
        rank: 1 /* getPlayerModeRank(previousMatches, puuid).rank */,
        agent: inMatchPlayer.agent.name,
        won: teamInfo.won,
        rounds_won: roundsWon,
        rounds_lost: roundsLost,
        place: place,
        is_team_mvp: teamMVP === puuid,
        clutches_1v2: playersPerTeam === 2 ? clutchesNKillThemAllRounds : null,
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
        hs_perc: isShotDataMissing ? null : kills === 0 ? 0 : Math.round((inMatchPlayer.stats.headshots / shotCount) * 100),
        ddr: isDamageDataMissing ? null : Math.round((inMatchPlayer.stats.damage.dealt - inMatchPlayer.stats.damage.received) / (roundsWon + roundsLost)),
        act_id: match.metadata.season.id, // FK
        aces: playersPerTeam === 5 ? killedThemAllRounds : null,
        mode_id: getMatchModeId(match)
    }
}