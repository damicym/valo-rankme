import { useEffect, useState } from 'react'
import { /* getTwoPlayers, */ getOnePlayer, getDBModes, getDBSeasons } from './libs/db/queries.js'
import { fetchAgents } from './libs/utils/agents.js'
import SearchModal from './components/SearchModal.jsx'
import { SECTIONS, USER_SECTIONS } from './config.js'
import './styles/Home.css'
import NavBar from './components/NavBar.jsx'
import MainSection from './components/MainSection.jsx'
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

    return (
        <>
            <div className="site">
                <NavBar selectedSection={section} setSelectedSection={setSection} showSearchModal={showSearchModal} setShowSearchModal={setShowSearchModal} />
                <MainSection
                    section={section}
                    userSection={userSection}
                    setUserSection={setUserSection}
                    player1Data={player1Data}
                    selectedMode={selectedMode}
                    setSelectedMode={setSelectedMode}
                    selectedSeason={selectedSeason}
                    setSelectedSeason={setSelectedSeason}
                    selectedRankInfo={selectedRankInfo}
                    filteredMatches={filteredMatches}
                    gameModes={gameModes}
                    gameSeasons={gameSeasons}
                    agents={agents}
                    lastSeason={lastSeason}
                    APIStatus={APIStatus}
                    reloadData={reloadData}
                    setShowSearchModal={setShowSearchModal}
                />
            </div>
            { showSearchModal &&
                <SearchModal loading={playersLoading} handleSubmit={handleSubmit} setShowSearchModal={setShowSearchModal} />
            }
        </>
    )
}

export default App
