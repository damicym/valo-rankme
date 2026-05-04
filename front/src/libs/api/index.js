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
        const data = await response.json()
        if (!response.ok) {
            return {
                puuid: null,
                error: data?.error || `Error en el servidor al registrar jugador (${response.status})`
            }
        }

        return {
            puuid: data?.puuid || null,
            error: data?.error || null
        }
    } catch (error) {
        console.error('Error fetching player data:', error)
        return {
            puuid: null,
            error: error?.message === 'Failed to fetch' ? 'El servidor no está disponible. Por favor, inténtalo de nuevo más tarde.' : error?.message
        }
    }
}

export async function getAPIStatus() {
    try {
        const url = `${import.meta.env.VITE_API_URL}/api`
        const response = await fetch(url)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        return response.status === 200 ? true : false
    } catch (error) {
        console.error('Error fetching API status:', error)
        return false
    }
}