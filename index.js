const player1 = 'domix#640'
const player2 = 'apel#ado'

main()
async function main() {
    const matches = await getMatches()
    const player1rr = getRRFromPlayer(matches, player1)
    const player2rr = getRRFromPlayer(matches, player2)
}

async function getMatches() {
    const [playerName, playerTag] = player1.split('#')
    const matches = await getPublicSkirmishMatches(playerName, playerTag, 'latam', 'pc')
    return matches
}

async function getRRFromPlayer(matches, player) {
    var rr = 50
    const matchesRR = [...matches].reverse().map(match => calcMatchRR(match, player))
    matchesRR.forEach(value => rr+= value)
}

function calcMatchRR(match, player){
    const [playerName, playerTag] = player.split('#')
    const inMatchPlayer = match.metadata.players.find(p => p.name === playerName && p.tag === playerTag)
    const teamColor = inMatchPlayer.team_id
    const teamInfo = match.teams.find(t => t.team_id === teamColor)

    const won = teamInfo.won
    const roundsDiff = teamInfo.rounds.won - teamInfo.rounds.lost
    const acs = inMatchPlayer.stats.score / teamInfo.rounds.won + teamInfo.rounds.lost
    const kills = inMatchPlayer.stats.kills
    const deaths = inMatchPlayer.stats.deaths
    const assists = inMatchPlayer.stats.assists

    let rr = 0

    return rr
}

/**
 * 1. fetchear por partidas custom
 * 2. seguir fetcheando hasta que no haya más en el acto
 * 3. agregar a la lista solo si es skirmish y del acto correcto
 * 4. si te quedas sin tokens, parar y logear
 * 
 * esto funciona porque en la v4.6.0 de HenrikDev API el modo Skirmish: 2v2 no se detecta, pero
 * se puede conseguir buscando mode: custom -> mode_type: Skirmish -> party_rr_penaltys.lenght > 0 
 */ 
async function getPublicSkirmishMatches(playerName, tag, region, platform){
    const MAX_MATCHES_PER_CALL = 10 // el máximo permitido por la API actualmente
    let allMatches = []
    let willNextSetBeValid = true // set of matches
    let targetAct = ''
    let fetchIndex = 0

    while (willNextSetBeValid) {
        try{
            const response = await fetch(
                `https://api.henrikdev.xyz/valorant/v4/matches/${region}/${platform}/${playerName}/${tag}?mode=custom&size=${MAX_MATCHES_PER_CALL}&start=${10 * fetchIndex}`, {
                method: 'GET',
                headers: {
                    'Authorization': process.env.HENRIKDEV_ACCESS_TOKEN
                }
            })
            
            if (!response.ok) {
                if (response.errors.length > 0) {
                    throw new Error(`HTTP error ${response.status}, ${JSON.stringify(response.errors)}`)
                }
                else {
                    throw new Error(`HTTP error ${response.status}`)
                }
            }
            
            const data = await response.json()
            const matches = data.data

            if (matches.length === 0) break
            if (fetchIndex === 0) targetAct = matches[0].metadata.season.short
            fetchIndex++

            if (matches.some(m => m.metadata.season.short !== targetAct)) willNextSetBeValid = false
            
            const usefulMatches = matches.filter(m => (
                m.metadata.party_rr_penalties.length > 0 && // no es custom
                m.metadata.queue.mode_type == 'Skirmish' && // es skirmish
                m.metadata.season.short == targetAct // es del acto correcto
            ))
            allMatches.push(...usefulMatches)

            if (matches.length < MAX_MATCHES_PER_CALL) {
                willNextSetBeValid = false
            }

        } catch(err){
            console.log(err)
            break
        }
    }

    return allMatches
}