import supabase from './supabase.js'
import { getMatchId, getStartedAt, getShortId, getMatchMode, getMatchModeId, getUniqueMatchesById, getMatchSeasonId } from '../helpers.js'
import { getPlayerMatchInfo, getMatchRR, getPlayerModeRank } from '../match_parser.js'
import { getHDEVPlayerPuuid } from '../api_requests.js'

export async function updatePlayerRank(puuid, newMatches) {
    if (!newMatches || !newMatches.length) {
        console.log("No new matches to update player rank at updatePlayerRank")
        return
    }

    // consigo los rangos para el jugador gurdados en la db
    const { data: ranks, error: ranksFetchError } = await supabase
        .from("player_mode_ranks")
        .select("*")
        .eq("player_puuid", puuid)
    if (ranksFetchError) {
        console.log(`Error fetching player rank (${getShortId(puuid)}) from database: ${ranksFetchError.message}`)
        return
    }
    
    // guardo cada partida en su respectivo array de season
    const matchesBySeason = {}
    const uniqueMatches = getUniqueMatchesById([...newMatches])
        .sort((a, b) => new Date(getStartedAt(a)) - new Date(getStartedAt(b)))
    const matchesWithSeason = await Promise.all(
        uniqueMatches.map(async m => ({
            match: m,
            seasonId: await getMatchSeasonId(m)
        }))
    )
    matchesWithSeason.forEach(({ match, seasonId }) => {
        if (!seasonId) return
        if (!matchesBySeason[seasonId]) {
            matchesBySeason[seasonId] = []
        }
        matchesBySeason[seasonId].push(match)
    })
    if (!matchesBySeason || Object.keys(matchesBySeason).length === 0) {
        console.log(`[${getShortId(puuid)}] No matches with season info to update player rank at updatePlayerRank`)
        return
    }

    // recorro cada season con sus matches
    for (const [seasonId, matches] of Object.entries(matchesBySeason)) {
        // guardo de cada partida su rr_change, en el array de su respectivo modo
        const rrChangesByMode = {}
        matches.forEach(m => {
            const modeId = getMatchModeId(m)?.trim()
            if (modeId) {
                if (!rrChangesByMode[modeId]) {
                    rrChangesByMode[modeId] = []
                }
                const rrChange = getMatchRR(m, puuid)
                if (rrChange !== null && rrChange !== undefined) rrChangesByMode[modeId].push(rrChange)
            }
        })

        // por cada modo (e indirectamente por season), consigo el nuevo rango
        for (const [modeId, rrChanges] of Object.entries(rrChangesByMode)) {
            const dbRank = ranks.find(r => r.mode_id === modeId && r.season_id === seasonId) || null
            const newModeRank = getPlayerModeRank(dbRank, rrChanges)
            // si ya estaba el rango en la db, lo updateo
            if (dbRank) {
                const { data, error } = await supabase
                    .from("player_mode_ranks")
                    .update(newModeRank)
                    .eq("player_puuid", puuid)
                    .eq("mode_id", modeId)
                    .eq("season_id", seasonId)
                if (error) {
                    console.log(`Error updating player mode rank (${getShortId(puuid)}) in database: ${error.message}`)
                } else {
                    console.log(`[${getShortId(puuid)}] Updated player mode rank for mode ${modeId} and season ${seasonId} in database`)
                }
            } else { // sino lo inserto
                const { data, error } = await supabase
                    .from("player_mode_ranks")
                    .insert({ player_puuid: puuid, mode_id: modeId, season_id: seasonId, ...newModeRank })
                if (error) {
                    console.log(`Error saving player mode rank (${getShortId(puuid)}) in database: ${error.message}`)
                } else {
                    console.log(`[${getShortId(puuid)}] Saved player mode rank for mode ${modeId} and season ${seasonId} in database`)
                }
            }
        }
    }
}

export async function savePlayerMatchesToDB(puuid, rawMatches, storedPlayerMatches) {
    const allMatches = getUniqueMatchesById([...(storedPlayerMatches || []), ...rawMatches])
        .sort((a, b) => new Date(getStartedAt(a)) - new Date(getStartedAt(b)))
    
    if (!allMatches || !allMatches.length) {
        console.log("No matches to save at savePlayerMatchesToDB")
        return
    }

    const rows = rawMatches.map(m => {
        const mIndex = allMatches.findIndex(match => getMatchId(match) === getMatchId(m))
        const previousMatches = allMatches.slice(0, mIndex).filter(pm => getMatchMode(pm) !== getMatchMode(m))
        return getPlayerMatchInfo(m, puuid, previousMatches)
    })
    
    const { data, error } = await supabase
        .from("player_matches")
        .upsert(
            rows,
            {
                onConflict: "match_id",
                ignoreDuplicates: true
            }
        )
    if (error) {
        console.log("Error saving Player Matches to database: " + error.message)
    } else {
        console.log(`[${getShortId(puuid)}] Saved ${rawMatches.length} Player Matches to database`)
    }
    
    await updateLastMatchId(puuid, getMatchId(rawMatches[0]))
}

