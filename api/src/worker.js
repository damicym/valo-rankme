import { config } from '../config.js'
import { isUsefulMatch, getMatchId, getStartedAt, getShortId, compareActsByDate } from './libs/helpers.js'
import { 
    updatePlayerRank, 
    savePlayerMatchesToDB,  
    saveMatchesToDB, 
    getPlayers,
    insertNewAct,
    updatePlayerDisplay,
    updatePlayerUpdate,
    getDBPlayerRanks
} from './libs/db/queries.js'
import { getHDEVMatches, getActByDate } from './libs/api_requests.js'
import { getDBModes } from './libs/db/queries.js'

const activePlayerPolls = new Set()

// Timezone-aware formatters using configured timezone
const _LOG_TZ = config.LOG_TIMEZONE || 'UTC'
const _timeFormatter = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: _LOG_TZ })
const _dateFormatter = new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: _LOG_TZ })
const fmtTime = d => _timeFormatter.format(d)
const fmtDate = d => _dateFormatter.format(d)

export async function pollAllPlayers() {
    if (!config.POLLING) return
    let targetAct = await getActByDate(new Date())

    const syncPlayers = async () => {
        const players = await getPlayers({ readyOnly: true })
        if (!players || players.length === 0) {
            console.log("[ERROR] No players found in database to poll")
        } else {
            const usingPlayers = players.filter(p => !activePlayerPolls.has(p.puuid))
            if (usingPlayers.length === 0) {
                console.log("[INFO] No new players to poll")
            } else {
                console.log(`[INFO] Found ${usingPlayers.length} players to poll`)
            }
            
            for (const [i, p] of usingPlayers.entries()) {
                if (activePlayerPolls.has(p.puuid)) continue

                activePlayerPolls.add(p.puuid)

                console.log(`[${getShortId(p.puuid)}] Starting polling loop for new player`)
                void pollPlayer(p, targetAct)

                if (i < usingPlayers.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, config.PLAYER_SYNC_INTERVAL / usingPlayers.length))
                }
            }
        }

            if (config.POLLING) {
            console.log(`[INFO] Next player sync at ${fmtTime(new Date(Date.now() + config.PLAYER_SYNC_INTERVAL))}`)
            setTimeout(syncPlayers, config.PLAYER_SYNC_INTERVAL)
        }
    }

    await syncPlayers()
}

async function pollPlayer(player, targetAct) {
    if (!config.POLLING) return
    let isInGame = false
    let currentLastStoredMatchId = player.last_match_id

    const poll = async () => {
        const initialMatches = await getHDEVMatches(player.puuid, 2, 0)
        const lastMatch = initialMatches[0]
        if (!initialMatches || initialMatches.length === 0) {
            console.log(`[${getShortId(player.puuid)}] No initial matches found`)
            return null
        }
        
        await updatePlayerDisplay(player.puuid)

        if (currentLastStoredMatchId !== getMatchId(lastMatch)) {
            console.log(`[${getShortId(player.puuid)}] Got last match: ${getShortId(getMatchId(lastMatch))}`)

            // Si es de un acto nuevo, camio el targetAct, lo agrego a la base de datos
            const matchAct = await getActByDate(new Date(getStartedAt(lastMatch)))
            const atcsCompare = compareActsByDate(matchAct, targetAct)
            if (atcsCompare > 0) {
                console.log(`[${getShortId(player.puuid)}] New act detected: ${matchAct.title} (${getShortId(matchAct.id)}), valid from ${matchAct.startTime.toLocaleDateString()} to ${matchAct.endTime.toLocaleDateString()}`)
                await insertNewAct(matchAct, player.puuid)
                targetAct = matchAct
            }

            // Por ahora RIOT no devuelve a HernikDevAPI partidas en curso. Por si en un futuro cambia, lo logueo para darme cuenta
            isInGame = lastMatch && !lastMatch.metadata.is_completed
            if (isInGame){
                console.log(`[IN-GAME] Player ${getShortId(player.puuid)}, match ${getShortId(getMatchId(lastMatch))}, started at ${new Date(getStartedAt(lastMatch)).toLocaleTimeString()}`)
            }
            
            // Si la última partida jugada es nueva y útil (no custom), proceso...
            if (isUsefulMatch(lastMatch, currentLastStoredMatchId)) {
                const newestStoredMatchId = await getNewMatches(player.puuid, currentLastStoredMatchId, initialMatches)
                if (newestStoredMatchId) {
                    currentLastStoredMatchId = newestStoredMatchId
                }
            } else{
                console.log(`[${getShortId(player.puuid)}] Last match (${getShortId(getMatchId(lastMatch))}) is useless (custom/ongoing). Current last stored match id: ${getShortId(currentLastStoredMatchId)}`)
            }
        } else {
            console.log(`[${getShortId(player.puuid)}] No new match. Last match id: ${getShortId(currentLastStoredMatchId)}`)
        }

        await updatePlayerUpdate(player.puuid, new Date(), new Date(Date.now() + config.POLLING_INTERVAL))
        console.log(`[${getShortId(player.puuid)}] Next poll at ${fmtTime(new Date(Date.now() + config.POLLING_INTERVAL))} ---------------------------------`)
        setTimeout(poll, config.POLLING_INTERVAL) 
    }
    
    await poll()
}

