import { config } from '../config.js'
import { isUsefulMatch, getMatchId, getStartedAt, getShortId, compareActsByDate } from './libs/helpers.js'
import { 
    updatePlayerRank, 
    savePlayerMatchesToDB, 
    updateLastMatchId, 
    updatePlayerUser, 
    getPlayerMatches, 
    saveMatchesToDB, 
    getPlayers,
    resetRanks,
    insertNewAct
} from './libs/db/queries.js'
import { getUserFromRawMatch } from './libs/match_parser.js'
import { getHDEVMatches, getActByDate } from './libs/api_requests.js'

const POLLING_INTERVAL = 3 * 60 * 1000
const PLAYER_SYNC_INTERVAL = 3 * 60 * 1000
const activePlayerPolls = new Set()

export async function pollAllPlayers() {
    if (!config.POLLING) return
    let targetAct = await getActByDate(new Date())

    const syncPlayers = async () => {
        const players = await getPlayers()
        if (!players || players.length === 0) {
            console.log("[INFO] No players found in database to poll.")
        } else {
            for (const player of players) {
                if (activePlayerPolls.has(player.puuid)) continue

                activePlayerPolls.add(player.puuid)
                console.log(`[${getShortId(player.puuid)}] Starting polling loop for new player`)
                void pollPlayer(player, targetAct)
            }
        }

        if (config.POLLING) {
            setTimeout(syncPlayers, PLAYER_SYNC_INTERVAL)
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

        if (currentLastStoredMatchId !== getMatchId(lastMatch)) {
            console.log(`[${getShortId(player.puuid)}] Got last match: ${getShortId(getMatchId(lastMatch))}`)

            // Si es de un acto nuevo, camio el targetAct, lo agrego a la base de datos
            const matchAct = await getActByDate(new Date(getStartedAt(lastMatch)))
            const atcsCompare = compareActsByDate(matchAct, targetAct)
            if (atcsCompare > 0) {
                console.log(`[${getShortId(player.puuid)}] New act detected: ${matchAct.title} (${getShortId(matchAct.id)}), valid from ${matchAct.startTime.toLocaleDateString()} to ${matchAct.endTime.toLocaleDateString()}`)
                await insertNewAct(matchAct)
                // si cambió la season, reseteo el rank de todos los jugadores
                if (matchAct.seasonId !== targetAct.seasonId) {
                    await resetRanks()
                }
                targetAct = matchAct
                
            }

            // Verificar si el nombre o tag del player cambió
            const user = getUserFromRawMatch(lastMatch, player.puuid)
            if (user && (user.name !== player.name || user.tag !== player.tag)) {
                console.log(`[${getShortId(player.puuid)}] Player does not match: ${player.name}#${player.tag}. Updating user...`)
                await updatePlayerUser(player.puuid, user.name, user.tag)
            }
    
            // Por ahora RIOT no devuelve a HernikDevAPI partidas en curso. Por si en un futuro cambia, lo logueo para darme cuenta
            isInGame = lastMatch && !lastMatch.metadata.is_completed
            if (isInGame){
                console.log(`[IN-GAME] Player ${getShortId(player.puuid)}, match ${getShortId(getMatchId(lastMatch))}, started at ${new Date(getStartedAt(lastMatch)).toLocaleTimeString()}`)
            }
            
            // Si la última partida jugada es nueva y útil, proceso las nuevas partidas
            if (isUsefulMatch(lastMatch, currentLastStoredMatchId, targetAct)) {
                const newestStoredMatchId = await processNewMatches(player.puuid, currentLastStoredMatchId, initialMatches, targetAct)
                if (newestStoredMatchId) {
                    currentLastStoredMatchId = newestStoredMatchId
                }
            }
        } else {
            console.log(`[${getShortId(player.puuid)}] No new match. Last match id: ${getShortId(currentLastStoredMatchId)}`)
        }

        console.log(`[${getShortId(player.puuid)}] Next poll at ${new Date(Date.now() + POLLING_INTERVAL).toLocaleTimeString()} ---------------------------------`)
        setTimeout(poll, POLLING_INTERVAL) 
    }
    
    await poll()
}

async function processNewMatches(puuid, lastStoredMatchId, initialMatches, targetAct) {
    const matchesToFetch = 10
    const maxExtraFetches = 3
    let startIndex = initialMatches.length
    let areMoreMatches = false
    let matches = [...initialMatches]
    let fetchesCount = 0
    
    while (lastStoredMatchId && areMoreMatches) {
        fetchesCount++
        console.log(`[${getShortId(puuid)}] Fetching matches... (#${fetchesCount}, from ${startIndex} to ${startIndex + matchesToFetch - 1})`)
        
        const apiMatches = await getHDEVMatches(puuid, matchesToFetch, startIndex)
        if (!Array.isArray(apiMatches) || apiMatches.length === 0) {
            console.log(`[${getShortId(puuid)}] !apiMatches at processNewMatches`)
            break
        }
        matches.push(...apiMatches)

        areMoreMatches = !matches.some(m => getMatchId(m) === lastStoredMatchId || m.metadata.season.id !== targetAct.id) && fetchesCount < maxExtraFetches
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