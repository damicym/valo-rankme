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

    return (
        <div 
            className="match"
            style={data?.won ? { borderColor: 'var(--green)', backgroundColor: index % 2 === 0 ? 'var(--greenT)' : 'var(--greenT2)' } : { borderColor: 'var(--border)', backgroundColor: index % 2 === 0 ? 'var(--borderT)' : 'var(--borderT2)' }}
        >
            <div 
                className="matchColorDetail"
                style={data?.won ? { backgroundColor: 'var(--green)', filter: 'drop-shadow(0px 0px 10px var(--green))' } : { backgroundColor: 'var(--red)' }}
            ></div>
            <div className="leftSide">
                <img className='agentIcon' src={agents.find(a => a.name === data?.agent)?.icon} alt={`${data?.agent}_agent_icon`}/>
                <p>{data?.map}</p>
                <div className="matchField rankField">
                    <img className='rankIcon' src={ranks.find(r => r.tier == data?.rank)?.icon || ranks.find(r => r.name == 'UNRANKED').icon} alt={`${data?.rank}_rank_icon`}/>
                    <p
                        style={{color: data?.won ? 'var(--green)' : 'var(--red)'}}
                    >{data?.won && '+'}{data?.rr_change}</p>
                </div>
            </div>
            <div className="matchField resultField">
                <span 
                    className="resultTitle"
                    style={{color: data?.won ? 'var(--green)' : 'var(--red)'}}
                >
                    {data?.won ? 'VICTORIA' : 'DERROTA'}
                </span>

                <p className="resultRounds">
                    <span
                        style={{color: data?.won ? 'var(--green)' : 'auto'}}
                    >
                        {data?.roundsWon}
                    </span>
                    <span style={{textAlign: 'center', width: '18px'}}>:</span>
                    <span
                        style={{color: data?.won ? 'auto' : 'var(--red)'}}
                    >
                        {data?.roundsLost}
                    </span>
                </p>

            </div>
            <div className="rightSide">
                <section className="pillContainer">
                    {/* más pills? -> clutches1v1, rondas seguidas sin morir */}
                    <p 
                        className="pill"
                        style={data?.place === 1 ? { borderColor: 'var(--yellow)', color: 'var(--yellow)' } : { borderColor: 'var(--text)', color: 'var(--text)' }}
                    >
                        {data?.place === 1 ? 'MVP' : `${data?.place}${getOrdinalSuffixe(data?.place)}`}
                    </p>
                    { data?.isTeamMVP && data?.place !== 1 &&
                        <p className="pill">Team MVP</p>
                    }
                    { data?.clutches1v2 > 0 &&
                    <span 
                        className="pill multpliablePill" 
                        style={{paddingRight: data?.clutches1v2 === 1 ? '8px' : '0'}}
                    >
                        1v2 Clutch
                    { data?.clutches1v2 > 1 &&
                        <span className="pillMultiplier">x{data?.clutches1v2}</span>
                    }
                    </span>
                    }
                </section>
                <div className="matchField statField">
                    <span className='kda'>{data?.kills} <span style={{opacity: 0.6}}>/</span> {data?.deaths} <span style={{opacity: 0.6}}>/</span> {data?.assists}</span>
                    <p style={{color: data?.kd < 1 ? 'var(--red)' : data?.kd < 1.8 ? 'var(--text)' : 'var(--yellow)'}}>{data?.kd} K/D</p>
                </div>
                <div className="matchField statField">
                    <span>ACS</span>
                    <p style={{color: data?.acs < 120 ? 'var(--red)' : data?.acs < 240 ? 'var(--text)' : 'var(--yellow)'}}>{data?.acs}</p>
                </div>
                </div>
        </div>
    )
}

export default Match