import { useEffect, useState } from 'react'
import { /* getTwoPlayers, */ getOnePlayer, getDBModes, getDBSeasons } from './libs/db/queries.js'
import PlayerRank from './components/PlayerRank.jsx'
import Filters from './components/Filters.jsx'
import MatchList from './components/MatchList.jsx'
import PerformanceSummary from './components/PerformanceSummary.jsx'
import UserNav from './components/UserNav.jsx'
import SearchModal from './components/SearchModal.jsx'

function App() {
    const [player1Data, setPlayer1Data] = useState({})
    const [gameModes, setGameModes] = useState([])
    const [gameSeasons, setGameSeasons] = useState([])
    const [selectedMode, setSelectedMode] = useState(null)
    const [selectedSeason, setSelectedSeason] = useState(null)
    const [playersLoading, setPlayersLoading] = useState(false)
    const [lastSeason, setLastSeason] = useState(null)
    const [showSearchModal, setShowSearchModal] = useState(true)
    const [section, setSection] = useState("home")
    // const [userSection, setUserSection] = useState(USER_SECTIONS.MATCHES)

    const SECTIONS = {
        HOME: 0,
        PLAYER: 1,
    }

    const USER_SECTIONS = {
        MATCHES: 0,
        RANKS: 1,
    }

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

    const handleSubmit = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const p1 = formData.get('playerInput')
        setPlayersLoading(true)
        await processPlayer(p1)
        setPlayersLoading(false)
        setShowSearchModal(false)
        setSection(SECTIONS.PLAYER)
    }

    const processPlayer = async(p1) => {
        const data = await getOnePlayer(p1)
        if (data?.player1?.puuid) {
            setPlayer1Data(data.player1)
            setSelectedMode(data.player1?.ranksInfo[0]?.mode_id || null)
        }
    }

    return (
        <>
            <div className="site">
                { showSearchModal &&
                    <SearchModal handleSubmit={handleSubmit} />
                }
                <section className='playerContainer'>
                    { section === SECTIONS.PLAYER &&
                        <>
                            <UserNav name={player1Data?.name} tag={player1Data?.tag} banner={player1Data?.display?.banner} title={player1Data?.display?.title} level={player1Data?.display?.level} levelBorder={player1Data?.display?.level_border} />
                            <PlayerRank rankInfo={player1Data?.ranksInfo?.find(r => r.mode_id === selectedMode && (selectedSeason === null ? r.season_id === lastSeason : r.season_id === selectedSeason))} name={player1Data?.name} tag={player1Data?.tag} />
                        </>
                    }
                </section>
                { section === SECTIONS.PLAYER && player1Data?.puuid ?
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
                        <PerformanceSummary matches={player1Data?.matches?.filter(m => m.mode_id === selectedMode && (selectedSeason === null || m.season_id === selectedSeason))} />
                        <MatchList matches={player1Data?.matches} selectedMode={selectedMode} selectedModeName={gameModes.find(m => m.id === selectedMode)?.name} selectedSeason={selectedSeason} selectedSeasonName={gameSeasons.find(s => s.id === selectedSeason)?.name} />
                    </div>
                    : section === SECTIONS.PLAYER && !player1Data?.puuid &&
                    <p>No encontrado</p>
                }
            </div>
        </>
        
    )
}

export default App
