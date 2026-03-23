import supabase from './supabase.js'
import { getMatchId, getStartedAt, getShortId, getMatchMode } from '../helpers.js'
import { getPlayerMatchInfo, getPlayerRank } from '../match_parser.js'

export async function resetRanks() {
    const { data, error } = await supabase
        .from("players")
        .update({ elo: 0, rr: 0, rank: 0, shield: 0 })
    if (error) {
        console.log(`Error reseting player ranks in database: ${error.message}`)
    } else {
        console.log(`Player ranks reset successfully`)
    }
}

export async function updatePlayerRank(puuid, newMatches, storedPlayerMatches) {
    const allMatches = [...(storedPlayerMatches || []), ...newMatches].sort((a, b) => new Date(getStartedAt(a)) - new Date(getStartedAt(b)))
    const { elo, rr, rank, shield } = getPlayerRank(allMatches, puuid)
    const { data, error } = await supabase
        .from("players")
        .update({ elo, rr, rank, shield })
        .eq("puuid", puuid)
    if (error) {
        console.log(`Error updating player rank (${getShortId(puuid)}) in database: ${error.message}`)
    }
}

export async function savePlayerMatchesToDB(puuid, rawMatches, storedPlayerMatches) {
    const allMatches = [...(storedPlayerMatches || []), ...rawMatches].sort((a, b) => new Date(getStartedAt(a)) - new Date(getStartedAt(b)))
    const { data, error } = await supabase
        .from("player_matches")
        .insert(await Promise.all(rawMatches.map(async m => {
            const mIndex = allMatches.findIndex(match => getMatchId(match) === getMatchId(m))
            const previousMatches = allMatches.slice(0, mIndex).filter(m => getMatchMode(m) !== getMatchMode(m))
            return getPlayerMatchInfo(m, puuid, previousMatches)
        })))
    if (error) {
        console.log("Error saving Player Matches to database: " + error.message)
    } else {
        console.log(`[${getShortId(puuid)}] Saved ${rawMatches.length} Player Matches to database`)
    }
}

export async function insertNewAct(targetAct) {
    const { data, error } = await supabase
        .from("acts")
        .insert({
            id: targetAct.id,
            startTime: targetAct.startTime,
            endTime: targetAct.endTime,
            seasonId: targetAct.seasonId,
            seasonStartTime: targetAct.seasonStartTime,
            seasonEndTime: targetAct.seasonEndTime,
            title: targetAct.title,
            actName: targetAct.actName,
            seasonName: targetAct.seasonName
        })
    if (error) {
        console.log(`Error inserting new act into database: ${error.message}`)
    }
}


export async function updateLastMatchId(puuid, matchId) {
    const { data, error } = await supabase
        .from("players")
        .update({ last_match_id: matchId })
        .eq("puuid", puuid)
    if (error) {
        console.log("Error updating last match id in database: " + error.message)
    }
}

export async function updatePlayerUser(puuid, name, tag) {
    const { data, error } = await supabase
        .from("players")
        .update({ name, tag })
        .eq("puuid", puuid)
    if (error) {
        console.log("Error updating player user in database: " + error.message)
    }
}

export async function getPlayerMatches(puuid) {
    const { data, error } = await supabase
        .from("player_matches")
        .select("*")
        .eq("player_puuid", puuid)
    if (error) {
        console.log(`Error fetching player matches from database: ${error.message}`)
        return null
    }
    return data
}

export async function saveMatchesToDB(matches) {
    const { data, error } = await supabase
        .from("matches")
        .upsert(
            matches.map(m => ({
                match_id: getMatchId(m),
                raw_json: m,
                ingested_at: new Date(),
                started_at: getStartedAt(m),
                act_id: m.metadata.season.id,
                map: m.metadata.map.name,
                mode: getMatchMode(m)
            })),
            {
                onConflict: "match_id",
                ignoreDuplicates: true
            }
        )
    if (error) {
        console.log("Error saving Matches to database: " + error.message)
    } else {
        console.log(`Saved/ignored ${matches.length} Matches in database`)
    }
}

export async function getPlayers() {
    const { data: players, error } = await supabase
        .from("players")
        .select("puuid, name, tag, last_match_id")
    if (error) {
        console.log("Error fetching players from database: " + error.message)
    }
    return players
}