import { Fragment } from 'react'
import Match from './Match.jsx'
import { getPerformanceSummary } from '../libs/utils/match_helpers.js'
import '../styles/MatchList.css'

function MatchList({ matches, selectedMode, selectedModeName, selectedSeason, selectedSeasonName, agents = [] }) {
    let matchesByDay = {}
    matches?.filter((m) => m.mode_id === selectedMode && (selectedSeason === null || m.season_id === selectedSeason))
        ?.forEach(m => {
            const date = new Date(m.started_at)
            const month = new Intl.DateTimeFormat('en-EN', { month: 'long' }).format(date)
            const day = `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getDate()}`
            if (!matchesByDay[day]) matchesByDay[day] = []
            matchesByDay[day].push(m)
        })
    Object.entries(matchesByDay).forEach(([day, dayMatches]) => {
        const perf = getPerformanceSummary(dayMatches)
        matchesByDay[day] = { dayMatches, perf }
    })

    return (
        <section className="matchList">
            {Object.entries(matchesByDay).map(([day, { dayMatches, perf }], index) => (
                <Fragment key={`${day}-${index}`}>
                    <div className="matchDay">
                        <div className='side left'>
                            <div className='date'>
                                <p>{day}</p>
                                <div className='pill'>{perf.matches_played}</div>
                            </div>
                        </div>
                        <p className="resultField">
                            <span
                                style={{color: 'var(--green)'}}
                            >
                                {perf.wins} W
                            </span>
                            <span style={{textAlign: 'center', width: '18px'}}> - </span>
                            <span
                                style={{color: 'var(--red)'}}
                            >
                                {perf.losses} L
                            </span>
                        </p>
                        <div className="side right">
                            <section className='pillContainer'></section>
                            <div className="matchField statField kdField">
                                <span className="kda">{perf.kills} <span style={{ opacity: 0.6 }}>/{' '}</span> {perf.deaths} <span style={{ opacity: 0.6 }}>/{' '}</span> {perf.assists}</span>
                                <p style={{ color: 'var(--text)' }}>{perf.avg_kd} K/D</p>
                            </div>
                            { perf.avg_ddr !== null &&
                                <div className="matchField statField">
                                    <span>DDΔ</span>
                                    <p style={{ color: 'var(--text)' }}>{perf.avg_ddr}</p>
                                </div>
                            }
                            { perf.avg_hs_perc !== null &&
                                <div className="matchField statField">
                                    <span>HS%</span>
                                    <p style={{ color: 'var(--text)' }}>{perf.avg_hs_perc}</p>
                                </div>
                            }
                            <div className="matchField statField">
                                <span>ACS</span>
                                <p style={{ color: 'var(--text)' }}>{perf.avg_acs}</p>
                            </div>
                        </div>
                    </div>
                    <div className="matches">
                        {
                            dayMatches?.map((m, index) => <Match key={m.started_at} index={index} data={m} agents={agents}></Match>)
                        }
                    </div>
                </Fragment>
            ))}
            <span style={{marginBlock: '4px', color: 'var(--textT)'}}>No hay más resultados en el modo {selectedModeName} {selectedSeason !== null && `y temporada ${selectedSeasonName}`}</span>
        </section>
    )
}

export default MatchList