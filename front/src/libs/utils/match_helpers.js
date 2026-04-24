export function getPerformanceSummary(matches) {
    const perf = matches.reduce((acc, match) => {
        acc.matches_played += 1
        acc.playtime += match.playtime ?? 0
        acc.wins += match.won ? 1 : 0
        acc.losses += match.won ? 0 : 1
        acc.aces += match.aces ?? 0
        acc.clutches_1v2 += match.clutches_1v2 ?? 0
        acc.is_team_mvp += match.is_team_mvp && match.place !== 1 ? 1 : 0
        acc.assists += match.assists ?? 0
        acc.deaths += match.deaths ?? 0
        acc.kills += match.kills ?? 0
        if (!acc.agents[match.agent]) {
            acc.agents[match.agent] = 1
        } else {
            acc.agents[match.agent] += 1
        }
        acc.mvps += match.place === 1 ? 1 : 0
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
        mvps: 0,
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

        if (!matches.some(m => m.ddr !== null)) perf.avg_ddr = null
        if (!matches.some(m => m.hs_perc !== null)) perf.avg_hs_perc = null
        if (!matches.some(m => m.playtime !== null)) perf.playtime = null
        if (!matches.some(m => m.aces !== null)) perf.aces = null
    }
    return perf
}

export function getOrdinalSuffixe(n){
    return n === 1 ? 
    'st' : n === 2 ? 
    'nd' : n === 3 ? 
    'rd' : n > 3 ? 
    'th' : ''
}

export function getTimeBetweenNow(date){
    const now = new Date()
    const timeBetween = now - date
    const suffixes = ['s', 'm', 'h', 'd', 'w', 'mo', 'y']
    const thresholds = [60000, 3600000, 86400000, 604800000, 2592000000, 31536000000]
    let unitsAgo
    let suffix
    for (let i = 0; i < thresholds.length; i++) {
        if (timeBetween < thresholds[i]) {
            unitsAgo = Math.floor(timeBetween / (i === 0 ? 1000 : thresholds[i - 1]))
            suffix = suffixes[i]
            break
        }
    }

    return unitsAgo > 0 
    ? `${unitsAgo}${suffix} ago` 
    : unitsAgo > 0 
        ? `in ${unitsAgo}${suffix}` 
        : 'just now'
}