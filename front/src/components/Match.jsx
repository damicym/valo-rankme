// import { useEffect, useState } from 'react'

function Match({ data }) {
    return (
        <div className="match">
            <div className="matchResultDetail"></div>
            {/* svg agent */}
            <p>{data?.map}</p>
            {/* <p className="pill">{data?.place}</p> */}
            <div className="matchRank">
                {/* svg rango que tenia antes de jugar esa partida*/}
                <p>{data?.rr}</p>
            </div>
            <div className="matchResult">
                <span>{data?.won ? 'VICTORIA' : 'DERROTA'}</span>
                <p><span>{data?.roundsWon}</span> : <span>{data?.roundsWon}</span></p>
            </div>
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
            <div className="matchField">
                <span>{data?.kills} K // {data?.deaths} D // {data?.assists} A</span>
                <p>{data?.kd} K/D</p>
            </div>
            <div className="matchField">
                <span>ACS</span>
                <p>{data?.acs}</p>
            </div>
            {/* <button> svg abrir partida en tracker </button> */}
        </div>
    )
}

export default Match