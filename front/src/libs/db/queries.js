import { getPlayerRank } from '../helpers/player_helpers'
import supabase from './supabase'
import { registerPlayer } from '../api/index.js'

export async function getTwoPlayers(player1, player2, modeIdFilter = null) {
    let player1Data = await getPlayerData(player1, false)
    let player2Data = await getPlayerData(player2, false)

    if (!player1Data) {
        player1Data = await registerPlayer(player1)
    }
    if (!player2Data) {
        player2Data = await registerPlayer(player2)
    }

    // Consigo todas las player_matches del p2
    const { data: data_p2, error: errorP2 } = await supabase
        .from("player_matches")
        .select("*")
        .eq("player_puuid", player2Data.puuid)
    if (errorP2) {
        console.log("Error fetching player2 matches from database: " + errorP2.message)
        return
    }

    const player2MatchesAll = data_p2 || []

    // Si no hay ninguna returneo
    if (player2MatchesAll.length === 0) {
        return {
            player1: {
                puuid: player1Data.puuid,
                matches: [],
                rankInfo: getPlayerRank([])
            },
            player2: {
                puuid: player2Data.puuid,
                matches: [],
                rankInfo: getPlayerRank([])
            }
        }
    }

    // Diccionario de match_id a team_id para el player2, y lista de match_ids del player2
    const p2TeamByMatch = {}
    const p2MatchIds = []
    for (const m of player2MatchesAll) {
        p2TeamByMatch[m.match_id] = m.team_id
        p2MatchIds.push(m.match_id)
    }

    // Fetcheo player_matches del p1 que tengan match_id en la lista del p2
    const { data: data_p1, error: errorP1 } = await supabase
        .from("player_matches")
        .select("*")
        .eq("player_puuid", player1Data.puuid)
        .in("match_id", p2MatchIds)
    if (errorP1) {
        console.log("Error fetching player1 matches from database: " + errorP1.message)
        return
    }

    const player1MatchesAll = data_p1 || []

    // p1: Filtro por partidas que tengan el mismo team_id
    const player1Matches = player1MatchesAll.filter(m => p2TeamByMatch[m.match_id] === m.team_id)

    // p2: Filtro por partidas que tengan el mismo team_id y que estén en la lista de matches del p1
    const matchedMatchIds = new Set(player1Matches.map(m => m.match_id))
    const player2Matches = player2MatchesAll.filter(m => matchedMatchIds.has(m.match_id) && p2TeamByMatch[m.match_id] === m.team_id)

    return {
        player1: {
            puuid: player1Data.puuid,
            matches: player1Matches,
            rankInfo: getPlayerRank(player1Matches, modeIdFilter)
        },
        player2: {
            puuid: player2Data.puuid,
            matches: player2Matches,
            rankInfo: getPlayerRank(player2Matches, modeIdFilter)
        }
    }
}

export async function getOnePlayer(player, /* modeIdFilter = null */) {
    let playerData = await getPlayerData(player)

    if (!playerData) {
        playerData = await registerPlayer(player)
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