import { getHDEVMatches } from "./libs/api_requests.js"
import { getShortId, getStartedAt } from "./libs/helpers.js"
import { 
    insertNewPlayer, 
    getMatchesByPlayers, 
    savePlayerMatchesToDB, 
    updatePlayerRank, 
    updatePlayerDisplay,
    updatePlayerUpdate,
    getDBModes,
    setReadyToPoll
} from "./libs/db/queries.js"
import { processNewMatches } from "./worker.js"

const initialMatchesToFetch = 20

export async function registerPlayer(player) {
    player = player.trim().toLowerCase()
    console.log(`Registering player ${player}...`)
    // Agregar player a la DB
    const insertResponse = await insertNewPlayer(player)
    if (insertResponse.error || !insertResponse.puuid) return insertResponse
    const puuid = insertResponse.puuid
    await updatePlayerDisplay(puuid)
    // Guardar PlayerMatches en base a Matches ya gurdadas en la DB
    const storedDBMatches = await getMatchesByPlayers([puuid])
    const rawStoredDBMatches = Array.isArray(storedDBMatches)
        ? storedDBMatches.map(m => m.raw_json).sort((a, b) => getStartedAt(b) - getStartedAt(a))
        : []

    const dbModes = await getDBModes()
    if (rawStoredDBMatches && rawStoredDBMatches.length) {
        await updatePlayerRank(puuid, rawStoredDBMatches, dbModes)
        await savePlayerMatchesToDB(puuid, rawStoredDBMatches, dbModes)
    } else {
        console.log(`[${getShortId(puuid)}] No stored matches found in DB for player, skipping PlayerMatches saving step`)
    }        
    
    // Guardar en la DB Matches y PlayerMatches en base a las ultimas {initialMatchesToFetch} partidas (excluyendo repetidas)
    const lastMatches = await getHDEVMatches(puuid, initialMatchesToFetch, 0)
    if (lastMatches && lastMatches.length) {
        await processNewMatches(puuid, lastMatches)
    } else {
        console.log(`[${getShortId(puuid)}] No matches found from API for player, skipping new matches processing step`)
    }

    await updatePlayerUpdate(puuid, new Date())
    await setReadyToPoll(puuid)
    
    console.log(`[${getShortId(puuid)}] Registration result: ${puuid} | Errors?: ${insertResponse.error}`)
    return insertResponse
}