export async function insertNewAct(targetAct) {
    const season = await getSeasonById(targetAct.seasonId)
    if (!season) await insertNewSeason(targetAct.seasonStartTime, targetAct.seasonEndTime, targetAct.seasonName, targetAct.seasonId)
    
    const { data, error } = await supabase
        .from("acts")
        .insert({
            id: targetAct.id,
            start_time: targetAct.startTime,
            end_time: targetAct.endTime,
            season_id: targetAct.seasonId,
            title: targetAct.title,
            act_name: targetAct.actName,
        })
    if (error) {
        console.log(`Error inserting new act into database: ${error.message}`)
    }
}

export async function insertNewSeason(startTime, endTime, name, id) {
    const { data, error } = await supabase
        .from("seasons")
        .insert({
            id,
            start_time: startTime,
            end_time: endTime,
            name
        })
    if (error) {
        console.log(`Error inserting new season into database: ${error.message}`)
    }
}

export async function getSeasonById(seasonId) {
    const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .eq("id", seasonId)
    if (error) {
        console.log(`Error fetching season from database: ${error.message}`)
        return null
    }
    return data[0]
}

export async function updateLastMatchId(puuid, matchId) {
    const { data, error } = await supabase
        .from("players")
        .update({ last_match_id: matchId })
        .eq("puuid", puuid)
    if (error) {
        console.log("Error updating last match id in database: " + error.message)
    } else {
        console.log(`[${getShortId(puuid)}] Updated last match id to ${getShortId(matchId)} in database`)
    }
}

export async function updatePlayerUser(puuid, name, tag) {
    const { data, error } = await supabase
        .from("players")
        .update({ name, tag })
        .eq("puuid", puuid)
    if (error) {
        console.log("Error updating player user in database: " + error.message)
    } else {
        console.log(`[${getShortId(puuid)}] Updated player user in database`)
    }

}

export async function getPlayerMatches(puuid) {
    const { data, error } = await supabase
        .from("player_matches")
        .select("*")
        .eq("player_puuid", puuid)
        .order("started_at", { ascending: false })
    if (error) {
        console.log(`Error fetching player matches from database: ${error.message}`)
        return null
    }
    return data
}

export async function saveMatchesToDB(matches) {
    const payload = matches
        .map(m => ({
            match_id: getMatchId(m),
            raw_json: m,
            ingested_at: new Date(),
            started_at: getStartedAt(m),
            act_id: m?.metadata?.season?.id || m?.act_id || null,
            map: m?.metadata?.map?.name || m?.map || null,
            mode: getMatchMode(m),
            mode_id: getMatchModeId(m),
            players: m?.players?.map(p => p.puuid) || []
        }))
        .filter(m => m.match_id && m.mode)
        .sort((a, b) => new Date(a.started_at) - new Date(b.started_at))

    if (!payload.length) {
        console.log("No valid matches to save at saveMatchesToDB")
        return
    }

    const { data, error } = await supabase
        .from("matches")
        .upsert(
            payload,
            {
                onConflict: "match_id",
                ignoreDuplicates: true
            }
        )
    if (error) {
        console.log("Error saving Matches to database: " + error.message)
    } else {
        console.log(`Saved/ignored ${payload.length} Matches in database`)
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

export async function insertNewPlayer(player) {
    const puuid = await getHDEVPlayerPuuid(player)
    if (!puuid) {
        console.log(`Error fetching player puuid for ${player}`)
        return { data: null, error: new Error(`Player ${player} not found`) }
    }

    const [name, tag] = player.split("#")
    const { data, error } = await supabase
        .from("players")
        .insert({ puuid, name, tag })
    if (error) {
        console.log("Error registering player in database: " + error.message)
        return { data: null, error: new Error("Error registering player in database") }
    }
    
    const newPlayer = await getPlayerByPuuid(puuid)
    return { data: newPlayer, error: null }
}

export async function getPlayerByPuuid(puuid){
    const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("puuid", puuid)
    if (error) {
        console.log("Error registering player in database: " + error.message)
        return null
    }
    
    return data[0]
}

export async function getMatchesByPlayers(players) { // players as array of puuids
    const { data, error } = await supabase
    .from("matches")
    .select("*")
    .contains("players", players)
    .order("started_at", { ascending: false })
    if (error) {
        console.log("Error fetching matches from database: " + error.message)
        return null
    }
    return data
}

export async function getSeasonIdByActId(actId) {
    const { data, error } = await supabase
        .from("acts")
        .select("season_id")
        .eq("id", actId)
        .single()
    if (error) {
        console.log(`Error fetching match season from database: ${error.message}`)
        return null
    }
    return data?.season_id || null
}