import supabase from './supabase.js'
import { playerLog, getMatchId, getStartedAt, getShortId, getMatchMode, getMatchModeId, getUniqueMatchesById, getMatchActId, getMatchMap, getPosibleModeName } from '../helpers.js'
import { getPlayerMatchInfo, getMatchRR, getPlayerRank } from '../match_parser.js'
import { getHDEVPlayerDisplay, getHDEVPlayerPuuid } from '../api_requests.js'
import { getActByDate } from '../api_requests.js'

export async function resolveMatchSeasonId(match, options = {}) {
    const { cache = null, puuid = null } = options
    const actId = getMatchActId(match)
    if (!actId) return null

    if (cache && cache.has(actId)) {
        return cache.get(actId)
    }

    let seasonId = await getSeasonIdByActId(actId)
    if (!seasonId) {
        const startedAt = getStartedAt(match)
        const targetAct = await getActByDate(new Date(startedAt))
        if (targetAct && targetAct.id === actId) {
            await insertNewAct(targetAct, puuid)
            seasonId = await getSeasonIdByActId(actId)
        } else if (targetAct) {
            console.log(playerLog(puuid, `[WARN] Could not backfill act ${getShortId(actId)} because date lookup returned ${getShortId(targetAct.id)}`))
        } else {
            console.log(playerLog(puuid, `[WARN] Could not backfill act ${getShortId(actId)} from date ${startedAt}`))
        }
    }

    const resolved = seasonId || null
    if (cache) {
        cache.set(actId, resolved)
    }

    return resolved
}

function toIsoTimestamp(value, fallback = null) {
    if (value === null || value === undefined) return fallback

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? fallback : value.toISOString()
    }

    if (typeof value === 'number') {
        const dateFromNumber = new Date(value)
        return Number.isNaN(dateFromNumber.getTime()) ? fallback : dateFromNumber.toISOString()
    }

    if (typeof value === 'string') {
        const trimmed = value.trim()

        if (/^\d+$/.test(trimmed)) {
            const dateFromNumericString = new Date(Number(trimmed))
            return Number.isNaN(dateFromNumericString.getTime()) ? fallback : dateFromNumericString.toISOString()
        }

        const directDate = new Date(trimmed)
        if (!Number.isNaN(directDate.getTime())) {
            return directDate.toISOString()
        }
    }

    return fallback
}

function compactIsoForLog(isoString) {
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return isoString
    // MM-DD HH:mmZ para logs más cortos y fáciles de leer
    return `${date.toISOString().slice(5, 16).replace('T', ' ')}Z`
}

export async function updatePlayerUpdate(puuid, lastPolledAt, nextPollAt = null) {
    const normalizedLastPolledAt = toIsoTimestamp(lastPolledAt, new Date().toISOString())
    if (nextPollAt === null) {
        const { data, error } = await supabase
            .from("players")
            .update({ last_updated: normalizedLastPolledAt })
            .eq("puuid", puuid)
        if (error) {
            console.log(playerLog(puuid, `Error updating player last poll only time in database: ${error.message}`))
        } else {
            console.log(playerLog(puuid, `Last poll only updated | last ${compactIsoForLog(normalizedLastPolledAt)}`))
        }
        return
    }
    
    const fallbackNextPollAt = new Date(new Date(normalizedLastPolledAt).getTime() + 3 * 60 * 1000).toISOString()
    const normalizedNextPollAt = toIsoTimestamp(nextPollAt, fallbackNextPollAt)

    const { data, error } = await supabase
        .from("players")
        .update({ last_updated: normalizedLastPolledAt, next_update: normalizedNextPollAt })
        .eq("puuid", puuid)
    if (error) {
        console.log(playerLog(puuid, `Error updating player poll times in database: ${error.message}`))
    } else {
        console.log(playerLog(puuid, `Poll updated | last ${compactIsoForLog(normalizedLastPolledAt)} | next ${compactIsoForLog(normalizedNextPollAt)}`))
    }
}

