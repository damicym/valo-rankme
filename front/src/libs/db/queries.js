import { applyRankToMatches, getPlayerRank } from '../helpers/player_helpers'
import supabase from './supabase'
import { registerPlayer } from '../api/index.js'

export async function getTwoPlayers(player1, player2, modeId = null, actId = null, seasonId = null) {
    if (!modeId){
        console.log("Mode ID is required to fetch two players matches and ranks")
        return null
    }

    if (player1 === player2) {
        console.log("Both players are the same, fetching only one player's data")
        const playerData = await getOnePlayer(player1, modeId, actId, seasonId)
        return {
            player1: playerData.player1,
            player2: null
        }
    }

    let p1Puuid = await getDBPlayerPuuid(player1)
    let p2Puuid = await getDBPlayerPuuid(player2)

    if (!p1Puuid) {
        p1Puuid = await registerPlayer(player1)
    }
    if (!p2Puuid) {
        p2Puuid = await registerPlayer(player2)
    }
    
    if (!p1Puuid || !p2Puuid) {
        console.log("Didn't get puuid for one or both players after registration attempt")
        return null
    }

    // Consigo todas las player_matches del p2
    const p2DBMatches = (await getDBPlayerMatches(p2Puuid, modeId, actId, seasonId)) || []

    // Si no hay ninguna returneo
    if (p2DBMatches.length === 0) {
        return {
            player1: {
                puuid: p1Puuid,
                matches: [],
                rankInfo: getPlayerRank([]) // unranked en vez de eso
            },
            player2: {
                puuid: p2Puuid,
                matches: [],
                rankInfo: getPlayerRank([]) // unranked en vez de eso
            }
        }
    }

    // Diccionario de match_id a team_id para el player2, y lista de match_ids del player2
    const p2TeamByMatch = {}
    const p2MatchIds = []
    for (const m of p2DBMatches) {
        p2TeamByMatch[m.match_id] = m.team_id
        p2MatchIds.push(m.match_id)
    }

    // Fetcheo player_matches del p1 que tengan match_id en la lista del p2
    const p1DBMatches = (await getDBPlayerMatches(p1Puuid, modeId, actId, seasonId)) || []

    // p1: Filtro por partidas que tengan el mismo team_id
    const player1Matches = p1DBMatches.filter(m => p2TeamByMatch[m.match_id] === m.team_id)

    // p2: Filtro por partidas que tengan el mismo team_id y que estén en la lista de matches del p1
    const matchedMatchIds = new Set(player1Matches.map(m => m.match_id))
    const player2Matches = p2DBMatches.filter(m => matchedMatchIds.has(m.match_id) && p2TeamByMatch[m.match_id] === m.team_id)

    const player1RRChanges = player1Matches.map(m => m.rr_change)
    const player2RRChanges = player2Matches.map(m => m.rr_change)
    return {
        player1: {
            puuid: p1Puuid,
            matches: applyRankToMatches(player1Matches),
            rankInfo: getPlayerRank(player1RRChanges)
        },
        player2: {
            puuid: p2Puuid,
            matches: applyRankToMatches(player2Matches),
            rankInfo: getPlayerRank(player2RRChanges)
        }
    }
}

export async function getOnePlayer(player, modeId = null, actId = null, seasonId = null) {
    let puuid = await getDBPlayerPuuid(player)

    if (!puuid) {
        puuid = await registerPlayer(player)
    }

    const matches = await getDBPlayerMatches(puuid, modeId, actId, seasonId)
    if (!seasonId) {
        seasonId = actId ? await getSeasonIdByActId(actId) : null
    }
    const ranksInfo = await getDBPlayerRanks(puuid, modeId, seasonId)

    return {
        player1: {
            puuid: puuid,
            matches: matches,
            ranksInfo: ranksInfo
        }
    }
}

async function getDBPlayerPuuid(player) {
    const [name, tag] = player.split("#")

    const { data, error } = await supabase
        .from("players")
        .select(`puuid`)
        .eq("name", name)
        .eq("tag", tag)
    if (error) {
        console.log("Error fetching player rank from database: " + error.message)
        return
    }

    return data[0]?.puuid || null
}

async function getDBPlayerMatches(puuid, modeId = null, actId = null, seasonId = null) {
    let query = supabase
        .from("player_matches")
        .select("*")
        .eq("player_puuid", puuid)
        .eq("is_rankable", true)
        .order("started_at", { ascending: false })

    if (modeId !== null) {
        query = query.eq("mode_id", modeId)
    }
    if (actId !== null) {
        query = query.eq("act_id", actId)
    } else if (seasonId !== null) {
        query = query.eq("season_id", seasonId)
    }

    const { data, error } = await query
    if (error) {
        console.log("Error fetching player matches from database: " + error.message)
        return
    }
    return data || []
}

async function getDBPlayerRanks(puuid, modeId = null, seasonId = null) {
    let query = supabase
        .from("player_mode_ranks")
        .select("*")
        .eq("player_puuid", puuid)

    if (modeId !== null) {
        query = query.eq("mode_id", modeId)
    }
    if (seasonId !== null) {
        query = query.eq("season_id", seasonId)
    }

    const { data, error } = await query
    if (error) {
        console.log("Error fetching player rank from database: " + error.message)
        return
    }
    return data || null
}

export async function getSeasonIdByActId(actId) {
    if (!actId) return null

    const { data, error } = await supabase
        .from("acts")
        .select("season_id")
        .eq("id", actId)
        .limit(1)
    if (error) {
        console.log(`Error fetching match season from database: ${error.message}`)
        return null
    }
    return data?.[0]?.season_id || null
}


export async function getDBModes(rankableOnly = false) {
    let query = supabase
        .from("modes")
        .select("*")

    if (rankableOnly) {
        query = query.eq("is_rankable", true)
    }

    const { data, error } = await query
    if (error) {
        console.log("Error fetching modes from database: " + error.message)
        return []
    }
    return data || []
}

export async function getDBSeasons() {
    const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .order("start_time", { ascending: false })
    if (error) {
        console.log("Error fetching seasons from database: " + error.message)
        return []
    }
    return data || []
}