import { useEffect, useState } from 'react'
import './styles/App.css'
import { getTwoPlayers } from './libs/api'
import twoPlayersLocal from './data/two_players.json'

function App() {
    const [player1, setPlayer1] = useState({ state: 'loading' })
    const [player2, setPlayer2] = useState({ state: 'loading' })
    const [showPlayers, setShowPlayers] = useState(false)
    const [enableAPI, setEnableAPI] = useState(false)

    useEffect(() => {
        if (showPlayers){
            const getPlayerData = async() => {
                const data = enableAPI ? await getTwoPlayers() : twoPlayersLocal
                setPlayer1(data.player1)
                setPlayer2(data.player2)
            }
            getPlayerData()
        }
    }, [showPlayers, enableAPI])

    return (
        <>
            <h1>skirmish ranks</h1>
            <button onClick={() => setEnableAPI(prev => !prev)}>{enableAPI ? 'Usando API 🌐' : 'Usando datos locales 📜'}</button>
            <button onClick={() => setShowPlayers(prev => !prev)}>{!showPlayers ? 'Mostrar jugadores' : 'Esconder Jugadores'}</button>
            { showPlayers && 
                <>
                    <br />
                    <br />
                    <br />
                    <div>jugador 1</div>
                    <br />
                    {
                        JSON.stringify(player1)
                    }
                    <br />
                    <br />
                    <br />
                    <div>jugador 2</div>
                    <br />
                    {
                        JSON.stringify(player2)
                    }
                </>
            }
        </>
        
    )
}

export default App
