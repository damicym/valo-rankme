import agents from '../data/agents.json'
import '../styles/PerformanceSummary.css'

function PerformanceSummary({ matches = [] }) {
    const perf = matches.reduce((acc, match) => {
        acc.matches_played += 1
        acc.playtime += match.playtime ?? 0
        acc.wins += match.won ? 1 : 0
        acc.losses += match.won ? 0 : 1
        acc.aces += match.aces ?? 0
        acc.clutches_1v2 += match.clutches_1v2 ?? 0
        acc.is_team_mvp += match.is_team_mvp ? 1 : 0
        acc.assists += match.assists ?? 0
        acc.deaths += match.deaths ?? 0
        acc.kills += match.kills ?? 0
        if (!acc.agents[match.agent]) {
            acc.agents[match.agent] = 1
        } else {
            acc.agents[match.agent] += 1
        }

        acc.avg_place += match.place ?? 0
        acc.avg_acs += match.acs ?? 0
        acc.avg_kd += match.kd ?? 0
        acc.avg_ddr += match.ddr ?? 0
        acc.avg_hs_perc += match.hs_perc ?? 0

        if ((match.rr_change ?? 0) > 0) {
            acc.avg_rr_up += match.rr_change
        }

        if ((match.rr_change ?? 0) < 0) {
            acc.avg_rr_down += match.rr_change
        }

        return acc
    }, {
        matches_played: 0,
        playtime: 0,
        aces: 0,
        clutches_1v2: 0,
        is_team_mvp: 0,
        wins: 0,
        losses: 0,
        agents: {},
        assists: 0,
        deaths: 0,
        kills: 0,

        avg_place: 0,
        avg_acs: 0,
        avg_kd: 0,
        avg_ddr: 0,
        avg_hs_perc: 0,
        avg_rr_up: 0,
        avg_rr_down: 0,
        win_perc: 0
    })

    const maxOnedecimal = (value) => Math.round((value + Number.EPSILON) * 10) / 10

    if (perf.matches_played > 0) {
        perf.avg_place = maxOnedecimal(perf.avg_place / perf.matches_played)
        perf.avg_acs = maxOnedecimal(perf.avg_acs / perf.matches_played)
        perf.avg_kd = maxOnedecimal(perf.avg_kd / perf.matches_played)
        perf.avg_ddr = maxOnedecimal(perf.avg_ddr / perf.matches_played)
        perf.avg_hs_perc = maxOnedecimal(perf.avg_hs_perc / perf.matches_played)
        perf.avg_rr_up = maxOnedecimal(perf.avg_rr_up / perf.matches_played)
        perf.avg_rr_down = maxOnedecimal(perf.avg_rr_down / perf.matches_played)
        perf.win_perc = maxOnedecimal((perf.wins / perf.matches_played) * 100)
        perf.top_agent = Object.keys(perf.agents).reduce((a, b) => perf.agents[a] > perf.agents[b] ? a : b)
    }
    // agents: {},
    // avg_rr_up: 0,
    // avg_rr_down: 0,
    return (
        <div className="perf">
                <div className='perfEl'>
                    <h1>Win %</h1>
                    <h2>{perf.win_perc}%</h2>
                </div>
                <div className='perfEl'>
                    <h1>ACS</h1>
                    <h2>{perf.avg_acs}</h2>
                </div>
                <div className='perfEl'>
                    <h1>KD</h1>
                    <h2>{perf.avg_kd}</h2>
                </div>
                <div className='perfEl'>
                    <h1>DDΔ</h1>
                    <h2>{perf.avg_ddr}</h2>
                </div>
                <div className='perfEl'>
                    <h1>HS %</h1>
                    <h2>{perf.avg_hs_perc}</h2>
                </div>
                <div className='perfEl'>
                    <h1>Puesto promedio</h1>
                    <h2>{perf.avg_place}</h2>
                </div>
                <div className='perfEl'>
                    <h1>Partidas</h1>
                    <h2>{perf.matches_played}</h2>
                </div>
                <div className='perfEl'>
                    <h1>Victorias</h1>
                    <h2>{perf.wins}</h2>
                </div>
                <div className='perfEl'>
                    <h1>Derrotas</h1>
                    <h2>{perf.losses}</h2>
                </div>
                <div className='perfEl'>
                    <h1>Tiempo de juego</h1>
                    <h2>{perf.playtime}</h2>
                </div>
                <div className='perfEl'>
                    <h1>Aces</h1>
                    <h2>{perf.aces}</h2>
                </div>
                <div className='perfEl'>
                    <h1>Clutches 1v2</h1>
                    <h2>{perf.clutches_1v2}</h2>
                </div>
                <div className='perfEl'>
                    <h1>Team MVPs</h1>
                    <h2>{perf.is_team_mvp}</h2>
                </div>
                <div className='perfEl'>
                    <h1>KDA total</h1>
                    <h2 className='kda'>{perf.kills} <span style={{opacity: 0.6}}>/</span> {perf.deaths} <span style={{opacity: 0.6}}>/</span> {perf.assists}</h2>
                </div>
                <div className='perfEl'>
                    <h1>TOP Agente</h1>
                    <img className='agentIcon' src={agents.find(a => a.name === perf.top_agent)?.icon} alt={`${perf.top_agent}_agent_icon`}/>
                </div>
            {/* </section> */}
        </div>
    )
}

export default PerformanceSummary
