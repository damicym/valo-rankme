import { useEffect, useState } from 'react'
import { getTwoPlayers } from './libs/api'
import twoPlayersLocal from './data/two_players.json'
import Player from './components/Player'

function App() {
    const [player1Data, setPlayer1Data] = useState({ state: 'loading' })
    const [player2Data, setPlayer2Data] = useState({ state: 'loading' })
    const [showPlayers, setShowPlayers] = useState(false)
    const [enableAPI, setEnableAPI] = useState(false)

    useEffect(() => {
        if (showPlayers){
            const getPlayerData = async() => {
                const data = enableAPI ? await getTwoPlayers() : twoPlayersLocal
                setPlayer1Data(data.player1)
                setPlayer2Data(data.player2)
            }
            getPlayerData()
        }
    }, [showPlayers, enableAPI])

    // useEffect(() => {
    // }, [])

    return (
        <>
            <h1>skirmish ranks</h1>
            <button onClick={() => setEnableAPI(prev => !prev)}>{enableAPI ? 'Usando API 🌐' : 'Usando datos locales 📜'}</button>
            <button onClick={() => setShowPlayers(prev => !prev)}>{!showPlayers ? 'Mostrar jugadores' : 'Esconder Jugadores'}</button>
            { showPlayers && 
                <div className='playerContainer'>
                    <Player data={player1Data} />
                    <Player data={player2Data} />
                </div>
            }
        </>
        
    )
}

export default App
