const HENRIKDEV_ACCESS_TOKEN = process.env.HENRIKDEV_ACCESS_TOKEN
const MAX_MATCHES_PER_CALL = 10

// esto funciona porque en la v4.6.0 de HenrikDev API el modo Skirmish: 2v2 no se detecta, pero
// se puede conseguir buscando mode: custom -> mode_type: Skirmish -> party_rr_penaltys.lenght > 0 
// conseguir todas las partidas custom skirmish del acto:

// 1. fetchear por partidas custom
// 2. seguir fetcheando hasta que no haya más en el acto
// 3. agregar a la lista solo si es skirmish y del acto correcto
// 4. si te quedas sin tokens, parar y logear

async function getPublicSkirmishMatches(playerName, tag, region, platform){
    let allMatches = []
    let willNextSetBeValid = true // set of matches
    let targetAct
    let fetchIndex = 0

    while (willNextSetBeValid) {
        try{
            const response = await fetch(
                `https://api.henrikdev.xyz/valorant/v4/matches/${region}/${platform}/${playerName}/${tag}?mode=custom&size=${MAX_MATCHES_PER_CALL}&start=${10 * fetchIndex}`, {
                method: 'GET',
                headers: {
                    'Authorization': HENRIKDEV_ACCESS_TOKEN
                }
            })
            
            if (!response.ok) {
                if(response.status == 429){
                    console.log("Rate limit reached")
                    break
                }
                throw new Error(`HTTP error ${response.status}`)
            }
            
            const data = await response.json()
            const matches = data.data

            if (matches.length === 0) break
            if(fetchIndex == 0) targetAct = matches[0].metadata.season.short
            fetchIndex++

            if(matches.some(m => m.metadata.season.short != targetAct)) willNextSetBeValid = false
            
            const usefulMatches = matches.filter(m => m.metadata.party_rr_penalties.length > 0 && m.metadata.queue.mode_type == 'Skirmish' && m.metadata.season.short == targetAct)
            allMatches.push(...usefulMatches)

            if (matches.length < MAX_MATCHES_PER_CALL) {
                willNextSetBeValid = false
            }

        } catch(err){
            console.log(err)
        }
    }

    return allMatches
}

async function calcRR(){
    const matches = await getPublicSkirmishMatches('domix', '640', 'latam', 'pc')
    matches.reverse()
    let rr = 50
    
}

calcRR()