import { useEffect, useState } from 'react'
import { getTwoPlayers } from './libs/api'
import twoPlayersLocal from './data/two_players.json'
import PlayerRank from './components/Player'
import Match from './components/Match'

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
                <div className="site">
                    <div className='playerContainer'>
                        <PlayerRank data={player1Data} isMain={true} />
                        <PlayerRank data={player2Data} isMain={false} />
                    </div>
                    {/* promedios */}
                    <section className="matchContainer">
                        {/* fecha */}
                        {
                            player1Data?.matches?.map((m, index) => <Match key={m.date} index={index} data={m}></Match>)
                        }
                    </section>
                </div>
            }
        </>
        
    )
}

export default App
