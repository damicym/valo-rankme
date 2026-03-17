import app from "./app.js"
import { pollAllPlayers } from "./src/worker.js"

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