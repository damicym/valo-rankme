import { getHDEVMatches } from "./libs/api_requests.js"
import { getMatchId, getShortId, getStartedAt } from "./libs/helpers.js"
import { 
    insertNewPlayer, 
    getMatchesByPlayers, 
    savePlayerMatchesToDB, 
    updateLastMatchId, 
    getPlayerMatches, 
    saveMatchesToDB, 
    updatePlayerRank 
} from "./libs/db/queries.js"
import { processNewMatches } from "./worker.js"

const initialMatchesToFetch = 1

export async function registerPlayer(player) {
    // Agregar player a la DB
    const insertedPlayer = await insertNewPlayer(player)

    // Guardar PlayerMatches en base a Matches ya gurdadas en la DB
    const storedDBMatches = await getMatchesByPlayers([insertedPlayer.puuid])
    const rawStoredDBMatches = storedDBMatches.map(m => m.raw_json).sort((a, b) => getStartedAt(b) - getStartedAt(a))
    // UPDATE PLAYER RANK ACA?
    if (rawStoredDBMatches && rawStoredDBMatches.length) {
        await savePlayerMatchesToDB(insertedPlayer.puuid, rawStoredDBMatches)
        await updateLastMatchId(insertedPlayer.puuid, getMatchId(rawStoredDBMatches[0]))
    } else {
        console.log(`[${getShortId(insertedPlayer.puuid)}] No stored matches found in DB for player, skipping PlayerMatches saving step`)
    }        
    
    // Guardar en la DB Matches y PlayerMatches en base a las ultimas 20 partidas (excluyendo repetidas)
    const lastMatches = await getHDEVMatches(insertedPlayer.puuid, initialMatchesToFetch, 0)
    await processNewMatches(insertedPlayer.puuid, lastMatches)
    
    return insertedPlayer
}