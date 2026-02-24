// import { useEffect, useState } from 'react'
import agents from '../data/agents.json'
import ranks from '../data/ranks.json'

function Match({ data }) {

    // function getOrdinalSuffixe(n){
    //     return n === 1 ? 
    //     'st' : n === 2 ? 
    //     'nd' : n === 3 ? 
    //     'rd' : n > 3 ? 
    //     'th' : ''
    // }

    return (
        <div 
            className="match"
            style={data?.won ? { borderColor: 'var(--green)', backgroundColor: 'var(--greenT)' } : { borderColor: 'var(--border)', backgroundColor: 'var(--borderT)' }}
        >
            <div 
                className="matchColorDetail"
                style={data?.won ? { backgroundColor: 'var(--green)', filter: 'drop-shadow(0px 0px 10px var(--green))' } : { backgroundColor: 'var(--red)' }}
            ></div>
            <div className="leftSide">
                <img className='agentIcon' src={agents.find(a => a.name === data?.agent)?.icon} alt={`${data?.agent}-icon`}/>
                <p>{data?.map}</p>
                <div className="matchField rankField">
                    <img className='rankIcon' src={ranks.find(r => r.tier == data?.rank)?.icon} alt={`${data?.rank}-icon`}/>
                    <p
                        style={{color: data?.won ? 'var(--green)' : 'var(--red)'}}
                    >{data?.won && '+'}{data?.rr}</p>
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
                    <span>&nbsp;:&nbsp;</span>
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
                    {/* <p className="pill placePill">{data?.place}{getOrdinalSuffixe(data?.place)}</p> */}
                    { data?.clutches1v2 > 0 &&
                    <span 
                        className="pill" 
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
                    <span>{data?.kills}/{data?.deaths}/{data?.assists}</span>
                    <p>{data?.kd} K/D</p>
                </div>
                <div className="matchField statField">
                    <span>ACS</span>
                    <p>{data?.acs}</p>
                </div>
                </div>
        </div>
    )
}

export default Match