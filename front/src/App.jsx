import { /* useEffect, */ useState } from 'react'
import { getTwoPlayers, getOnePlayer } from './libs/api'
import twoPlayersLocal from './data/two_players.json'
import onePlayerLocal from './data/one_player.json'
import PlayerRank from './components/Player'
import Match from './components/Match'

function App() {
    const [player1Data, setPlayer1Data] = useState({})
    const [player2Data, setPlayer2Data] = useState({})
    const [showPlayers, setShowPlayers] = useState(false)
    const [enableAPI, setEnableAPI] = useState(false)
    const [isSoloQ, setIsSoloQ] = useState(false)
    const [showWelcome, setShowWelcome] = useState(false)
    // const [isEditing, setIsEditing] = useState(true)
    const [p1Input, setP1Input] = useState("")
    const [p2Input, setP2Input] = useState("")

    const handleSubmit = (e) => {
        e.preventDefault()
        getPlayerData(p1Input, p2Input)
        setShowPlayers(true)
    }

    const getPlayerData = async(p1, p2) => {
        if(enableAPI){
            if (isSoloQ) {
                const data = await getOnePlayer(p1)
                setPlayer1Data(data.player1)
            } else {
                const data = await getTwoPlayers(p1, p2)
                setPlayer1Data(data.player1)
                setPlayer2Data(data.player2)
            }
        } else {
            if (isSoloQ) {
                const data = onePlayerLocal
                setPlayer1Data(data.player1)
            } else {
                const data = twoPlayersLocal
                setPlayer1Data(data.player1)
                setPlayer2Data(data.player2)
            }
        }
    }

    return (
        <>
            <button onClick={() => setEnableAPI(prev => !prev)}>{enableAPI ? 'Usando API 🌐' : 'Usando datos locales 📜'}</button>
            <div className="site">
                <section className='controlsContainer'>
                    <button className='toggleBtn btn' onClick={() => setIsSoloQ(prev => !prev)}>
                        <div className='svgContainer' style={{transform: isSoloQ ? 'translateX(0%)' : 'translateX(-3%)'}}>
                            { isSoloQ ?
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-user"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /></svg>
                                : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-users"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" /></svg>
                            }
                        </div>
                        <span className='toggleBtnInner'>{isSoloQ ? 'Partidas en soloQ' : 'Partidas con mi duo'}</span>
                    </button>
                    <button className='toggleBtn btn' onClick={() => setShowWelcome(prev => !prev)}>
                        <div className='svgContainer'>
                            { showWelcome ?
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-eye"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" /></svg>
                                : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-eye-off"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.585 10.587a2 2 0 0 0 2.829 2.828" /><path d="M16.681 16.673a8.717 8.717 0 0 1 -4.681 1.327c-3.6 0 -6.6 -2 -9 -6c1.272 -2.12 2.712 -3.678 4.32 -4.674m2.86 -1.146a9.055 9.055 0 0 1 1.82 -.18c3.6 0 6.6 2 9 6c-.666 1.11 -1.379 2.067 -2.138 2.87" /><path d="M3 3l18 18" /></svg>
                            }
                        </div>
                        <span className='toggleBtnInner'>{showWelcome ? 'Ocultar bienvenida' : 'Mostrar bienvenida'}</span>
                    </button>
                </section>
                { showWelcome &&
                    <section className='bienvenida'>
                        <h1>Skirmish ranks :p</h1>
                    </section>
                }
                <section className='playerContainer'>
                    <form 
                        className='allChildren' 
                        onSubmit={handleSubmit}
                    >
                        <div className='centeredChildren'>
                            { showPlayers ? 
                                <>
                                    <PlayerRank data={player1Data} user={p1Input} />
                                    { !isSoloQ &&
                                        <>
                                            <button className='switchPlayersBtn btn' tabIndex={-1}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-switch-horizontal"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M16 3l4 4l-4 4" /><path d="M10 7l10 0" /><path d="M8 13l-4 4l4 4" /><path d="M4 17l9 0" /></svg>
                                            </button>
                                            <PlayerRank data={player2Data} user={p2Input} />
                                        </>
                                    }
                                </> : 
                                <>
                                    <div className='playerRank'>
                                        <div className='inputField'>
                                            <label>Mi usuario</label>
                                            <input onChange={(e) => setP1Input(e.target.value)} className='playerInput' maxLength={100} minLength={5} type="text" placeholder='my name#tag' />
                                        </div>
                                    </div>
                                    { !isSoloQ &&
                                        <>
                                            <button className='switchPlayersBtn btn' tabIndex={-1}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-switch-horizontal"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M16 3l4 4l-4 4" /><path d="M10 7l10 0" /><path d="M8 13l-4 4l4 4" /><path d="M4 17l9 0" /></svg>
                                            </button>
                                            <div className='playerRank'>
                                                <div className='inputField'>
                                                    <label>Usuario de mi duo</label>
                                                    <input onChange={(e) => setP2Input(e.target.value)} className='playerInput' maxLength={100} minLength={5} type="text" placeholder='my duo#tag' />
                                                </div>
                                            </div>
                                        </>
                                    }
                                </>
                            }
                        </div>
                        { !showPlayers &&
                            <button className='submitBtn btn'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-send-2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4.698 4.034l16.302 7.966l-16.302 7.966a.503 .503 0 0 1 -.546 -.124a.555 .555 0 0 1 -.12 -.568l2.468 -7.274l-2.468 -7.274a.555 .555 0 0 1 .12 -.568a.503 .503 0 0 1 .546 -.124" /><path d="M6.5 12h14.5" /></svg>
                                Vamos!
                            </button>
                        }
                    </form>
                </section>
                { showPlayers &&
                    // promedios
                    <section className="matchContainer">
                        {/* fecha */}
                        {
                            player1Data?.matches?.map((m, index) => <Match key={m.date} index={index} data={m}></Match>)
                        }
                    </section>
                }
            </div>
        </>
        
    )
}

export default App
