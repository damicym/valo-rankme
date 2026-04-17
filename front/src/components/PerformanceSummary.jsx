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

        acc.avg_place += match.place ?? 0
        acc.avg_acs += match.acs ?? 0
        acc.avg_kd += match.kd ?? 0
        acc.avg_ddr += match.ddr ?? 0
        acc.avg_hs_perc += match.hs_perc ?? 0
        acc.avg_assists += match.assists ?? 0
        acc.avg_deaths += match.deaths ?? 0
        acc.avg_kills += match.kills ?? 0

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
        avg_place: 0,
        avg_acs: 0,
        avg_kd: 0,
        avg_ddr: 0,
        avg_hs_perc: 0,
        avg_assists: 0,
        avg_deaths: 0,
        avg_kills: 0,
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
        perf.avg_assists = maxOnedecimal(perf.avg_assists / perf.matches_played)
        perf.avg_deaths = maxOnedecimal(perf.avg_deaths / perf.matches_played)
        perf.avg_kills = maxOnedecimal(perf.avg_kills / perf.matches_played)
        perf.avg_rr_up = maxOnedecimal(perf.avg_rr_up / perf.matches_played)
        perf.avg_rr_down = maxOnedecimal(perf.avg_rr_down / perf.matches_played)
        perf.win_perc = maxOnedecimal((perf.wins / perf.matches_played) * 100)
    }

    return (
        <section>
        </section>
    )
}

export default PerformanceSummary
