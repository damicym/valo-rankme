import { config } from '../config.js'
import { isUsefulMatch, getMatchId, getStartedAt, getShortId, compareActsByDate, getUserFromRawMatch } from './libs/helpers.js'
import { 
    updatePlayerRank, 
    savePlayerMatchesToDB, 
    updatePlayerUser, 
    saveMatchesToDB, 
    getPlayers,
    insertNewAct,
    updatePlayerDisplay,
    updatePlayerUpdate
} from './libs/db/queries.js'
import { getHDEVMatches, getActByDate } from './libs/api_requests.js'
import { getDBModes } from './libs/db/queries.js'

const POLLING_INTERVAL = 3 * 60 * 1000
const PLAYER_SYNC_INTERVAL = 3 * 60 * 1000
const activePlayerPolls = new Set()

export async function pollAllPlayers() {
    if (!config.POLLING) return
    let targetAct = await getActByDate(new Date())

    const syncPlayers = async () => {
        const players = await getPlayers({ readyOnly: true })
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
                targetAct = matchAct
            }

            // Verificar si el nombre o tag del player cambió
            const user = getUserFromRawMatch(lastMatch, player.puuid)
            if (user && (user.name !== player.name || user.tag !== player.tag)) {
                console.log(`[${getShortId(player.puuid)}] Player does not match: ${player.name}#${player.tag}. Updating user...`)
                await updatePlayerUser(player.puuid, user.name, user.tag)
            }
    
            await updatePlayerDisplay(player.puuid)

            // Por ahora RIOT no devuelve a HernikDevAPI partidas en curso. Por si en un futuro cambia, lo logueo para darme cuenta
            isInGame = lastMatch && !lastMatch.metadata.is_completed
            if (isInGame){
                console.log(`[IN-GAME] Player ${getShortId(player.puuid)}, match ${getShortId(getMatchId(lastMatch))}, started at ${new Date(getStartedAt(lastMatch)).toLocaleTimeString()}`)
            }
            
            // Si la última partida jugada es nueva y útil, proceso las nuevas partidas
            if (isUsefulMatch(lastMatch, currentLastStoredMatchId)) {
                const newestStoredMatchId = await getNewMatches(player.puuid, currentLastStoredMatchId, initialMatches)
                if (newestStoredMatchId) {
                    currentLastStoredMatchId = newestStoredMatchId
                }
            } else{
                console.log(`[${getShortId(player.puuid)}] Last match is not useful or already stored. Last match id: ${getShortId(getMatchId(lastMatch))}, current last stored match id: ${getShortId(currentLastStoredMatchId)}`)
            }
        } else {
            console.log(`[${getShortId(player.puuid)}] No new match. Last match id: ${getShortId(currentLastStoredMatchId)}`)
        }

        await updatePlayerUpdate(player.puuid, new Date(), new Date(Date.now() + POLLING_INTERVAL))
        console.log(`[${getShortId(player.puuid)}] Next poll at ${new Date(Date.now() + POLLING_INTERVAL).toLocaleTimeString()} ---------------------------------`)
        setTimeout(poll, POLLING_INTERVAL) 
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
            console.log(`[${getShortId(puuid)}] !apiMatches at processNewMatches`)
            break
        }
        matches.push(...apiMatches)

        const foundLastStoredMatch = matches.find(m => getMatchId(m) === lastStoredMatchId)
        areMoreMatches = !foundLastStoredMatch && fetchesCount < maxExtraFetches
        if (!areMoreMatches) {
            if (foundLastStoredMatch) {
                matches = matches.slice(0, matches.findIndex(m => getMatchId(m) === lastStoredMatchId))
            }
        } else {
            startIndex = matchesToFetch * fetchesCount + initialMatches.length
        }
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
    await saveMatchesToDB(newMatches, dbModes)
    await updatePlayerRank(puuid, newMatches, dbModes)
    await savePlayerMatchesToDB(puuid, newMatches, dbModes)
    
    return getMatchId(newMatches[0])
}