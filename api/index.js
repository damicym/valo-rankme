import app from "./app.js"
import { twoPlayers } from "./src/skirmish-ranked.js"

app.listen(app.get('port'), () => {
    console.clear()
    console.log(`   - Server is running on port ${app.get('port')}`)
})

app.use('/api/two-players/:player1/:player2', async (req, res) => {
    try {
        const { player1, player2 } = req.params
        const result = await twoPlayers(player1, player2)
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