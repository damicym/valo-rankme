import { useEffect, useState } from 'react'
import './styles/App.css'
import { getTwoPlayers } from './libs/api'

function App() {
    const [player1, setPlayer1] = useState(null)
    const [player2, setPlayer2] = useState(null)

    useEffect(() => {
        const getPlayerData = async() => {
            const data = await getTwoPlayers()
            setPlayer1(data.player1)
            setPlayer2(data.player2)
        }
        getPlayerData()
    }, [])

    return (
        <>
            <h1>skirmish ranks</h1>
            {
                JSON.stringify(player1)
            }
            <br />
            <br />
            <div>asdasdsadsadasdasdasdasdasd</div>
            <br />

            {
                JSON.stringify(player2)
            }
        </>
    )
}

export default App
