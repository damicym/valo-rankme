// import { useEffect, useState } from 'react'
import agents from '../data/agents.json'
import ranks from '../data/ranks.json'

function Match({ index, data }) {

    function getOrdinalSuffixe(n){
        return n === 1 ? 
        'st' : n === 2 ? 
        'nd' : n === 3 ? 
        'rd' : n > 3 ? 
        'th' : ''
    }

    function getTimeAgo(date){
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

        return `${unitsAgo}${suffix}`
    }

    return (
        <div 
            className="match"
            style={data?.won ? { borderColor: 'var(--green)', backgroundColor: index % 2 === 0 ? 'var(--greenT)' : 'var(--greenT2)' } : { borderColor: 'var(--border)', backgroundColor: index % 2 === 0 ? 'var(--borderT)' : 'var(--borderT2)' }}
        >
            <div 
                className="matchColorDetail"
                style={data?.won ? { backgroundColor: 'var(--green)', filter: 'drop-shadow(0px 0px 10px var(--green))' } : { backgroundColor: 'var(--red)' }}
            ></div>
            <div className="side left">
                <img className='agentIcon' src={agents.find(a => a.name === data?.agent)?.icon} alt={`${data?.agent}_agent_icon`}/>
                <div className='matchField statField' style={{textAlign: 'left', width: '60px'}}>
                    { data?.started_at &&
                        <span>{getTimeAgo(new Date(data.started_at))} ago</span>
                    }
                    <p className='mapName'>{data?.map?.replace("Skirmish", "Site")}</p>
                </div>
                <div className="matchField rankField">
                    <div className="rankContainer">
                        { data?.rank !== undefined && data?.rank !== null &&
                            <img className='rankIcon' src={ranks.find(r => r.tier == data?.rank)?.icon || ranks.find(r => r.name == 'UNRANKED').icon} alt={`${data?.rank}_rank_icon`}/>
                        }
                        <div className='rankVariation' style={{color: data?.won ? 'var(--green)' : 'var(--red)'}}>
                        { data?.rank_variation !== null && data?.won ?
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-circle-chevron-up"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 13l3 -3l3 3" /><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /></svg>
                            : data?.rank_variation !== null && !data?.won ?
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-circle-chevron-down"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 11l3 3l3 -3" /><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /></svg>
                            : null
                        }
                        </div>
                    </div>
                    <p style={{color: data?.won ? 'var(--green)' : 'var(--red)'}}>
                        {data?.won && data?.rr_change && '+'}{data?.rr_change}
                    </p>
                </div>
            </div>
            <div className="matchField resultField">
                <span 
                    className="resultTitle"
                    style={{color: data?.won ? 'var(--green)' : 'var(--red)'}}
                >
                    {data?.won ? 'VICTORIA' : 'DERROTA'}{/* { data?.match_id } */}
                </span>

                <p className="resultRounds">
                    <span
                        style={{color: data?.won ? 'var(--green)' : 'auto'}}
                    >
                        {data?.rounds_won}
                    </span>
                    <span style={{textAlign: 'center', width: '18px'}}>:</span>
                    <span
                        style={{color: data?.won ? 'auto' : 'var(--red)'}}
                    >
                        {data?.rounds_lost}
                    </span>
                </p>

            </div>
            <div className="side right">
                <section className="pillContainer">
                    {/* más pills? -> clutches1v1, rondas seguidas sin morir */}
                    <p 
                        className="pill"
                        style={data?.place === 1 ? { borderColor: 'var(--yellow)', color: 'var(--yellow)' } : { borderColor: 'var(--text)', color: 'var(--text)' }}
                    >
                        {data?.place === 1 ? 'MVP' : `${data?.place}${getOrdinalSuffixe(data?.place)}`}
                    </p>
                    { data?.is_team_mvp && data?.place !== 1 &&
                        <p className="pill">Team MVP</p>
                    }
                    { data?.clutches_1v2 > 0 &&
                    <span 
                        className="pill multpliablePill" 
                        style={{paddingRight: data?.clutches_1v2 === 1 ? '6px' : '0'}}
                    >
                        1v2 Clutch
                    { data?.clutches_1v2 > 1 &&
                        <span className="pillMultiplier">x{data?.clutches_1v2}</span>
                    }
                    </span>
                    }
                    { data?.aces > 0 &&
                    <span 
                        className="pill multpliablePill" 
                        style={{paddingRight: data?.aces === 1 ? '6px' : '0'}}
                    >
                        ACE
                    { data?.aces > 1 &&
                        <span className="pillMultiplier">x{data?.aces}</span>
                    }
                    </span>
                    }
                </section>
                <div className="matchField statField kdField">
                    <span className='kda'>{data?.kills} <span style={{opacity: 0.6}}>/</span> {data?.deaths} <span style={{opacity: 0.6}}>/</span> {data?.assists}</span>
                    <p style={{color: data?.kd < 1 ? 'var(--red)' : data?.kd < 1.8 ? 'var(--text)' : 'var(--yellow)'}}>{data?.kd} K/D</p>
                </div>
                { data?.ddr !== null &&
                    <div className="matchField statField">
                        <span>DDΔ</span>
                        <p style={{color: data?.ddr < 0 ? 'var(--red)' : data?.ddr < 60 ? 'var(--text)' : 'var(--yellow)'}}>{data?.ddr}</p>
                    </div>
                }
                { data?.hs_perc !== null &&
                    <div className="matchField statField">
                        <span>HS%</span>
                        <p style={{color: data?.hs_perc < 10 ? 'var(--red)' : data?.hs_perc < 40 ? 'var(--text)' : 'var(--yellow)'}}>{data?.hs_perc}</p>
                    </div>
                }
                <div className="matchField statField">
                    <span>ACS</span>
                    <p style={{color: data?.acs < 120 ? 'var(--red)' : data?.acs < 240 ? 'var(--text)' : 'var(--yellow)'}}>{data?.acs}</p>
                </div>
                </div>
        </div>
    )
}

export default Match