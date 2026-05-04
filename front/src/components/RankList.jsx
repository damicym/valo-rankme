import '../styles/RankList.css'
import PlayerRank from './PlayerRank'

function RankList({ ranksInfo, gameModes, selectedSeason, lastSeason }) { 
    const usingRanks = ranksInfo.filter(r => r.season_id === selectedSeason || (!selectedSeason && r.season_id === lastSeason))

    return (
        <div className='rankList'>
            {
                usingRanks.map((r, i) => (
                    <div key={i} className='rankItem'>
                        <PlayerRank 
                            rankInfo={r}
                            displayModeName={true}
                            gameMode={gameModes.find(m => m.id === r.mode_id)?.name || r.mode_id}
                            direction='horizontal'
                        />
                    </div>
                ))
            }
        </div>
    )
}

export default RankList