export async function updatePlayerDisplay(puuid) {
    const { banner, icon, titleText, level, levelBorder, name, tag } = await getHDEVPlayerDisplay(puuid)
    if (!banner || !icon || !titleText || level === null || !levelBorder || !name || !tag) {
        console.log(playerLog(puuid, `[DISPLAY-WARN] Display info for player is incomplete (banner: ${!!banner}, icon: ${!!icon}, title: ${!!titleText}, level: ${level !== null}, levelBorder: ${!!levelBorder}, name: ${!!name}, tag: ${!!tag})`))
    }

    const { data: currentDBPlayer, error: currentDBPlayerError } = await supabase
        .from("players")
        .select("banner, icon, title, level, level_border, name, tag")
        .eq("puuid", puuid)
        .limit(1)

    if (currentDBPlayerError) {
        console.log(playerLog(puuid, `[DISPLAY-ERROR] Error fetching current player display from database: ${currentDBPlayerError.message}`))
        return
    }

    const currentDisplay = currentDBPlayer?.[0] || null
    const nextDisplay = {
        ...(banner && { banner }),
        ...(icon && { icon }),
        ...(titleText && { title: titleText }),
        ...(level !== null && { level }),
        ...(levelBorder && { level_border: levelBorder }),
        ...(name && { name }),
        ...(tag && { tag })
    }

    const displayChanged = !currentDisplay || Object.entries(nextDisplay).some(([key, value]) => currentDisplay[key] !== value)
    if (!displayChanged) return
        else if (name && tag && currentDisplay.name && currentDisplay.tag && (currentDisplay.name !== name || currentDisplay.tag !== tag)) {
            console.log(playerLog(puuid, `Player display name/tag changed from ${currentDisplay.name}#${currentDisplay.tag} to ${name}#${tag}`))
        }

    const { data, error } = await supabase
        .from("players")
        .update(nextDisplay)
        .eq("puuid", puuid)
    if (error) {
        console.log(playerLog(puuid, `Error updating player display in database: ${error.message}`))
    } else {
        console.log(playerLog(puuid, `Updated player display in database`))
    }
}

