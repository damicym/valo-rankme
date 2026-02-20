const IMMORTAL_ELO = 2100

const player1 = 'domix#640'
const player2 = 'apel#ado'

const min_rr = 7
const max_rr = 33
const min_acs = 80.0
const max_acs = 260.0

main()
async function main() {
    const player1Matches = await getMatches(player1)
    const player2Matches = await getMatches(player2)
    const player1Solo_rr = getPlayerRR(player1Matches, player1)
    const player2Solo_rr = getPlayerRR(player2Matches, player2)
    const [player1Duo_rr, player2Duo_rr] = getDuoRR(player1Matches, player1, player2)

    console.log(`Player 1 individual RR: ${player1Solo_rr}`)
    console.log(`Player 2 individual RR: ${player2Solo_rr}`)
    console.log('-----')
    console.log(`Player 1 duo RR: ${player1Duo_rr}`)
    console.log(`Player 2 duo RR: ${player2Duo_rr}`)
}

async function getMatches(player) {
    const [playerName, playerTag] = player.split('#')
    const matches = await getPublicSkirmishMatches(playerName, playerTag, 'latam', 'pc')
    return matches
}

function isImmortal(rr) {
    return rr >= IMMORTAL_ELO
}

function getDuoRR(p1Matches, player1, player2){
    const [player1Name, player1Tag] = player1.split('#')
    const [player2Name, player2Tag] = player2.split('#')

    const duoMatches = p1Matches.filter(m => {
        const targetTeamColor = m.players.find(p => p.name === player1Name && p.tag === player1Tag).team_id
        return m.players.some(p => p.name === player2Name && p.tag === player2Tag && p.team_id === targetTeamColor)
    })
    return [getPlayerRR(duoMatches, player1), getPlayerRR(duoMatches, player2)]
}

function getPlayerRR(matches, player) {
    let current_rr = 50
    let shieldLevel = 2
    const matches_rr = [...matches].reverse().map(match => getMatchRR(match, player))

    matches_rr.forEach(match_rr => {
        // al bajar de 0, el rr se queda en 0
        const new_raw_rr = current_rr + match_rr
        const rank = Math.floor(current_rr / 100)
        const nextRank = Math.floor(new_raw_rr / 100)
        const won = match_rr > 0

        if (new_raw_rr < 0) {
            current_rr = 0
        }
        // al pasar un múltiplo de 100 por menos de 10 rr antes de immortal, se le suma lo necesario para pasarlo por 10 rr
        else if (!isImmortal(current_rr) && won && rank < nextRank) {
            // current_rr += match_rr + (10 - new_raw_rr % 100)
            // current_rr = nextRank * 100 + 10
            current_rr = Math.max(new_raw_rr, nextRank * 100 + 10)
        }
        // al pasar un múltiplo de 100 por menos de 10 rr, se le suma lo necesario para pasarlo por 10 rr
        // no se aplica en immortal (100 rr, 200 rr, etc.)
        else if (current_rr < IMMORTAL_ELO + 100 && !won && rank > nextRank && (current_rr > rank * 100 || shieldLevel > 0)) {
            current_rr = rank * 100
            // sacarle escudo en vez de bajar
            if (shieldLevel > 0) shieldLevel -= 1
        } 
        else {
            current_rr = new_raw_rr
        }
    })

    return current_rr
}

function normalize(acs) {
    return Math.max(0, Math.min(1, (acs - min_acs) / (max_acs - min_acs)))
}
// transformación no lineal para balancear los performances medios
function curve(x, p = 2) {
    return 0.5 + Math.sign(x - 0.5) * Math.pow(Math.abs(x - 0.5) * 2, p) / 2
}

function getMatchRR(match, player){
    const [playerName, playerTag] = player.split('#')
    const inMatchPlayer = match.players.find(p => p.name === playerName && p.tag === playerTag)
    if (!inMatchPlayer) {
        console.log("!inMatchPlayer")
        return 0 // no debería pasar si filtrapos por partidas donde estén ambos jugador
    }
    const teamColor = inMatchPlayer.team_id
    const teamInfo = match.teams.find(t => t.team_id === teamColor)

    const won = teamInfo.won
    const roundsDiff = teamInfo.rounds.won - teamInfo.rounds.lost
    const acs = inMatchPlayer.stats.score / (teamInfo.rounds.won + teamInfo.rounds.lost)
    // const kills = inMatchPlayer.stats.kills
    // const deaths = inMatchPlayer.stats.deaths
    // const assists = inMatchPlayer.stats.assists

    let result = 0
    const acs_normalized = normalize(acs)
    const roundsDiff_normalized = Math.abs(roundsDiff) / 10

    const performance = (acs_normalized * 0.65) + (roundsDiff_normalized * 0.35)

    if (won) {
        result = min_rr + (max_rr - min_rr) * performance
    }
    else {
        result = min_rr + (max_rr - min_rr) * (1 - performance)
        result = -result
    }
    return Math.round(curve(result))
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
                m.metadata.party_rr_penaltys.length > 0 && // no es custom
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
        willNextSetBeValid = false // sacar esto!!!
    }

    // filtrar y solo dejar las partidas q este tambien el player 2

    return allMatches
}