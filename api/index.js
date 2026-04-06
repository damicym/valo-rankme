import app from "./app.js"
import { pollAllPlayers } from "./src/worker.js"
import { registerPlayer } from "./src/actions.js"

app.listen(app.get('port'), () => {
    console.clear()
    console.log(`   - Server is running on port ${app.get('port')}`)
})

pollAllPlayers()

app.post('/api/register-player/', async (req, res) => {
    const { player } = req.body
    try {
        const registerResponse = await registerPlayer(player)
        if (registerResponse.error || !registerResponse.data) res.status(400).json({ message: registerResponse.error })
            else res.status(200).json(registerResponse.data.puuid)
    } catch (error) {
        console.log(`Error registering player ${player}: ${error.message}`)
        res.status(500).json({ message: `Error registering player ${player}: ${error.message}` })
    }
})

app.use('/api', (req, res) => {
    res.status(200).json({ message: 'API is working!' })
})

app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint not found' })
})