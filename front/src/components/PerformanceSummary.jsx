import '../styles/PerformanceSummary.css'
import { getPerformanceSummary } from '../libs/utils/match_helpers.js'

function PerformanceSummary({ matches = [], agents = [] }) {
    const perf = getPerformanceSummary(matches)

    return (
        <section className="perf">
                <div className='perfEl mainEl'>
                    <h1>Matches</h1>
                    <h2>{perf.matches_played}</h2>
                </div>
                <div className='perfEl mainEl'>
                    <h1>{perf.wins}W {perf.losses}L</h1>
                    <h2>{perf.win_perc} Win %</h2>
                </div>
                <div className='perfEl mainEl'>
                    <h1>ACS</h1>
                    <h2>{perf.avg_acs}</h2>
                </div>
                <div className='perfEl mainEl'>
                    <h1 className='kda'>{perf.kills}K <span style={{opacity: 0.6}}>/</span> {perf.deaths}D <span style={{opacity: 0.6}}>/</span> {perf.assists}A</h1>
                    <h2>{perf.avg_kd} K/D</h2>
                </div>
                { perf.avg_ddr !== null &&
                    <div className='perfEl mainEl'>
                        <h1>DDΔ</h1>
                        <h2>{perf.avg_ddr}</h2>
                    </div>
                }
                { perf.avg_hs_perc !== null &&
                    <div className='perfEl mainEl'>
                        <h1>HS %</h1>
                        <h2>{perf.avg_hs_perc}</h2>
                    </div>
                }
                <div className='perfEl'>
                    <h1>Top agent</h1>
                    <img className='agentIcon' src={agents.find(a => a.name === perf.top_agent)?.icon} alt={`${perf.top_agent}_agent_icon`}/>
                </div>
                { perf.playtime !== null &&
                    <div className='perfEl'>
                        <h1>Playtime</h1>
                        <h2>{(perf.playtime / 60 / 60).toFixed(1)} hrs</h2>
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
                    <h1>Average Place</h1>
                    <h2>{perf.avg_place}</h2>
                </div>
                { perf.aces !== null &&
                    <div className='perfEl'>
                        <h1>Aces</h1>
                        <h2>{perf.aces}</h2>
                    </div>
                }
        </section>
    )
}

export default PerformanceSummary
