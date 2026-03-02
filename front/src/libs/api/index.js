
export async function getTwoPlayers(player1, player2) {
    try {
        const url = `${import.meta.env.VITE_API_URL}/api/two-players/${encodeURIComponent(player1)}/${encodeURIComponent(player2)}`
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

export async function getOnePlayer(player1) {
    try {
        const url = `${import.meta.env.VITE_API_URL}/api/one-player/${encodeURIComponent(player1)}`
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

export async function getPlayer_puuid(player1) {
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