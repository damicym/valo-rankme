import { config } from '../config.js'

const IMMORTAL_ELO = 2100

const min_rr = 7
const max_rr = 33
const min_acs = 80.0
const max_acs = 260.0

export async function twoPlayers(player1, player2) {
    const [player1Name, player1Tag] = player1.split('#')
    const lastMatch = await getLastMatch(player1Name, player1Tag, 'latam', 'pc')
    const player1_puuid = lastMatch.players.find(p => p.name === player1Name && p.tag === player1Tag).puuid

    const { matches, player2_puuid } = await getMatches(player1_puuid, player2)
    if (!matches || matches.length === 0) return

    const player1Data = {
        rankInfo: getPlayerRank(matches, player1_puuid),
        matches: getMatchHistory(matches, player1_puuid)
    }
    const player2Data = {
        rankInfo: getPlayerRank(matches, player2_puuid),
        matches: getMatchHistory(matches, player2_puuid)
    }
    return { player1: player1Data, player2: player2Data }   
}

export async function onePlayer(player1) {
    const [player1Name, player1Tag] = player1.split('#')
    const lastMatch = await getLastMatch(player1Name, player1Tag, 'latam', 'pc')
    const player1_puuid = lastMatch.players.find(p => p.name === player1Name && p.tag === player1Tag).puuid

    const matches = await getMatches(player1_puuid)
    if (!matches || matches.length === 0) return

    const player1Data = {
        // user: player1,
        rankInfo: getPlayerRank(matches, player1_puuid),
        matches: getMatchHistory(matches, player1_puuid)
    }
    // console.log("almost returning at onePlayer()")
    return { player1: player1Data }
}

export async function getPlayer_puuid(player) {
    const [name, tag] = player.split('#')
    try{
        const url = `https://api.henrikdev.xyz/valorant/v2/account/${name}/${tag}`
        // console.log(`fetch: account/${name}/${tag}`)
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                // 'Authorization': config.HENRIKDEV_ACCESS_TOKEN
                'Authorization': 'HDEV-1c26e37d-9512-40ef-a85e-003d2b7bf6af'
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

        const playerData = data.data
        if (!playerData) return null
        return playerData.puuid

    } catch(err){
        console.log(err)
        return null
    }
}

/**
 * Esta función tambien se usa para eliminar el cache interno de HenrikDevAPIv4.6.0 que usa en partidas custom
 */
async function getLastMatch(name, tag, region, platform){
    let lastMatch
    try{
        const url = `https://api.henrikdev.xyz/valorant/v4/matches/${region}/${platform}/${name}/${tag}?size=1`
        // console.log(`fetch clear-cache: matches/${region}/${platform}/${name}/${tag}?size=1`)
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                // 'Authorization': config.HENRIKDEV_ACCESS_TOKEN
                'Authorization': 'HDEV-1c26e37d-9512-40ef-a85e-003d2b7bf6af'
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

        lastMatch = data.data[0]
    } catch(err){
        console.log('Error at clearMatchlistCache():' + err)
    }
    return lastMatch
}

/**
 * Se obtienen las partidas del player1 del último acto
 * Si se pasa un player2, solo devuelve las partidas donde ambos jugadores jugaron en el mismo team
 */
async function getMatches(player1_puuid, player2) {
    const matches = await getPublicSkirmishMatches(player1_puuid, 'latam', 'pc')
    // console.log("almost returning at getMatches() / NOT player2_puuid")
    if (!player2) return matches
    
    const [player2Name, player2Tag] = player2.split('#')
    let inMatchPlayer2
    for (const match of matches) {
        inMatchPlayer2 = match.players.find(
            p => p.name === player2Name && p.tag === player2Tag
        )
        if (inMatchPlayer2) break
    }

    const player2_puuid = inMatchPlayer2?.puuid
    if (!player2_puuid) return
    
    const duoMatches = matches.filter(m => {
        const targetTeamColor = m.players.find(p => p.puuid === player1_puuid).team_id
        return m.players.some(p => p.puuid === player2_puuid && p.team_id === targetTeamColor)
    })
    // console.log("almost returning at getMatches() / player2_puuid")
    return { matches: duoMatches, player2_puuid }
}

function getPlayerRank(matches, puuid) {
    let current_rr = 50
    let shieldLevel = 0
    const matches_rr = [...matches].reverse().map(match => getMatchRR(match, puuid))

    matches_rr.forEach(match_rr => {
        // al bajar de 0, el rr se queda en 0
        const new_raw_rr = current_rr + match_rr
        const rank = Math.floor(current_rr / 100)
        const nextRank = Math.floor(new_raw_rr / 100)
        const won = match_rr > 0

        if (new_raw_rr < 0) {
            current_rr = 0
        }
        // al pasar un múltiplo de 100 por menos de 10 rr antes de immortal, se le suma lo necesario para pasarlo por 10 rr
        else if (!(current_rr >= IMMORTAL_ELO) && won && rank < nextRank) {
            current_rr = Math.max(new_raw_rr, nextRank * 100 + 10)
            // si sube al primer rengo de la división, se le da 2 escudos. Pero si está en hierro 1 no
            if (current_rr % 300 < 100 && current_rr > 100) shieldLevel = 2
        }
        // al pasar un múltiplo de 100 por menos de 10 rr, se le suma lo necesario para pasarlo por 10 rr
        // no se aplica en immortal (100 rr, 200 rr, etc.)
        else if (current_rr < IMMORTAL_ELO + 100 && !won && rank > nextRank && (current_rr > rank * 100 || shieldLevel > 0)) {
            current_rr = rank * 100
            // sacarle escudo en vez de bajar
            if (shieldLevel > 0) shieldLevel -= 1
        } 
        else {
            current_rr = new_raw_rr
        }
    })
    // console.log("almost returning at getPlayerRank()")
    return { rr: current_rr, rank: Math.floor(current_rr / 100), shield: shieldLevel}
}

