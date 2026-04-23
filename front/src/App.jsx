import { useEffect, useState } from 'react'
import { /* getTwoPlayers, */ getOnePlayer, getDBModes, getDBSeasons } from './libs/db/queries.js'
import PlayerRank from './components/PlayerRank.jsx'
import Filters from './components/Filters.jsx'
import MatchList from './components/MatchList.jsx'
import PerformanceSummary from './components/PerformanceSummary.jsx'
import UserNav from './components/UserNav.jsx'
import SearchModal from './components/SearchModal.jsx'
import { SECTIONS, USER_SECTIONS } from './config.js'
import NavBar from './components/NavBar.jsx'
import RankList from './components/RankList.jsx'

function App() {
    const [gameModes, setGameModes] = useState([])
    const [gameSeasons, setGameSeasons] = useState([])
    const [lastSeason, setLastSeason] = useState(null)
    
    const [player1Data, setPlayer1Data] = useState({})
    const [playersLoading, setPlayersLoading] = useState(false)
    const [showSearchModal, setShowSearchModal] = useState(false)

    const [section, setSection] = useState(SECTIONS.HOME)
    const [userSection, setUserSection] = useState(USER_SECTIONS.MATCHES)
    const [selectedMode, setSelectedMode] = useState(null)
    const [selectedSeason, setSelectedSeason] = useState(null)

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

    useEffect(() => {
        if (!showSearchModal) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [showSearchModal])

    const handleSubmit = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const p1 = formData.get('playerInput')
        setPlayersLoading(true)

        try{
            await processPlayer(p1)
        } catch (error) {
            setPlayer1Data(prev => ({ ...(prev || {}), error: error.message || 'Error al obtener datos del jugador' }))
        }

        setPlayersLoading(false)
        setShowSearchModal(false)
        setSection(SECTIONS.PLAYER)
    }

    const processPlayer = async(p1) => {
        if (!p1) return
        const [name, tag] = p1.split('#')
        setSelectedSeason(null)
        setUserSection(USER_SECTIONS.MATCHES)

        if (name === player1Data?.name && tag === player1Data?.tag) {
            setSelectedMode(data.player1?.ranksInfo[0]?.mode_id || null)
            return
        }

        const data = await getOnePlayer(p1)
        setPlayer1Data({})
        if (data?.player1?.puuid) {
            setPlayer1Data(data.player1)
            setSelectedMode(data.player1?.ranksInfo[0]?.mode_id || null)
        }
    }

    const selectedRankInfo = player1Data?.ranksInfo?.find(
        r => r.mode_id === selectedMode && (selectedSeason === null ? r.season_id === lastSeason : r.season_id === selectedSeason)
    )
    const filteredMatches = player1Data?.matches?.filter(
        m => m.mode_id === selectedMode && (selectedSeason === null || m.season_id === selectedSeason)
    )

    const renderHome = () => (
        <div className='home'>
            <h1>Skirmish Ranks</h1>
            <p>Consulta tu rango y rendimiento en partidas clasificatorias de Valorant.</p>
            <button className='btn' onClick={() => setShowSearchModal(true)}>¡Empecemos!</button>
        </div>
    )

    const renderInfoByUserSection = () => {
        switch (userSection) {
            case USER_SECTIONS.MATCHES:
                return (
                    <>
                        <PlayerRank rankInfo={selectedRankInfo} direction='vertical'/>
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
                                displayModes={true}
                            />
                            <PerformanceSummary matches={filteredMatches} />
                            <MatchList
                                matches={player1Data?.matches}
                                selectedMode={selectedMode}
                                selectedModeName={gameModes.find(m => m.id === selectedMode)?.name}
                                selectedSeason={selectedSeason}
                                selectedSeasonName={gameSeasons.find(s => s.id === selectedSeason)?.name}
                            />
                        </div>
                    </>
                )
            case USER_SECTIONS.RANKS:
                return (
                    <>
                        <Filters 
                            selectedSeason={selectedSeason}
                            setSelectedSeason={setSelectedSeason}
                            gameSeasons={gameSeasons}
                            matches={player1Data?.matches}
                            displayModes={false}
                        />
                        <RankList ranksInfo={player1Data?.ranksInfo} gameModes={gameModes} selectedSeason={selectedSeason} lastSeason={lastSeason} />
                    </>
                )
            default:
                return null
        }
    }

    const renderMainSection = () => {
        switch (section) {
            case SECTIONS.HOME:
                return renderHome()
            case SECTIONS.PLAYER:
                if (!player1Data?.puuid) return (
                    <>
                        <p>No encontrado</p>
                        <span>{player1Data?.error}</span>
                    </>
                )
                return (
                    <div className='playerSection'>
                        <UserNav
                            selectedSection={userSection}
                            setSelectedSection={setUserSection}
                            name={player1Data?.name}
                            tag={player1Data?.tag}
                            banner={player1Data?.display?.banner}
                            title={player1Data?.display?.title}
                            level={player1Data?.display?.level}
                            levelBorder={player1Data?.display?.level_border}
                        />
                        {renderInfoByUserSection()}
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <>
            <div className="site">
                <NavBar selectedSection={section} setSelectedSection={setSection} showSearchModal={showSearchModal} setShowSearchModal={setShowSearchModal} />
                {renderMainSection()}
            </div>
            { showSearchModal &&
                <SearchModal loading={playersLoading} handleSubmit={handleSubmit} setShowSearchModal={setShowSearchModal} />
            }
        </>
    )
}

export default App
