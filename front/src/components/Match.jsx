// import { useEffect, useState } from 'react'

function Match({ data }) {
    return (
        <div 
            className="match"
            style={data?.won ? { borderColor: 'var(--green)', backgroundColor: 'rgba(39, 163, 0, 0.25)' } : { borderColor: 'auto', backgroundColor: 'auto' }}
            // fondo
        >
            <div 
                className="matchColorDetail"
                style={data?.won ? { backgroundColor: 'var(--green)', filter: 'drop-shadow(0px 0px 10px var(--green))' } : { backgroundColor: 'var(--red)' }}
            ></div>
            <div className="leftSide">
                {/* svg agent */}
                <p>{data?.map}</p>
                {/* <p className="pill place">{data?.place}</p> */}
                <div className="matchField rankField">
                    {/* svg rango que tenia antes de jugar esa partida*/}
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

                <p>
                    <span
                        // style={{color: data?.won ? 'var(--green)' : 'auto'}}
                        style={data?.won ? { color: 'var(--green)', fontSize: '1.45rem' } : { color: 'auto', fontSize: 'auto' }}
                    >
                        {data?.roundsWon}
                    </span> : <span
                        // style={{color: data?.won ? 'auto' : 'var(--red)'}}
                        style={!data?.won ? { color: 'var(--red)', fontSize: '1.45rem' } : { color: 'auto', fontSize: 'auto' }}
                    >
                        {data?.roundsLost}
                    </span>
                </p>

            </div>
            <div className="rightSide">
                <section className="pillContainer">
                    {/* más pills? -> clutches1v1, rondas seguidas sin morir */}
                    { data?.clutches1v2 > 0 &&
                        <div className="pill">
                            <p>
                                1v2 Clutch
                            { data?.clutches1v2 > 1 &&
                                <p className="pillMultiplier">x{data?.clutches1v2}</p>
                            }
                            </p>
                        </div>
                    }
                </section>
                <div className="matchField statField">
                    <span>{data?.kills} K // {data?.deaths} D // {data?.assists} A</span>
                    <p>{data?.kd} K/D</p>
                </div>
                <div className="matchField statField">
                    <span>ACS</span>
                    <p>{data?.acs}</p>
                </div>
                {/* <button> svg abrir partida en tracker </button> */}
                </div>
        </div>
    )
}

export default Match