import { insertNewPlayer, getMatchesByPlayers, savePlayerMatchesToDB, updateLastMatchId } from "./libs/db/queries.js"
import { getHDEVMatches } from "./libs/api_requests.js"

// que devuelvan en medio un mensaje de si estan registrando o no

export async function registerPlayer(player) {
    const insertedPlayer = await insertNewPlayer(player)
    console.log("registeredPlayer: ", insertedPlayer)
    const lastMatches = await getHDEVMatches(insertedPlayer.puuid, 20, 0)
    const storedMatches = await getMatchesByPlayers([insertedPlayer.puuid])
    await savePlayerMatchesToDB(insertedPlayer.puuid, lastMatches, storedMatches)
    await updateLastMatchId(insertedPlayer.puuid, getMatchId(lastMatches[0]))
    
    //rank
    
    // return insertedPlayer
}