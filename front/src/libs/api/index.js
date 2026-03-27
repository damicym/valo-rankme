export async function registerPlayer(player) {
    try {
        const url = `${import.meta.env.VITE_API_URL}/api/register-player`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ player })
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