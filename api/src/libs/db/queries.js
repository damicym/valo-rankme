import supabase from './supabase.js'
import { getMatchId, getStartedAt, getShortId, getMatchMode, getMatchModeId, getUniqueMatchesById, getMatchSeasonId, getMatchActId, getMatchMap, getPosibleModeName } from '../helpers.js'
import { getPlayerMatchInfo, getMatchRR, getPlayerRank } from '../match_parser.js'
import { getHDEVPlayerPuuid } from '../api_requests.js'

export async function updatePlayerRank(puuid, newMatches, dbModes) {
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

    const rankableModes = dbModes.filter(m => m.is_rankable)
    const rankableModeIds = rankableModes.map(m => m.id)
    // recorro cada season con sus matches
    for (const [seasonId, matches] of Object.entries(matchesBySeason)) {
        // guardo de cada partida su rr_change, en el array de su respectivo modo
        const rrChangesByMode = {}
        matches.forEach(match => {
            const modeId = getMatchModeId(match)?.trim()
            if (modeId) {
                if (!rrChangesByMode[modeId]) {
                    rrChangesByMode[modeId] = []
                }
                const dbMode = rankableModes.find(dbM => dbM.id === modeId) || null
                const rrChange = rankableModeIds.includes(modeId) ? getMatchRR(match, puuid, dbMode) : null
                if (rrChange !== null && rrChange !== undefined) rrChangesByMode[modeId].push(rrChange)
            }
        })

        // por cada modo (e indirectamente por season), consigo el nuevo rango
        for (const [modeId, rrChanges] of Object.entries(rrChangesByMode)) {
            if (!rankableModeIds.includes(modeId)) continue

            const dbRank = ranks.find(r => r.mode_id === modeId && r.season_id === seasonId) || null
            const newModeRank = getPlayerRank(rrChanges, dbRank)
            if (dbRank) { // si ya estaba el rango en la db, lo updateo...
                const { data, error } = await supabase
                    .from("player_mode_ranks")
                    .update(newModeRank)
                    .update({ matches_played: dbRank.matches_played + rrChanges.length })
                    .eq("player_puuid", puuid)
                    .eq("mode_id", modeId)
                    .eq("season_id", seasonId)
                if (error) {
                    console.log(`Error updating player mode rank (${getShortId(puuid)}) in database: ${error.message}`)
                } else {
                    console.log(`[${getShortId(puuid)}] Updated player mode rank for mode ${modeId} and season ${getShortId(seasonId)} in database`)
                }
            } else { // ...sino lo inserto
                const { data, error } = await supabase
                    .from("player_mode_ranks")
                    .insert({ player_puuid: puuid, mode_id: modeId, season_id: seasonId, ...newModeRank })
                if (error) {
                    console.log(`Error saving player mode rank (${getShortId(puuid)}) in database: ${error.message}`)
                } else {
                    console.log(`[${getShortId(puuid)}] Saved player mode rank for mode ${modeId} and season ${getShortId(seasonId)} in database`)
                }
            }
        }
    }
}

export async function savePlayerMatchesToDB(puuid, newRawMatches, dbModes) {
    // consigo las partidas del jugador ya guardadas y las mezclo con las nuevas para tener historial
    const storedPlayerMatches = await getPlayerMatches(puuid)
    const allMixedMatches = getUniqueMatchesById([...(storedPlayerMatches || []), ...newRawMatches])
        .sort((a, b) => new Date(getStartedAt(a)) - new Date(getStartedAt(b)))
    
    if (!allMixedMatches || !allMixedMatches.length) {
        console.log("No matches to save at savePlayerMatchesToDB")
        return
    }

    const rankableModes = dbModes.filter(m => m.is_rankable)

    const rows = await Promise.all(newRawMatches.map(async (match, mIndex) => {
        const matchModeId = getMatchModeId(match)
        const matchSeasonId = await getMatchSeasonId(match)
        
        // para cada partida consigo sus anteriores del mismo modo y season para el cálculo del rank
        const previousCandidates = await Promise.all(
            allMixedMatches.slice(0, mIndex).map(async (pm) => {
                const sameMode = getMatchModeId(pm) === matchModeId
                const sameSeason = (await getMatchSeasonId(pm)) === matchSeasonId
                return sameMode && sameSeason ? pm : null
            })
        )
        const previousMatches = previousCandidates.filter(Boolean)

        // conisgo la info de la partida que se va a gurdar
        return await getPlayerMatchInfo(match, puuid, previousMatches, rankableModes)
    }))
    
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
        console.log(`[${getShortId(puuid)}] Saved/ignored ${newRawMatches.length} Player Matches to database`)
    }
    
    await updateLastMatchId(puuid, getMatchId(newRawMatches[0]))
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
        .eq("is_rankable", true)
        .order("started_at", { ascending: false })
    if (error) {
        console.log(`Error fetching player matches from database: ${error.message}`)
        return null
    }
    return data
}

