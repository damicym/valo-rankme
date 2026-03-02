import app from "./app.js"
import { twoPlayers, onePlayer, getPlayer_puuid } from "./src/skirmish-ranked.js"

app.listen(app.get('port'), () => {
    console.clear()
    console.log(`   - Server is running on port ${app.get('port')}`)
})

app.use('/api/two-players/:player1_puuid/:player2_puuid', async (req, res) => {
    try {
        const { player1_puuid, player2_puuid } = req.params
        const result = await twoPlayers(player1_puuid, player2_puuid)
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', error: error.message })
    }
})

app.use('/api/one-player/:player1_puuid', async (req, res) => {
    try {
        const player1_puuid = req.params.player1_puuid
        const result = await onePlayer(player1_puuid)
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', error: error.message })
    }
})

app.use('/api/puuid/:player1', async (req, res) => {
    try {
        const player1 = req.params.player1
        const result = await getPlayer_puuid(player1)
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', error: error.message })
    }
})

app.use('/api', (req, res) => {
    res.status(200).json({ message: 'API is working!' })
})

app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint not found' })
})