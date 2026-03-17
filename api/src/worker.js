import { config } from '../config.js'
import supabase from './libs/db/supabase.js'

const IMMORTAL_ELO = 2100
const min_rr = 7
const max_rr = 33
const min_acs = 80.0
const max_acs = 260.0

const POLLING_INTERVAL = 3 * 60 * 1000
// const IN_GAME_POLLING_INTERVAL = 1 * 60 * 1000

export async function pollAllPlayers() {
    if (!config.POLLING) return
    const targetAct = 'e11a1'
    const { data: players, error } = await supabase
        .from("players")
        .select("puuid, last_match_id")
    if (error) {
        console.log("(at pollAllPlayers) Error fetching players from database: " + error.message)
        return
    }

    if (!players || players.length === 0) {
        console.log("[INFO] No players found in database to poll.")
        return
    }
    for (const player of players) {
        pollPlayer(player.puuid, player.last_match_id, targetAct)
    }
}

async function pollPlayer(puuid, lastStoredMatchId, targetAct) {
    if (!config.POLLING) return
    let isInGame = false
    let currentLastStoredMatchId = lastStoredMatchId

    const poll = async () => {
        const initialMatches = await getAPIMatches(puuid, 2, 0)
        const lastMatch = initialMatches[0]
        console.log(`[${getShortId(puuid)}] Got last match: ${getShortId(getMatchId(lastMatch))}`)

        // Por ahora RIOT no devuelve a HernikDevAPI partidas en curso
        isInGame = lastMatch && !lastMatch.metadata.is_completed
        // Por si en un futuro cambia, lo logueo para darme cuenta
        if (isInGame) console.log(`[IN-GAME] Player ${getShortId(puuid)}, match ${getShortId(getMatchId(lastMatch))}, started at ${new Date(getStartedAt(lastMatch)).toLocaleTimeString()}`)

        if (isUsefulMatch(lastMatch, currentLastStoredMatchId, targetAct)) {
            const newestStoredMatchId = await processNewMatches(puuid, currentLastStoredMatchId, initialMatches, targetAct)
            if (newestStoredMatchId) {
                currentLastStoredMatchId = newestStoredMatchId
            }
        }

        console.log(`[${getShortId(puuid)}] Next poll at ${new Date(Date.now() + POLLING_INTERVAL).toLocaleTimeString()}`)
        setTimeout(poll, POLLING_INTERVAL) 
    }

    // Ejecutar inmediatamente
    await poll()
}

