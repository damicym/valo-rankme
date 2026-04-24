import '../styles/PerformanceSummary.css'
import { getPerformanceSummary } from '../libs/utils/match_helpers.js'

function PerformanceSummary({ matches = [], agents = [] }) {
    const perf = getPerformanceSummary(matches)

    return (
        <section className="perf">
                <div className='perfEl'>
                    <h1>ACS</h1>
                    <h2>{perf.avg_acs}</h2>
                </div>
                <div className='perfEl'>
                    <h1>KD</h1>
                    <h2>{perf.avg_kd}</h2>
                </div>
                <div className='perfEl'>
                    <h1>KDA count</h1>
                    <h2 className='kda'>{perf.kills} <span style={{opacity: 0.6}}>/</span> {perf.deaths} <span style={{opacity: 0.6}}>/</span> {perf.assists}</h2>
                </div>
                { perf.avg_ddr !== null &&
                    <div className='perfEl'>
                        <h1>DDΔ</h1>
                        <h2>{perf.avg_ddr}</h2>
                    </div>
                }
                { perf.avg_hs_perc !== null &&
                    <div className='perfEl'>
                        <h1>HS %</h1>
                        <h2>{perf.avg_hs_perc}</h2>
                    </div>
                }
                { perf.aces !== null &&
                    <div className='perfEl'>
                        <h1>Aces</h1>
                        <h2>{perf.aces}</h2>
                    </div>
                }
                <div className='perfEl'>
                    <h1>MVPs</h1>
                    <h2>{perf.mvps}</h2>
                </div>
                <div className='perfEl'>
                    <h1>Team MVPs</h1>
                    <h2>{perf.is_team_mvp}</h2>
                </div>
                <div className='perfEl'>
                    <h1>Clutches 1v2</h1>
                    <h2>{perf.clutches_1v2}</h2>
                </div>
                <div className='perfEl'>
                    <h1>Win %</h1>
                    <h2>{perf.win_perc}%</h2>
                </div>
                <div className='perfEl'>
                    <h1>Matches</h1>
                    <h2>{perf.matches_played}</h2>
                </div>
                <div className='perfEl'>
                    <h1>Wins</h1>
                    <h2>{perf.wins}</h2>
                </div>
                <div className='perfEl'>
                    <h1>Losses</h1>
                    <h2>{perf.losses}</h2>
                </div>
                { perf.playtime !== null &&
                    <div className='perfEl'>
                        <h1>Playtime</h1>
                        <h2>{perf.playtime}</h2>
                    </div>
                }
                <div className='perfEl'>
                    <h1>Average Place</h1>
                    <h2>{perf.avg_place}</h2>
                </div>
                <div className='perfEl'>
                    <h1>Top agent</h1>
                    <img className='agentIcon' src={agents.find(a => a.name === perf.top_agent)?.icon} alt={`${perf.top_agent}_agent_icon`}/>
                </div>
        </section>
    )
}

export default PerformanceSummary
