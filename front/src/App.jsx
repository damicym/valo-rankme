import { useEffect, useState } from 'react'
import { /* getTwoPlayers, */ getOnePlayer, getDBModes, getDBSeasons } from './libs/db/queries.js'
import { fetchAgents } from './libs/utils/agents.js'
import PlayerRank from './components/PlayerRank.jsx'
import Filters from './components/Filters.jsx'
import MatchList from './components/MatchList.jsx'
import PerformanceSummary from './components/PerformanceSummary.jsx'
import UserNav from './components/UserNav.jsx'
import SearchModal from './components/SearchModal.jsx'
import { SECTIONS, USER_SECTIONS } from './config.js'
import './styles/Home.css'
import ranks from './data/ranks.json'
import NavBar from './components/NavBar.jsx'
import RankList from './components/RankList.jsx'
import { getAPIStatus } from './libs/api/index.js'

function App() {
    const [agents, setAgents] = useState([])
    const [gameModes, setGameModes] = useState([])
    const [gameSeasons, setGameSeasons] = useState([])
    const [lastSeason, setLastSeason] = useState(null)
    const [APIStatus, setAPIStatus] = useState({})
    
    const [player1Data, setPlayer1Data] = useState({})
    const [playersLoading, setPlayersLoading] = useState(false)
    const [showSearchModal, setShowSearchModal] = useState(false)

    const [section, setSection] = useState(SECTIONS.HOME)
    const [userSection, setUserSection] = useState(USER_SECTIONS.MATCHES)
    const [selectedMode, setSelectedMode] = useState(null)
    const [selectedSeason, setSelectedSeason] = useState(null)

    const reloadData = async () => {
        await checkAPIStatus()
        await fetchDBData()
        const playerId = `${player1Data?.name}#${player1Data?.tag}`
        const previousMatchesCount = player1Data?.matches?.length || 0

        if (!player1Data?.name || !player1Data?.tag) {
            return 'No player selected'
        }

        try{
            const updatedPlayer = await processPlayer(playerId, { force: true })
            const nextMatchesCount = updatedPlayer?.matches?.length ?? previousMatchesCount
            return previousMatchesCount === nextMatchesCount ? 'No new matches' : 'Data updated'
        } catch (error) {
            setPlayer1Data(prev => ({ ...(prev || {}), error: error.message || 'Error al obtener datos del jugador' }))
            return 'Error updating data'
        }
    }

    const checkAPIStatus = async () => {
        const isOnline = await getAPIStatus()
        setAPIStatus({
            online: isOnline,
            lastChecked: new Date()
        })
    }

    const fetchDBData = async () => {
        const modesData = await getDBModes()
        const seasonsData = await getDBSeasons()
        const lastSeason = seasonsData[0]?.id || null
        setLastSeason(lastSeason)
        setGameModes(modesData)
        setGameSeasons(seasonsData)
    }

    useEffect(() => {
        checkAPIStatus()
        fetchDBData()
        fetchAgents().then(setAgents).catch(console.error)
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

    const processPlayer = async(p1, options = {}) => {
        if (!p1) return
        const { force = false } = options
        const [name, tag] = p1.split('#')
        setSelectedSeason(null)
        setUserSection(USER_SECTIONS.MATCHES)

        if (!force && name === player1Data?.name && tag === player1Data?.tag) {
            setSelectedMode(player1Data?.ranksInfo[0]?.mode_id || null)
            return player1Data
        }

        const data = await getOnePlayer(p1)
        setPlayer1Data({})
        if (data?.player1?.puuid) {
            setPlayer1Data(data.player1)
            setSelectedMode(data.player1?.ranksInfo[0]?.mode_id || null)
            return data.player1
        }

        return null
    }

    const selectedRankInfo = player1Data?.ranksInfo?.find(
        r => r.mode_id === selectedMode && (selectedSeason === null ? r.season_id === lastSeason : r.season_id === selectedSeason)
    )
    const filteredMatches = player1Data?.matches?.filter(
        m => m.mode_id === selectedMode && (selectedSeason === null || m.season_id === selectedSeason)
    )

    const renderHome = () => (
        <div className='home'>
            <div className='home__ranks-bg' aria-hidden='true'>
                {[3,6,9,12,15,17,18,21,24].map(tier => {
                    const rank = ranks.find(r => r.tier == tier)
                    return rank ? <img key={tier} src={rank.icon} alt='' className='home__rank-icon' /> : null
                })}
            </div>
            <div className='home__content'>
                <div className='home__badge'>VALORANT TRACKER</div>
                <h1 className='home__title'>
                    Conocé tu<br />
                    <span className='home__title--accent'>rendimiento</span>
                </h1>
                <p className='home__subtitle'>
                    Buscá cualquier jugador y explorá su historial de partidas, rangos por temporada y estadísticas competitivas.
                </p>
                <button className='btn home__cta' onClick={() => setShowSearchModal(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                    Buscar jugador
                </button>
            </div>
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
                            <PerformanceSummary matches={filteredMatches} agents={agents} />
                            <MatchList
                                matches={player1Data?.matches}
                                selectedMode={selectedMode}
                                selectedModeName={gameModes.find(m => m.id === selectedMode)?.name}
                                selectedSeason={selectedSeason}
                                selectedSeasonName={gameSeasons.find(s => s.id === selectedSeason)?.name}
                                agents={agents}
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
                if (!player1Data?.puuid || player1Data?.error) return (
                    <>
                        { !player1Data?.puuid &&
                            <p>No encontrado</p>
                        }
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
                            lastUpdated={player1Data?.lastUpdated}
                            nextUpdate={player1Data?.nextUpdate}
                            serverOnline={APIStatus?.online}
                            reloadData={reloadData}
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
