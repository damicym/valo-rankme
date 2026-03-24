import app from "./app.js"
import { pollAllPlayers } from "./src/worker.js"
import registerPlayer from "./src/actions.js"

app.listen(app.get('port'), () => {
    console.clear()
    console.log(`   - Server is running on port ${app.get('port')}`)
})

pollAllPlayers()

app.use('/api', (req, res) => {
    res.status(200).json({ message: 'API is working!' })
})

app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint not found' })
})

app.use('/api/register-player/:player', async (req, res) => {
    try {
        const { player } = req.params
        await registerPlayer(player)
        res.status(200).json({ message: 'Player registered successfully' })
    } catch (error) {
        console.log(`Error registering player ${player}: ${error.message}`)
        res.status(500).json({ message: `Error registering player ${player}: ${error.message}` })
    }
})