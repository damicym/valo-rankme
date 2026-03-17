import supabase from './supabase'

export async function getTwoPlayers(player1, player2) {
    const player1Data = await getPlayerData(player1)
    const player2Data = await getPlayerData(player2)

    if (!player1Data || !player2Data) {
        return
    }

    const { data, error } = await supabase
        .from("player_matches")
        .select("*")
        .or(`player_puuid.eq.${player1Data.puuid}, player_puuid.eq.${player2Data.puuid}`)
    if (error) {
        console.log("Error fetching player matches from database: " + error.message)
        return
    }

    const player1Matches = data.filter(m => m.player_puuid === player1Data.puuid)
    const player2Matches = data.filter(m => m.player_puuid === player2Data.puuid)
    return {
        player1: {
            puuid: player1Data.puuid,
            matches: player1Matches,
            rankInfo: {
                elo: player1Data.elo,
                rr: player1Data.rr,
                rank: player1Data.rank,
                shield: player1Data.shield
            }
        },
        player2: {
            puuid: player2Data.puuid,
            matches: player2Matches,
            rankInfo: {
                elo: player2Data.elo,
                rr: player2Data.rr,
                rank: player2Data.rank,
                shield: player2Data.shield
            }
        }
    }
}

export async function getOnePlayer(player) {
    const playerData = await getPlayerData(player)

    if (!playerData) {
        return
    }

    const { data, error } = await supabase
        .from("player_matches")
        .select("*")
        .eq("player_puuid", playerData.puuid)
    if (error) {
        console.log("Error fetching player matches from database: " + error.message)
        return
    }
    return {
        player1: {
            puuid: playerData.puuid,
            matches: data,
            rankInfo: {
                elo: playerData.elo,
                rr: playerData.rr,
                rank: playerData.rank,
                shield: playerData.shield
            }
        }
    }
}

async function getPlayerData(player) {
    const [name, tag] = player.split("#")
    const { data, error } = await supabase
        .from("players")
        .select("puuid, elo, rr, rank, shield")
        .eq("name", name)
        .eq("tag", tag)
    if (error) {
        console.log("Error fetching player rank from database: " + error.message)
        return
    }
    return data[0]
}