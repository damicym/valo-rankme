import { useEffect, useState } from 'react'
import { /* getTwoPlayers, */ getOnePlayer, getDBModes, getDBSeasons } from './libs/db/queries.js'
import PlayerRank from './components/PlayerRank.jsx'
import Filters from './components/Filters.jsx'
import Matches from './components/Matches.jsx'
import PerformanceSummary from './components/PerformanceSummary.jsx'

function App() {
    const [player1Data, setPlayer1Data] = useState({})
    const [player2Data/* , setPlayer2Data */] = useState({})
    const [showPlayers, setShowPlayers] = useState(false)
    const [isSoloQ/* , setIsSoloQ */] = useState(true)
    const [p1Input, setP1Input] = useState("")
    const [p2Input/* , setP2Input */] = useState("")
    const [gameModes, setGameModes] = useState([])
    const [gameSeasons, setGameSeasons] = useState([])
    const [selectedMode, setSelectedMode] = useState(null)
    const [selectedSeason, setSelectedSeason] = useState(null)
    const [playersLoading, setPlayersLoading] = useState(false)
    const [lastSeason, setLastSeason] = useState(null)
    

    useEffect(() => {
        const fetchDBData = async () => {
            const modesData = await getDBModes()
            const seasonsData = await getDBSeasons()
            const lastSeason = seasonsData[0]?.id || null
            setLastSeason(lastSeason)
            setGameModes(modesData)
            setGameSeasons(seasonsData)
        }
        fetchDBData()
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        getPlayerData(p1Input)
        setShowPlayers(true)
    }

    const getPlayerData = async(p1) => {
        setPlayersLoading(true)
        const data = await getOnePlayer(p1)
        if (data?.player1?.puuid) {
            setPlayer1Data(data.player1)
            setSelectedMode(data.player1?.ranksInfo[0]?.mode_id || null)
        }
        setPlayersLoading(false)
    }

    return (
        <>
            <br />
            <br />
            <div className="site">
                <section className='playerContainer'>
                    <form 
                        className='allChildren' 
                        onSubmit={handleSubmit}
                    >
                        <div className='centeredChildren'>
                            { showPlayers ? 
                                <>
                                    <PlayerRank rankInfo={player1Data?.ranksInfo?.find(r => r.mode_id === selectedMode && (selectedSeason === null ? r.season_id === lastSeason : r.season_id === selectedSeason))} user={p1Input} loading={playersLoading} error={!playersLoading && !player1Data?.puuid} />
                                    { !isSoloQ &&
                                        <>
                                            <button className='switchPlayersBtn btn' tabIndex={-1}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-switch-horizontal"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M16 3l4 4l-4 4" /><path d="M10 7l10 0" /><path d="M8 13l-4 4l4 4" /><path d="M4 17l9 0" /></svg>
                                            </button>
                                            <PlayerRank rankInfo={player2Data?.ranksInfo?.find(r => r.mode_id === selectedMode && (selectedSeason === null ? r.season_id === lastSeason : r.season_id === selectedSeason))} user={p2Input} loading={playersLoading} error={!playersLoading && !player2Data?.puuid} />
                                        </>
                                    }
                                </> : 
                                <>
                                    <div className='playerRank'>
                                        <div className='inputField'>
                                            <label>Mi usuario</label>
                                            <input autoComplete='on' required onChange={(e) => setP1Input(e.target.value)} className='playerInput' maxLength={100} minLength={6} type="text" placeholder='my name#tag' pattern='[^#]+#[^#]+' title='El formato debe ser nombre#tag' />
                                            <span>* Distingue mayúsculas/minúsculas</span>
                                        </div>
                                    </div>
                                </>
                            }
                        </div>
                        { !showPlayers &&
                            <button className='submitBtn btn'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-send-2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4.698 4.034l16.302 7.966l-16.302 7.966a.503 .503 0 0 1 -.546 -.124a.555 .555 0 0 1 -.12 -.568l2.468 -7.274l-2.468 -7.274a.555 .555 0 0 1 .12 -.568a.503 .503 0 0 1 .546 -.124" /><path d="M6.5 12h14.5" /></svg>
                                Vamos!
                            </button>
                        }
                    </form>
                </section>
                { showPlayers && !playersLoading && player1Data?.puuid &&
                    <div className='matchesNFilters'>
                        <Filters 
                            selectedMode={selectedMode}
                            setSelectedMode={setSelectedMode}
                            selectedSeason={selectedSeason}
                            setSelectedSeason={setSelectedSeason}
                            matches={player1Data?.matches}
                            ranksInfo={player1Data?.ranksInfo}
                            gameModes={gameModes}
                            gameSeasons={gameSeasons}
                        />
                        <PerformanceSummary matches={player1Data?.matches} />
                        <Matches matches={player1Data?.matches} selectedMode={selectedMode} selectedSeason={selectedSeason} />
                    </div>
                }
            </div>
        </>
        
    )
}

export default App
