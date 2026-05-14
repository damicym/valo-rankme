import e from 'express'
import { config } from '../../config.js'
import { getStartedAt } from './helpers.js'

export async function getHDEVPlayerDisplay(puuid) {
    try{
        const url = `https://api.henrikdev.xyz/valorant/v2/by-puuid/account/${puuid}`
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': config.HENRIKDEV_ACCESS_TOKEN
            }
        })
        const data = await response.json()
        if (!response.ok) {
            if (data.errors && data.errors.length > 0) {
                throw new Error(`HTTP error ${response.status}, ${JSON.stringify(data.errors)}`)
            }
            else {
                throw new Error(`HTTP error ${response.status}`)
            }
        }
        const playerData = data.data
        if (!playerData) return null
        const { card, title, account_level, name, tag } = playerData
        const rawCard = await getCardByUuid(card)
        const banner = rawCard?.wideArt
        const icon = rawCard?.smallArt
        const titleText = await getTitleTextByUuid(title)
        const levelBorder = (await getLevelBorder(account_level)).levelNumberAppearance
        return { banner, icon, titleText, level: account_level, levelBorder, name, tag }
    } catch(err){
        console.log(err)
        return null
    }
}

async function getLevelBorder(level) {
    const borders = await getAllLevelBorders()
    if (!borders) return null
    const bordersDesc = borders.sort((a, b) => b.startingLevel - a.startingLevel)
    const border = bordersDesc.find(b => b.startingLevel <= level)
    return border || null
}

async function getAllLevelBorders() {
    try {
        const url = `https://valorant-api.com/v1/levelborders`
        const response = await fetch(url, {
            method: 'GET'
        })
        const data = await response.json()
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP error ${response.status} ${errorText}`)
        }
        return data.data
    } catch(err){
        console.log(err)
        return null
    }
}

async function getCardByUuid(uuid) {
    try {
        const url = `https://valorant-api.com/v1/playercards/${uuid}`
        const response = await fetch(url, {
            method: 'GET'
        })
        const data = await response.json()
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP error ${response.status} ${errorText}`)
        }
        return data.data
    } catch(err){
        console.log(err)
        return null
    }
}

async function getTitleTextByUuid(uuid) {
    try {
        const url = `https://valorant-api.com/v1/playertitles/${uuid}`
        const response = await fetch(url, {
            method: 'GET'
        })
        const data = await response.json()
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP error ${response.status} ${errorText}`)
        }
        return data?.data?.titleText || null
    } catch(err){
        console.log(err)
        return null
    }
}

export async function getHDEVPlayerPuuid(player) {
    const [name, tag] = player.split("#").map(part => part.trim())
    try{
        const url = `https://api.henrikdev.xyz/valorant/v2/account/${name}/${tag}`
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': config.HENRIKDEV_ACCESS_TOKEN
            }
        })
        const data = await response.json()

        if (!response.ok) {
            if (data.errors && data.errors.length > 0) {
                throw new Error(`HTTP error ${response.status}, ${JSON.stringify(data.errors)}`)
            }
            else {
                throw new Error(`HTTP error ${response.status}`)
            }
        }

        const playerData = data.data
        if (!playerData) return null
        return playerData.puuid

    } catch(err){
        console.log(err)
        return null
    }
}

export async function getHDEVMatches(puuid, matchesToFetch = 10, startIndex = 0, gameMode = null, region = 'latam', platform = 'pc'){
    const maxMatchesForSet = 10
    let matchesLeft = matchesToFetch
    let result = []
    while (matchesLeft) {
        try{
            const size = matchesLeft > maxMatchesForSet ? maxMatchesForSet : matchesLeft
            const url = `https://api.henrikdev.xyz/valorant/v4/by-puuid/matches/${region}/${platform}/${puuid}?size=${size}&start=${startIndex}${gameMode ? `&mode=${gameMode}` : ''}`
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': config.HENRIKDEV_ACCESS_TOKEN
                }
            })
            const responseText = await response.text()
            let data = null
            try {
                data = responseText ? JSON.parse(responseText) : null
            } catch (parseError) {
                const preview = responseText.slice(0, 200).replace(/\s+/g, ' ').trim()
                throw new Error(`Non-JSON response ${response.status}: ${preview || parseError.message}`)
            }
            if (!response.ok) {
                if (data.errors && data.errors.length > 0) {
                    throw new Error(`HTTP error ${response.status}, ${JSON.stringify(data.errors)}`)
                }
                else {
                    throw new Error(`HTTP error ${response.status}`)
                }
            }
            
            result = result.concat(data.data)
            matchesLeft -= size
            startIndex += size
        } catch(err){
            console.log('Error fetching matches from HenrikDev: ' + err)
            break
        }
    }
    const sortedResult = result.sort((a, b) => new Date(getStartedAt(b)) - new Date(getStartedAt(a)))
    return sortedResult || []
}

export async function getActByDate(date) {
    try {
        const res = await fetch('https://valorant-api.com/v1/seasons')
        if (!res.ok) {
            const errorText = await res.text()
            console.log(`[API-ERROR] Error fetching seasons from valorant-api: HTTP ${res.status} ${errorText}`)
            return null
        }

        const payload = await res.json()
        const seasons = payload?.data
        if (!Array.isArray(seasons)) {
            console.log(`[API-ERROR] Error fetching seasons from valorant-api: invalid payload format`)
            return null
        }

        const targetDate = date instanceof Date ? date : new Date(date)
        if (Number.isNaN(targetDate.getTime())) {
            console.log(`[API-ERROR] Invalid date at getActByDate: ${date}`)
            return null
        }

        console.log(`Fetched ${seasons.length} seasons from valorant-api`)

        const rawAct = seasons.find(s => s.type === "EAresSeasonType::Act" && new Date(s.startTime) <= targetDate && new Date(s.endTime) > targetDate)
        if (!rawAct) {
            console.log(`[API-ERROR] !rawAct at getActByDate for date ${targetDate.toLocaleDateString()}`)
            return null
        }

        const rawSeason = seasons.find(s => s.uuid === rawAct.parentUuid)
        if (!rawSeason) {
            console.log(`[API-ERROR] !rawAct or !rawSeason at getActByDate for date ${targetDate.toLocaleDateString()}`)
            return null
        }

        const targetAct = {
            id: rawAct.uuid,
            startTime: new Date(rawAct.startTime),
            endTime: new Date(rawAct.endTime),

            seasonId: rawAct.parentUuid,
            seasonStartTime: new Date(rawSeason.startTime),
            seasonEndTime: new Date(rawSeason.endTime),

            title: rawAct.title,
            actName: rawAct.displayName,
            seasonName: rawSeason.displayName
        }

        return targetAct
    } catch (err) {
        console.log('Error fetching seasons from valorant-api: ' + err)
        return null
    }
}