function getMatchHistory(matches, puuid) {
    const chronological = [...matches].reverse()
    const chronologicalMatches = chronological.map((m, index) => {
        const previousMatches = chronological.slice(0, index)
        return getMatchInfo(m, puuid, previousMatches)
    })
    // console.log("almost returning at getMatchHistory()")
    return [...chronologicalMatches].reverse()
}

// #region ==================== AUXILIARES ====================

function normalize(acs) {
    return Math.max(0, Math.min(1, (acs - min_acs) / (max_acs - min_acs)))
}

// transformación no lineal para balancear los performances medios
function curve(x, p = 1.5) {
    return 0.5 + Math.sign(x - 0.5) * Math.pow(Math.abs(x - 0.5) * 2, p) / 2
}

function getMatchRR(match, puuid){
    const inMatchPlayer = match.players.find(p => p.puuid === puuid)
    if (!inMatchPlayer) {
        console.log("!inMatchPlayer at getMatchRR")
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

    // console.log("almost returning at getMatchRR()")
    return Math.round(result)
}

function getMatchInfo(match, puuid, previousMatches){
    const inMatchPlayer = match.players.find(p => p.puuid === puuid)
    if (!inMatchPlayer) {
        console.log("!inMatchPlayer at getMatchInfo")
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

    // console.log("almost returning at getMatchInfo()")
    return {
        rr: getMatchRR(match, puuid),
        rank: getPlayerRank(previousMatches, puuid).rank,
        
        map: match.metadata.map.name,
        date: match.metadata.started_at,
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
        // La API de valorant no guarda la siguiente informacion para Skirmish:
        // hsPerc: this.kills / inMatchPlayer.stats.headshots,
        // damageDelta: inMatchPlayer.stats.damage.dealt - inMatchPlayer.stats.damage.received
    }
}

/**
 * 1. fetchear por partidas custom
 * 2. seguir fetcheando hasta que no haya más en el acto
 * 3. agregar a la lista solo si es del acto correcto y no es custom
 * 4. si te quedas sin tokens, parar y logear
 * 
 * esto funciona porque en la v4.6.0 de HenrikDev API el modo Skirmish: 2v2 no se detecta, pero
 * se puede conseguir fetcheando por custom --- y filtrando por mode_type === Skirmish && party_rr_penaltys.length > 0 (para q no sea custom)
 * 
 * la v4.6.0 de HenrikDev API usa un cache interno para custom que hace que tarden en cargarse las últimas partidas 
 */
async function getPublicSkirmishMatches(puuid, region, platform){
    const MAX_MATCHES_PER_CALL = 10 // el máximo permitido por la API actualmente
    let allMatches = []
    let willNextSetBeValid = true // set of matches
    let targetAct = ''
    let fetchIndex = 0
    const seenMatchesIds = new Set()

    while (willNextSetBeValid) {
        try{
            /* const baseUrl = `https://api.henrikdev.xyz/valorant/v4/by-puuid/matches/${region}/${platform}/${puuid}`
            const params = new URLSearchParams({
                size: MAX_MATCHES_PER_CALL,
                start: MAX_MATCHES_PER_CALL * fetchIndex
            })
            const maps = ['Skirmish A']
            maps.forEach(m => params.append('map[]', m))
            const urlByMaps = `${baseUrl}?${params}` */

            const url = `https://api.henrikdev.xyz/valorant/v4/by-puuid/matches/${region}/${platform}/${puuid}?mode=custom&size=${MAX_MATCHES_PER_CALL}&start=${10 * fetchIndex}&_=${Date.now()}`
            // console.log(`fetch ${fetchIndex}: by-puuid/matches/${region}/${platform}/${puuid}?mode=custom&size=${MAX_MATCHES_PER_CALL}&start=${10 * fetchIndex}&_=${Date.now()}`)
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    // 'Authorization': config.HENRIKDEV_ACCESS_TOKEN
                    'Authorization': 'HDEV-1c26e37d-9512-40ef-a85e-003d2b7bf6af'
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

            const matches = data.data

            if (matches.length === 0) break
            if (fetchIndex === 0) targetAct = matches[0].metadata.season.short
            fetchIndex++

            if (matches.some(m => m.metadata.season.short !== targetAct)) willNextSetBeValid = false
            
            const usefulMatches = matches.filter(m => (
                m.metadata.party_rr_penaltys.length > 0 && // no es custom
                m.metadata.queue.mode_type == 'Skirmish' && // es skirmish
                m.metadata.season.short == targetAct && // es del acto correcto
                m.metadata.is_completed // la partida ya terminó
            ))

            // evitar pushear partidas que ya fueron pusheadas (pq talvez se agrega una partida a la Henrik API mientras estoy paginando)
            for (const match of usefulMatches) {
                if (!seenMatchesIds.has(match.metadata.match_id)) {
                    seenMatchesIds.add(match.metadata.match_id)
                    allMatches.push(match)
                }
            }

            if (matches.length < MAX_MATCHES_PER_CALL) {
                willNextSetBeValid = false
            }

        } catch(err){
            console.log(err)
            break
        }
        // willNextSetBeValid = false
    }
    return allMatches
}

// #endregion