import { getHDEVMatches } from "./libs/api_requests.js"
import { getMatchId, getShortId, getStartedAt } from "./libs/helpers.js"
import { 
    insertNewPlayer, 
    getMatchesByPlayers, 
    savePlayerMatchesToDB, 
    updateLastMatchId, 
    updatePlayerRank 
} from "./libs/db/queries.js"
import { processNewMatches } from "./worker.js"

const initialMatchesToFetch = 30

export async function registerPlayer(player) {
    // Agregar player a la DB
    const insertResponse = await insertNewPlayer(player)
    if (insertResponse.error || !insertResponse.data) return insertResponse
    const puuid = insertResponse.data.puuid

    // Guardar PlayerMatches en base a Matches ya gurdadas en la DB
    const storedDBMatches = await getMatchesByPlayers([puuid])
    const rawStoredDBMatches = storedDBMatches.map(m => m.raw_json).sort((a, b) => getStartedAt(b) - getStartedAt(a))
    
    if (rawStoredDBMatches && rawStoredDBMatches.length) {
        await savePlayerMatchesToDB(puuid, rawStoredDBMatches)
        await updatePlayerRank(puuid, rawStoredDBMatches)
    } else {
        console.log(`[${getShortId(puuid)}] No stored matches found in DB for player, skipping PlayerMatches saving step`)
    }        
    
    // Guardar en la DB Matches y PlayerMatches en base a las ultimas 20 partidas (excluyendo repetidas)
    const lastMatches = await getHDEVMatches(puuid, initialMatchesToFetch, 0)
    if (lastMatches && lastMatches.length) {
        await processNewMatches(puuid, lastMatches)
    }

    return insertResponse
}