async function processNewMatches(puuid, lastStoredMatchId, initialMatches, targetAct) {
    const matchesToFetch = 10
    let startIndex = initialMatches.length // empiezo por 2 pq la 0 y 1 ya las tengo con initialMatches
    let areMoreMatches = false
    let matches = [...initialMatches]
    let fetchesCount = 0

    if (!lastStoredMatchId) { // si no hay ningna, fetcheo las ultimas 10 para tener un historial inicial (puede que de esas 10 ninguna sea de skirmish)
        const apiMatches = await getAPIMatches(puuid, 10, startIndex)
        if (!Array.isArray(apiMatches) || apiMatches.length === 0) return
        console.log("[DX] !apiMatches at processNewMatches for player " + getShortId(puuid))
        matches.push(...apiMatches)
        console.log(`[${getShortId(puuid)}] Fetched initial matches`)
    } else {
        areMoreMatches = !matches.some(m => getMatchId(m) === lastStoredMatchId || m.metadata.season.short !== targetAct)
    }
    
    while (lastStoredMatchId && areMoreMatches) {
        fetchesCount++
        console.log(`[${getShortId(puuid)}] Fetching matches... (#${fetchesCount}, from ${startIndex} to ${startIndex + matchesToFetch - 1})`)
        
        const apiMatches = await getAPIMatches(puuid, matchesToFetch, startIndex)
        if (!Array.isArray(apiMatches) || apiMatches.length === 0) {
            console.log(`[${getShortId(puuid)}] !apiMatches at processNewMatches`)
            break
        }
        matches.push(...apiMatches)

        areMoreMatches = !matches.some(m => getMatchId(m) === lastStoredMatchId || m.metadata.season.short !== targetAct) && fetchesCount < 2
        if (!areMoreMatches) {
            matches = matches.slice(0, matches.findIndex(m => getMatchId(m) === lastStoredMatchId))
        } else {
            startIndex = matchesToFetch * fetchesCount + initialMatches.length
        }
    }

    const storedPlayerMatches = await getPlayerMatches(puuid)
    const seenMatchesIds = new Set(storedPlayerMatches?.map(m => getMatchId(m)) || [])
    let newMatches = []
    for (const match of matches) {
        if (!seenMatchesIds.has(getMatchId(match))) {
            seenMatchesIds.add(getMatchId(match))
            if (isUsefulMatch(match, lastStoredMatchId, targetAct)) {
                newMatches.push(match)
            }
        }
    }
    if (!newMatches || newMatches.length === 0) {
        console.log(`[${getShortId(puuid)}] No new matches to process`)
        return null
    }

    const newestStoredMatchId = getMatchId(newMatches[0])
    await saveMatchesToDB(newMatches)
    await updateLastMatchId(puuid, newestStoredMatchId)
    await savePlayerMatchesToDB(puuid, newMatches, storedPlayerMatches)
    await updatePlayerRank(puuid, newMatches, storedPlayerMatches)

    return newestStoredMatchId
}

async function updatePlayerRank(puuid, newMatches, storedPlayerMatches) {
    const allMatches = [...(storedPlayerMatches || []), ...newMatches].sort((a, b) => new Date(getStartedAt(a)) - new Date(getStartedAt(b)))
    const { elo, rr, rank, shield } = getPlayerRank(allMatches, puuid)
    const { data, error } = await supabase
        .from("players")
        .update({ elo, rr, rank, shield })
        .eq("puuid", puuid)
    if (error) {
        console.log(`(at updatePlayerRank) Error updating player rank (${getShortId(puuid)}) in database: ${error.message}`)
    }
}

async function savePlayerMatchesToDB(puuid, rawMatches, storedPlayerMatches) {
    const allMatches = [...(storedPlayerMatches || []), ...rawMatches].sort((a, b) => new Date(getStartedAt(a)) - new Date(getStartedAt(b)))
    const { data, error } = await supabase
        .from("player_matches")
        .insert(await Promise.all(rawMatches.map(async m => {
            const mIndex = allMatches.findIndex(match => getMatchId(match) === getMatchId(m))
            const previousMatches = allMatches.slice(0, mIndex)
            return getPlayerMatchInfo(m, puuid, previousMatches)
        })))
    if (error) {
        console.log("(at savePlayerMatchesToDB) Error saving Player Matches to database: " + error.message)
    } else {
        console.log(`[${getShortId(puuid)}] Saved ${rawMatches.length} Player Matches to database`)
    }
}

async function updateLastMatchId(puuid, matchId) {
    const { data, error } = await supabase
        .from("players")
        .update({ last_match_id: matchId })
        .eq("puuid", puuid)
    if (error) {
        console.log("(at updateLastMatchId) Error updating last match id in database: " + error.message)
    }
}

async function getPlayerMatches(puuid) {
    const { data, error } = await supabase
        .from("player_matches")
        .select("*")
        .eq("player_puuid", puuid)
    if (error) {
        console.log(`(at getPlayerMatches) Error fetching player matches from database: ${error.message}`)
        return null
    }
    return data
}

async function saveMatchesToDB(matches) {
    const { data, error } = await supabase
        .from("matches")
        .insert(matches.map(m => ({
            match_id: getMatchId(m),
            raw_json: m,
            ingested_at: new Date(),
            started_at: getStartedAt(m),
            act: m.metadata.season.short,
            map: m.metadata.map.name,
            mode: m.metadata.queue.mode_type
        })))
    if (error) {
        console.log("(at saveMatchesToDB) Error saving Matches to database: " + error.message)
    } else {
        console.log(`[${getShortId(puuid)}] Saved ${matches.length} Matches to database`)
    }
}

