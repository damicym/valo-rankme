const AGENTS_API_URL = 'https://valorant-api.com/v1/agents?isPlayableCharacter=true'
let cachedAgents = null

export async function fetchAgents() {
    if (cachedAgents) return cachedAgents

    const response = await fetch(AGENTS_API_URL)
    if (!response.ok) throw new Error(`Failed to fetch agents: ${response.status}`)

    const { data } = await response.json()

    cachedAgents = data.map(agent => ({
        name: agent.displayName,
        icon: agent.displayIcon,
    }))

    return cachedAgents
}
