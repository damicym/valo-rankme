
export async function getTwoPlayers(player1 = 'apel#ado', player2 = 'domix#640') {
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