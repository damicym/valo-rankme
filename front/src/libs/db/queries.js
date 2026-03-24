import { getPlayerRank } from '../helpers/player_helpers'
import supabase from './supabase'
import registerPlayer from '../api/index.js'

export async function getTwoPlayers(player1, player2) {
    const player1Data = await getPlayerData(player1, false)
    const player2Data = await getPlayerData(player2, false)

    if (!player1Data) {
        await registerPlayer(player1)
    }
    if (!player2Data) {
        await registerPlayer(player2)
    }

    const { data, error } = await supabase
        .from("player_matches")
        .select("*")
        .eq("player_puuid", player1Data.puuid)
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
            rankInfo: getPlayerRank(player1Matches)
        },
        player2: {
            puuid: player2Data.puuid,
            matches: player2Matches,
            rankInfo: getPlayerRank(player2Matches)
        }
    }
}

export async function getOnePlayer(player) {
    const playerData = await getPlayerData(player)

    if (!playerData) {
        await registerPlayer(player)
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

async function getPlayerData(player, includeRank = true) {
    const [name, tag] = player.split("#")

    const { data, error } = await supabase
        .from("players")
        .select(`puuid${includeRank ? ", elo, rr, rank, shield" : ""}`)
        .eq("name", name)
        .eq("tag", tag)
    if (error) {
        console.log("Error fetching player rank from database: " + error.message)
        return
    }

    return data[0]
}