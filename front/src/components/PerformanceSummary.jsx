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

        if (!acc.agents[match.agent]) {
            acc.agents[match.agent] = 1
        } else {
            acc.agents[match.agent] += 1
        }

        acc.place += match.place ?? 0
        acc.acs += match.acs ?? 0
        acc.kd += match.kd ?? 0
        acc.ddr += match.ddr ?? 0
        acc.hs_perc += match.hs_perc ?? 0
        acc.assists += match.assists ?? 0
        acc.deaths += match.deaths ?? 0
        acc.kills += match.kills ?? 0

        if ((match.rr_change ?? 0) > 0) {
            acc.rr_up += match.rr_change
        }

        if ((match.rr_change ?? 0) < 0) {
            acc.rr_down += match.rr_change
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
        avg_win_perc: 0
    })

    const maxOnedecimal = (value) => Math.round((value + Number.EPSILON) * 10) / 10

    if (perf.matches_played > 0) {
        perf.avg_place = maxOnedecimal(perf.place / perf.matches_played)
        perf.avg_acs = maxOnedecimal(perf.acs / perf.matches_played)
        perf.avg_kd = maxOnedecimal(perf.kd / perf.matches_played)
        perf.avg_ddr = maxOnedecimal(perf.ddr / perf.matches_played)
        perf.avg_hs_perc = maxOnedecimal(perf.hs_perc / perf.matches_played)
        perf.avg_rr_up = maxOnedecimal(perf.rr_up / perf.matches_played)
        perf.avg_rr_down = maxOnedecimal(perf.rr_down / perf.matches_played)
        perf.avg_win_perc = maxOnedecimal((perf.wins / perf.matches_played) * 100)
    }

    const fancyKey = (key) => key.split('_').join(' ').toUpperCase()

    return (
        <div className="performance">
            <section className='mainInfo'>
                {Object.entries(perf).map(([key, value]) => (
                    typeof value === 'string' || typeof value === 'number') && (
                    <div key={key} className="perfEl">
                        <h1>{fancyKey(key)}</h1>
                        <h2>{value}</h2>
                    </div>
                ))}
            </section>
            <section className='secondaryInfo'>

            </section>
        </div>
    )
}

export default PerformanceSummary
