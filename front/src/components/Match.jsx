// import { useEffect, useState } from 'react'
import agents from '../data/agents.json'
import ranks from '../data/ranks.json'

function Match({ data }) {
    return (
        <div 
            className="match"
            style={data?.won ? { borderColor: 'var(--green)', backgroundColor: 'rgba(39, 163, 0, 0.25)' } : { borderColor: 'auto', backgroundColor: 'auto' }}
        >
            <div 
                className="matchColorDetail"
                style={data?.won ? { backgroundColor: 'var(--green)', filter: 'drop-shadow(0px 0px 10px var(--green))' } : { backgroundColor: 'var(--red)' }}
            ></div>
            <div className="leftSide">
                <img className='agentIcon' src={agents.find(a => a.name === data.agent).icon} alt={`${data.agent}-icon`}/>
                <p>{data?.map}</p>
                {/* <p className="pill place">{data?.place}</p> */}
                <div className="matchField rankField">
                    <img className='rankIcon' src={ranks.find(r => r.tier == 23).icon} alt={/* poner bien */`23-icon`}/>
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
                    <span>{data?.kills}K//{data?.deaths}D//{data?.assists}A</span>
                    <p>{data?.kd} K/D</p>
                </div>
                <div className="matchField statField">
                    <span>ACS</span>
                    <p>{data?.acs}</p>
                </div>
                {/* <button> svg abrir partida en tracker (talvez afuera del match, como el de replay)</button> */}
                </div>
        </div>
    )
}

export default Match