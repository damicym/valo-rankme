import '../styles/PerformanceSummary.css'
import { getPerformanceSummary } from '../libs/utils/match_helpers.js'

function PerformanceSummary({ matches = [], agents = [] }) {
    const perf = getPerformanceSummary(matches)

    return (
        <section className="perf">
                <div className='perfEl mainEl'>
                    <span>Matches</span>
                    <p>{perf.matches_played}</p>
                </div>
                <div className='perfEl mainEl'>
                    <span>{perf.wins}W {perf.losses}L</span>
                    <p>{perf.win_perc} Win %</p>
                </div>
                <div className='perfEl mainEl'>
                    <span>ACS</span>
                    <p>{perf.avg_acs}</p>
                </div> 
                <div className='perfEl mainEl'>
                    <span className='kda'>{perf.kills} <span style={{opacity: 0.6}}>/</span> {perf.deaths} <span style={{opacity: 0.6}}>/</span> {perf.assists}</span>
                    <p>{perf.avg_kd} K/D</p>
                </div>
                { perf.avg_ddr !== null &&
                    <div className='perfEl mainEl'>
                        <span>DDΔ</span>
                        <p>{perf.avg_ddr}</p>
                    </div>
                }
                { perf.avg_hs_perc !== null &&
                    <div className='perfEl mainEl'>
                        <span>HS %</span>
                        <p>{perf.avg_hs_perc}</p>
                    </div>
                }
                <div className='perfEl'>
                    <span>Top agent</span>
                    <img className='agentIcon' src={agents.find(a => a.name === perf.top_agent)?.icon} alt={`${perf.top_agent}_agent_icon`}/>
                </div>
                { perf.playtime !== null &&
                    <div className='perfEl'>
                        <span>Playtime</span>
                        <p>{(perf.playtime / 60 / 60).toFixed(1)} hrs</p>
                    </div>
                }
                <div className='perfEl'>
                    <span>MVPs</span>
                    <p>{perf.mvps}</p>
                </div>
                <div className='perfEl'>
                    <span>Team MVPs</span>
                    <p>{perf.is_team_mvp}</p>
                </div>
                <div className='perfEl'>
                    <span>Average Place</span>
                    <p>{perf.avg_place}</p>
                </div>
                { perf.aces !== null &&
                    <div className='perfEl'>
                        <span>Aces</span>
                        <p>{perf.aces}</p>
                    </div>
                }
        </section>
    )
}

export default PerformanceSummary
