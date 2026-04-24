import PlayerRank from './PlayerRank.jsx'
import Filters from './Filters.jsx'
import MatchList from './MatchList.jsx'
import PerformanceSummary from './PerformanceSummary.jsx'
import RankList from './RankList.jsx'
import { USER_SECTIONS } from '../config.js'

function InfoByUserSection({ userSection, player1Data, selectedMode, setSelectedMode, selectedSeason, setSelectedSeason, selectedRankInfo, filteredMatches, gameModes, gameSeasons, agents, lastSeason }) {
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

export default InfoByUserSection