async function getNewMatches(puuid, lastStoredMatchId, initialMatches) {
    const matchesToFetch = 10
    const maxExtraFetches = 2
    let startIndex = initialMatches.length
    let areMoreMatches = false
    let matches = [...initialMatches]
    let fetchesCount = 0
    
    areMoreMatches = !matches.some(m => getMatchId(m) === lastStoredMatchId) && fetchesCount < maxExtraFetches
    while (areMoreMatches) {
        fetchesCount++
        console.log(`[${getShortId(puuid)}] Fetching matches... (#${fetchesCount}, from ${startIndex} to ${startIndex + matchesToFetch - 1})`)
        
        const apiMatches = await getHDEVMatches(puuid, matchesToFetch, startIndex)
        if (!Array.isArray(apiMatches) || apiMatches.length === 0) {
            console.log(`[${getShortId(puuid)}] !apiMatches at getNewMatches`)
            break
        }
        matches.push(...apiMatches)

        const foundLastStoredMatch = matches.find(m => getMatchId(m) === lastStoredMatchId)
        areMoreMatches = !foundLastStoredMatch && fetchesCount < maxExtraFetches
        if (areMoreMatches) {
            startIndex = matchesToFetch * fetchesCount + initialMatches.length
        }
    }

    // Siempre recortar hasta la última partida ya guardada, independientemente de si se hicieron fetches extra
    const lastStoredIndex = matches.findIndex(m => getMatchId(m) === lastStoredMatchId)
    if (lastStoredIndex !== -1) {
        matches = matches.slice(0, lastStoredIndex)
    }

    const newestStoredMatchId = await processNewMatches(puuid, matches)
    return newestStoredMatchId
}

export async function processNewMatches(puuid, matches) {
    const seenMatchesIds = new Set()
    let newMatches = []
    for (const match of matches) {
        if (!seenMatchesIds.has(getMatchId(match))) {
            seenMatchesIds.add(getMatchId(match))
            if (isUsefulMatch(match)) {
                newMatches.push(match)
            }
        }
    }
    newMatches = newMatches
        .sort((a, b) => new Date(getStartedAt(b)) - new Date(getStartedAt(a)))

    if (!newMatches || newMatches.length === 0) {
        console.log(`[${getShortId(puuid)}] No new matches to process`)
        return null
    }
    const dbModes = await getDBModes()
    const storedRanks = await getDBPlayerRanks(puuid)
    await saveMatchesToDB(newMatches, dbModes, puuid)
    await updatePlayerRank(puuid, newMatches, dbModes)
    await savePlayerMatchesToDB(puuid, newMatches, dbModes, storedRanks)
    
    return getMatchId(newMatches[0])
}