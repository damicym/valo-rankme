
export async function getTwoPlayers(player1_puuid /* = 'b44826bc-ba3f-5988-b4fc-186535663b80' */, player2_puuid /* = '9c10981a-3fc4-5eb4-9a3f-8e3008aeaa20' */) {
    try {
        const url = `${import.meta.env.VITE_API_URL}/api/two-players/${encodeURIComponent(player1_puuid)}/${encodeURIComponent(player2_puuid)}`
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        return data
    } catch (error) {
        console.error('Error fetching player data:', error)
        return null
    }
}

export async function getOnePlayer(player1_puuid /* = '9c10981a-3fc4-5eb4-9a3f-8e3008aeaa20' */) {
    try {
        const url = `${import.meta.env.VITE_API_URL}/api/one-player/${encodeURIComponent(player1_puuid)}`
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        return data
    } catch (error) {
        console.error('Error fetching player data:', error)
        return null
    }
}

export async function getPlayer_puuid(player1 /* = 'domix#640' */) {
    try {
        const url = `${import.meta.env.VITE_API_URL}/api/puuid/${encodeURIComponent(player1)}`
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        return data
    } catch (error) {
        console.error('Error fetching player puuid:', error)
        return null
    }
}