export async function updatePlayerRank(puuid, newMatches, dbModes) {
    if (!newMatches || !newMatches.length) {
        console.log(playerLog(puuid, "No new matches to update player rank at updatePlayerRank"))
        return
    }

    // consigo los rangos para el jugador gurdados en la db
    const { data: ranks, error: ranksFetchError } = await supabase
        .from("player_mode_ranks")
        .select("*")
        .eq("player_puuid", puuid)
    if (ranksFetchError) {
        console.log(playerLog(puuid, `Error fetching player rank from database: ${ranksFetchError.message}`))
        return
    }
    
    const storedPlayerMatches = await getPlayerMatches(puuid)
    const soterdMatchesIds = storedPlayerMatches ? storedPlayerMatches.map(m => getMatchId(m)) : []
    // guardo cada partida en su respectivo array de season
    const matchesBySeason = {}
    const uniqueMatches = getUniqueMatchesById([...newMatches])
        .sort((a, b) => new Date(getStartedAt(a)) - new Date(getStartedAt(b)))
        .filter(m => !soterdMatchesIds.includes(getMatchId(m)))

    const resolvedSeasonByAct = new Map()

    const matchesWithSeason = await Promise.all(
        uniqueMatches.map(async m => ({
            match: m,
            seasonId: await resolveMatchSeasonId(m, { cache: resolvedSeasonByAct })
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
        console.log(playerLog(puuid, `No matches with season info to update player rank at updatePlayerRank`))
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
            const id = `${modeId}_${seasonId}_${puuid}`
            const dbRank = ranks.find(r => r.id === id) || null
            const newModeRank = getPlayerRank(rrChanges, dbRank)
            if (dbRank) { // si ya estaba el rango en la db, lo updateo...
                const { data, error } = await supabase
                    .from("player_mode_ranks")
                    .update({ ...newModeRank })
                    .eq("id", id)
                if (error) {
                    console.log(playerLog(puuid, `Error updating player mode rank in database: ${error.message}`))
                } else {
                    console.log(playerLog(puuid, `Updated player mode rank for mode ${modeId} and season ${getShortId(seasonId)} in database`))
                }
            } else { // ...sino lo inserto
                const { data, error } = await supabase
                    .from("player_mode_ranks")
                    .insert({ id, player_puuid: puuid, mode_id: modeId, season_id: seasonId, ...newModeRank })
                if (error) {
                    console.log(playerLog(puuid, `Error saving player mode rank in database: ${error.message}`))
                } else {
                    console.log(playerLog(puuid, `Saved player mode rank for mode ${modeId} and season ${getShortId(seasonId)} in database`))
                }
            }
        }
    }
}

export async function savePlayerMatchesToDB(puuid, newRawMatches, dbModes, storedRanks = []) {
    const usingMatches = getUniqueMatchesById(newRawMatches)
        .sort((a, b) => new Date(getStartedAt(a)) - new Date(getStartedAt(b)))
    
    if (!usingMatches || !usingMatches.length) {
        console.log(playerLog(puuid, "No matches to save at savePlayerMatchesToDB"))
        return
    }

    const rankableModes = dbModes.filter(m => m.is_rankable)

    const resolvedSeasonByAct = new Map()

    const rows = await Promise.all(usingMatches.map(async (match, mIndex) => {
        const matchModeId = getMatchModeId(match)
        const matchSeasonId = await resolveMatchSeasonId(match, { cache: resolvedSeasonByAct, puuid })

        // para cada partida consigo sus anteriores del mismo modo y season para el cálculo del rank
        const previousCandidates = await Promise.all(
            usingMatches.slice(0, mIndex === -1 ? 0 : mIndex).map(async (pm) => {
                const sameMode = getMatchModeId(pm) === matchModeId
                const sameSeason = (await resolveMatchSeasonId(pm, { cache: resolvedSeasonByAct, puuid })) === matchSeasonId
                return sameMode && sameSeason ? pm : null
            })
        )
        const previousMatches = previousCandidates.filter(Boolean)

        const initialRank = storedRanks.find(r => r.id === `${matchModeId}_${matchSeasonId}_${puuid}`) || null
        // conisgo la info de la partida que se va a gurdar
        return await getPlayerMatchInfo(match, puuid, previousMatches, rankableModes, initialRank, matchSeasonId)
    }))
    
    const { data, error } = await supabase
        .from("player_matches")
        .upsert(
            rows,
            {
                onConflict: "id",
                ignoreDuplicates: true
            }
        )
    if (error) {
        console.log(playerLog(puuid, "Error saving Player Matches to database: " + error.message))
    } else {
        console.log(playerLog(puuid, `Saved/ignored ${newRawMatches.length} Player Matches to database`))
    }
    
    await updateLastMatchId(puuid, getMatchId(newRawMatches[0]))
}

export async function insertNewAct(targetAct, puuid = null) {
    const season = await getSeasonById(targetAct.seasonId, puuid)
    if (!season) await insertNewSeason(targetAct.seasonStartTime, targetAct.seasonEndTime, targetAct.seasonName, targetAct.seasonId, puuid)
    
    const { data, error } = await supabase
        .from("acts")
        .upsert({
            id: targetAct.id,
            start_time: targetAct.startTime,
            end_time: targetAct.endTime,
            season_id: targetAct.seasonId,
            title: targetAct.title,
            act_name: targetAct.actName,
        }, { onConflict: "id", ignoreDuplicates: true })
    if (error) {
            console.log(playerLog(puuid, `Error inserting new act into database: ${error.message}`))
    }
}

    export async function insertNewSeason(startTime, endTime, name, id, puuid = null) {
    const { data, error } = await supabase
        .from("seasons")
        .upsert({
            id,
            start_time: startTime,
            end_time: endTime,
            name
        }, { onConflict: "id", ignoreDuplicates: true })
    if (error) {
            console.log(playerLog(puuid, `Error inserting new season into database: ${error.message}`))
    }
}

    export async function getSeasonById(seasonId, puuid = null) {
    const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .eq("id", seasonId)
    if (error) {
        console.log(playerLog(puuid, `Error fetching season from database: ${error.message}`))
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
        console.log(playerLog(puuid, "Error updating last match id in database: " + error.message))
    } else {
        console.log(playerLog(puuid, `Updated last match id to ${getShortId(matchId)} in database`))
    }
}

export async function updatePlayerUser(puuid, name, tag) {
    const normalizedName = typeof name === 'string' ? name.trim() : ''
    const normalizedTag = typeof tag === 'string' ? tag.trim() : ''
    if (!normalizedName || !normalizedTag) {
        console.log(`[WARN] Skipping player user update for ${getShortId(puuid)} because name/tag is empty`)
        return
    }

    const { data, error } = await supabase
        .from("players")
        .update({ name: normalizedName, tag: normalizedTag })
        .eq("puuid", puuid)
    if (error) {
        console.log(playerLog(puuid, "Error updating player user in database: " + error.message))
    } else {
        console.log(playerLog(puuid, "Updated player user in database"))
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
        console.log(playerLog(puuid, `Error fetching player matches from database: ${error.message}`))
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

export async function saveMatchesToDB(matches, dbModes, puuid = null) {
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
    const resolvedSeasonByAct = new Map()

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
            season_id: await resolveMatchSeasonId(m, { cache: resolvedSeasonByAct, puuid }),
            is_rankable: rankableModes.includes(getMatchModeId(m))
        }))
        ))
        .filter(getMatchId)
        .filter((m) => {
            if (m.season_id) return true
            console.log(playerLog(puuid, `[WARN] Skipping match ${m.match_id} because season_id could not be resolved`))
            return false
        })
        .sort((a, b) => new Date(a.started_at) - new Date(b.started_at))
        
    if (!payload.length) {
        console.log(playerLog(puuid, "No valid matches to save at saveMatchesToDB"))
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
        console.log(playerLog(puuid, "Error saving Matches to database: " + error.message))
    } else {
        console.log(playerLog(puuid, `Saved/ignored ${payload.length} Matches in database`))
    }
}

