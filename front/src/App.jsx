import { useEffect, useState } from 'react'
import { /* getTwoPlayers, */ getOnePlayer, getDBModes, getDBSeasons, getPlainUser } from './libs/db/queries.js'
import { fetchAgents } from './libs/utils/agents.js'
import SearchModal from './components/SearchModal.jsx'
import { SECTIONS, USER_SECTIONS } from './config.js'
import './styles/Home.css'
import NavBar from './components/NavBar.jsx'
import MainSection from './components/MainSection.jsx'
import { getAPIStatus } from './libs/api/index.js'

function App() {
    const domixPuuid = '9c10981a-3fc4-5eb4-9a3f-8e3008aeaa20'
    const [agents, setAgents] = useState([])
    const [gameModes, setGameModes] = useState([])
    const [gameSeasons, setGameSeasons] = useState([])
    const [lastSeason, setLastSeason] = useState(null)
    const [APIStatus, setAPIStatus] = useState({})
    const [domixUser, setDomixUser] = useState(null)
    
    const [player1Data, setPlayer1Data] = useState({})
    const [playersLoading, setPlayersLoading] = useState(false)
    const [showSearchModal, setShowSearchModal] = useState(false)

    const [section, setSection] = useState(SECTIONS.HOME)
    const [userSection, setUserSection] = useState(USER_SECTIONS.PARTIDAS)
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
            return previousMatchesCount >= nextMatchesCount ? 'No new matches' : 'Data updated'
        } catch (error) {
            setPlayer1Data({ puuid: null, error: error.message })
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
        const domixUserData = await getPlainUser(domixPuuid)
        setLastSeason(lastSeason)
        setGameModes(modesData)
        setGameSeasons(seasonsData)
        setDomixUser(domixUserData)
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

    const isUserFormat = (str) => {
        const regex = /^[^#]+#[^#]+$/
        return regex.test(str)
    }

    const handleSearch = async (formData) => {
        let p1 = formData.get('playerInput')
        if (!p1) return
        if (!isUserFormat(p1)) {
            return 'El formato debe ser nombre#tag'
        }
        setPlayersLoading(true)

        try{
            await processPlayer(p1)
        } catch (error) {
            setPlayer1Data({ puuid: null, error: error.message })
        }

        setPlayersLoading(false)
        setShowSearchModal(false)
        setSection(SECTIONS.PLAYER)
        return null
    }

    const processPlayer = async(p1, options = {}) => {
        if (!p1) return
        const { force = false } = options
        const [name, tag] = p1.split("#").map(part => part.trim())
        setSelectedSeason(null)

        if (!force && name === player1Data?.name && tag === player1Data?.tag) {
            setUserSection(USER_SECTIONS.PARTIDAS)
            const matchesByMode = player1Data?.matches?.reduce((acc, match) => {
                if (!acc.has(match.mode_id)) {
                    acc.set(match.mode_id, 1)
                } else {
                    acc.set(match.mode_id, acc.get(match.mode_id) + 1)
                }
                return acc
            }, new Map())
            const mostPlayedMode = matchesByMode && matchesByMode.size > 0 ? Array.from(matchesByMode.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] : null
            setSelectedMode(mostPlayedMode)
            return player1Data
        }

        const data = await getOnePlayer(p1)
        if (data?.player1?.puuid && !data?.player1?.error) {
            setPlayer1Data(data.player1)
            const matchesByMode = player1Data?.matches?.reduce((acc, match) => {
                if (!acc.has(match.mode_id)) {
                    acc.set(match.mode_id, 1)
                } else {
                    acc.set(match.mode_id, acc.get(match.mode_id) + 1)
                }
                return acc
            }, new Map())
            const mostPlayedMode = matchesByMode && matchesByMode.size > 0 ? Array.from(matchesByMode.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] : null
            setSelectedMode(mostPlayedMode)
            return data.player1
        } else {
            throw new Error(data?.player1?.error || 'Error al obtener datos del jugador')
        }
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
                <NavBar domixUser={domixUser} selectedSection={section} setSelectedSection={setSection} showSearchModal={showSearchModal} setShowSearchModal={setShowSearchModal} />
                <MainSection
                    setSelectedSection={setSection}
                    domixUser={domixUser}
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
                <SearchModal domixUser={domixUser} loading={playersLoading} handleSearch={handleSearch} setShowSearchModal={setShowSearchModal} />
            }
        </>
    )
}

export default App
