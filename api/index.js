import app from "./app.js"
import { pollAllPlayers } from "./src/worker.js"
import { registerPlayer } from "./src/actions.js"
// import { test } from "./src/test.js"

app.listen(app.get('port'), () => {
    console.clear()
    console.log(`   - Server is running on port ${app.get('port')}`)
})

pollAllPlayers()
// test()

app.post('/api/register-player/', async (req, res) => {
    const { player } = req.body
    try {
        const registerResponse = await registerPlayer(player)
        if (registerResponse.error || !registerResponse.puuid) {
            res.status(400).json({ puuid: null, error: registerResponse.error?.message || "Error al registrar jugador" })
        } else {
            res.status(200).json({ puuid: registerResponse.puuid, error: null })
        }
    } catch (error) {
        console.log(`Error registering player ${player}: ${error.message}`)
        res.status(500).json({ puuid: null, error: `Error desconocido en el servidor al registrar jugador ${player}: ${error.message}` })
    }
})

app.use('/api', (req, res) => {
    res.status(200).json({ message: 'API is working!' })
})

app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint not found' })
})