export async function saveNewModesToDB(newModes) {
    const { data, error } = await supabase
        .from("modes")
        .insert(newModes.map(m => ({ 
            id: m.id, 
            name: m?.name || getPosibleModeName(m.id), 
            ...(m?.min_rr !== undefined ? { min_rr: m.min_rr } : {}),
            ...(m?.max_rr !== undefined ? { max_rr: m.max_rr } : {}),
            ...(m?.min_acs !== undefined ? { min_acs: m.min_acs } : {}),
            ...(m?.max_acs !== undefined ? { max_acs: m.max_acs } : {}),
            ...(m?.rounds_to_win !== undefined ? { rounds_to_win: m.rounds_to_win } : {}),
            ...(m?.is_rankable !== undefined ? { is_rankable: m.is_rankable } : {}),
        })))
    if (error) {
        console.log(`Error inserting new modes into database: ${error.message}`)
    }
}

export async function saveMatchesToDB(matches, dbModes) {
    // encontrar los modeId que no se encuentren en dbModes
    const modeIds = Array.from(new Set(
        matches.map(match => getMatchModeId(match))
    ))
    const dbModeIds = dbModes.map(dbMode => dbMode.id)
    const newModeIds = modeIds.filter(id => !dbModeIds.includes(id))
    if (newModeIds && newModeIds.length > 0) {
        const newModes = newModeIds.map(id => {
            const match = matches.find(m => getMatchModeId(m) === id)
            const modeInfo = { id, name: getMatchMode(match) }
            return modeInfo
        })
        await saveNewModesToDB(newModes)
    }

    const rankableModes = dbModes.filter(m => m.is_rankable).map(m => m.id)
    const payload = (await Promise.all(
        matches.map(async (m) => ({
            match_id: getMatchId(m),
            raw_json: m,
            ingested_at: new Date(),
            started_at: getStartedAt(m),
            act_id: getMatchActId(m),
            map: getMatchMap(m),
            mode_id: getMatchModeId(m),
            players: m?.players?.map(p => p.puuid) || [],
            season_id: await getMatchSeasonId(m),
            is_rankable: rankableModes.includes(getMatchModeId(m))
        }))
        ))
        .filter(getMatchId)
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
    .eq("is_rankable", true)
    .contains("players", players)
    .order("started_at", { ascending: false })
    if (error) {
        console.log("Error fetching matches from database: " + error.message)
        return null
    }
    return data
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

export async function getPlayerMatchesIds(puuid) {
    const { data, error } = await supabase
        .from("player_matches")
        .select("match_id")
        .eq("player_puuid", puuid)
        .order("started_at", { ascending: false })
    if (error) {
        console.log(`Error fetching stored match ids for player ${getShortId(puuid)} from database: ${error.message}`)
        return null
    }
    return data ? data.map(d => d.match_id) : []
}

export async function getStoredRawMatchesByPlayer(puuid) {
    const matchIds = await getPlayerMatchesIds(puuid)
    if (!matchIds || matchIds.length === 0) {
        console.log(`[${getShortId(puuid)}] No stored matches found in database`)
        return []
    }
    const { data, error } = await supabase
        .from("matches")
        .select("raw_json")
        .in("match_id", matchIds)
        .order("started_at", { ascending: false })
    if (error) {
        console.log(`Error fetching stored raw matches for player ${getShortId(puuid)} from database: ${error.message}`)
        return []
    }
    return data ? data.map(d => d.raw_json) : []
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