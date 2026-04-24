import UserNav from './UserNav.jsx'
import HomeSection from './HomeSection.jsx'
import InfoByUserSection from './InfoByUserSection.jsx'
import { SECTIONS } from '../config.js'

function MainSection({ section, userSection, setUserSection, player1Data, selectedMode, setSelectedMode, selectedSeason, setSelectedSeason, selectedRankInfo, filteredMatches, gameModes, gameSeasons, agents, lastSeason, APIStatus, reloadData, setShowSearchModal }) {
    switch (section) {
        case SECTIONS.HOME:
            return <HomeSection setShowSearchModal={setShowSearchModal} />
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
                        lastUpdated={player1Data?.last_updated}
                        nextUpdate={player1Data?.next_update}
                        serverOnline={APIStatus?.online}
                        reloadData={reloadData}
                    />
                    <InfoByUserSection
                        userSection={userSection}
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
                    />
                </div>
            )
        default:
            return null
    }
}

export default MainSection