export async function getPlayers(options = {}) {
    const { readyOnly = false } = options
    
    let query = supabase
        .from("players")
        .select("puuid, name, tag, last_match_id")

    if (readyOnly) {
        query = query.eq("ready_to_poll", true)
    }

    const { data: players, error } = await query
    if (error) {
        console.log("Error fetching players from database: " + error.message)
    }
    return players
}

export async function insertNewPlayer(player) {
    const puuid = await getHDEVPlayerPuuid(player)
    if (!puuid) {
        console.log(`Error fetching player puuid for ${player}`)
        return { puuid: null, error: new Error(`Jugador ${player} no encontrado en Valorant`) }
    }

    const [name, tag] = player.split("#").map(part => part.trim())
    const { data, error } = await supabase
        .from("players")
        .insert({ puuid, name, tag })
    if (error) {
        console.log("Error registering player in database: " + error.message)
        return { puuid: null, error: new Error("Error al registrar jugador en la base de datos") }
    }
    
    return { puuid, error: null }
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

export async function getDBModes(rankableOnly = false, displayedOnly = false) {
    let query = supabase
        .from("modes")
        .select("*")

    if (rankableOnly) {
        query = query.eq("is_rankable", true)
    }
    if (displayedOnly) {
        query = query.eq("is_displayed", true)
    }

    const { data, error } = await query
    if (error) {
        console.log("Error fetching modes from database: " + error.message)
        return []
    }
    return data || []
}

export async function setReadyToPoll(puuid) {
    const { data, error } = await supabase
        .from("players")
        .update({ ready_to_poll: true })
        .eq("puuid", puuid)
    if (error) {
        console.log(`Error setting player ${getShortId(puuid)} ready to poll in database: ${error.message}`)
    } else {
        console.log(`[${getShortId(puuid)}] Set player ready to poll in database`)
    }
}

export async function getDBPlayerRanks(puuid) {
    const { data, error } = await supabase
        .from("player_mode_ranks")
        .select("*")
        .eq("player_puuid", puuid)
    if (error) {
        console.log(`Error fetching player ranks from database: ${error.message}`)
        return []
    }
    return data || []
}