async function getAPIMatches(puuid, size, startIndex, gameMode, region = 'latam', platform = 'pc'){
    try{
        const url = `https://api.henrikdev.xyz/valorant/v4/by-puuid/matches/${region}/${platform}/${puuid}?size=${size}&start=${startIndex}${gameMode ? `&mode=${gameMode}` : ''}`
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': config.HENRIKDEV_ACCESS_TOKEN
            }
        })
        
        const data = await response.json()

        if (!response.ok) {
            if (data.errors && data.errors.length > 0) {
                throw new Error(`HTTP error ${response.status}, ${JSON.stringify(data.errors)}`)
            }
            else {
                throw new Error(`HTTP error ${response.status}`)
            }
        }
        // console.log(`[${getShortId(puuid)}] Fetched ${data.data.length} matches from HenrikDev`)
        return data.data
    } catch(err){
        console.log('(at getAPIMatches()) Error fetching matches from HenrikDev: ' + err)
        return null
    }
}

// #region ==================== AUXILIARES ====================

function getPlayerRank(matches, puuid) {
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

function getMatchRR(match, puuid){
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
        result = min_rr + (max_rr - min_rr) * performance
    }
    else {
        result = min_rr + (max_rr - min_rr) * (1 - performance)
        result = -result
    }

    return Math.round(result)
}

function getPlayerMatchInfo(match, puuid, previousMatches){
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
        match_id: getMatchId(match),
        player_puuid: puuid,
        team_id: teamColor,
        rr_change: getMatchRR(match, puuid),
        rank: getPlayerRank(previousMatches, puuid).rank,
        agent: inMatchPlayer.agent.name,
        won: teamInfo.won,
        roundsWon: roundsWon,
        roundsLost: roundsLost,
        place: place,
        isTeamMVP: place < allyPlace,
        clutches1v2: clutches1v2.length,
        kills: kills,
        deaths: deaths,
        assists: inMatchPlayer.stats.assists,
        kd: deaths === 0
            ? kills
            : Math.round((kills / deaths) * 100) / 100,
        acs: Math.round(inMatchPlayer.stats.score / (roundsWon + roundsLost)),
        map: match.metadata.map.name,
        started_at: getStartedAt(match),
        // La API de valorant no guarda la siguiente informacion para Skirmish:
        // hsPerc: this.kills / inMatchPlayer.stats.headshots,
        // damageDelta: inMatchPlayer.stats.damage.dealt - inMatchPlayer.stats.damage.received
    }
}

function isUsefulMatch(match, lastStoredMatchId, targetAct) {
    return ( match &&
        match.metadata.is_completed && // no está en partida
        match.metadata.queue.mode_type === 'Skirmish' && // es skirmish
        match.metadata.party_rr_penaltys.length > 0 && // no es custom
        match.metadata.season.short === targetAct && // es del act correcto
        getMatchId(match) !== lastStoredMatchId // es nueva
    )
}

function getMatchId(match) {
    return match.metadata?.match_id || match.match_id
}

function getStartedAt(match) {
    return match.metadata?.started_at || match.started_at
}

function getShortId(id) {
    return id.slice(0, 4) + ".." + id.slice(-4)
}

function getRRByElo(elo){
    return elo < IMMORTAL_ELO ? elo % 100 : elo - IMMORTAL_ELO
}

function normalize(acs) {
    return Math.max(0, Math.min(1, (acs - min_acs) / (max_acs - min_acs)))
}

// transformación no lineal para balancear los performances medios
function curve(x, p = 1.5) {
    return 0.5 + Math.sign(x - 0.5) * Math.pow(Math.abs(x - 0.5) * 2, p) / 2
}

// #endregion