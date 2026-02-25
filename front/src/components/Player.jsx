// import { useEffect, useState } from 'react'
import Match from "./Match"
import ranks from '../data/ranks.json'

function Player({ data }) {

    return (
        <div className="player" key={data?.user}>
            <div className="playerInfo">
                <p className="user">{data?.user?.split('#')[0]}<span>#{data?.user?.split('#')[1]}</span></p>
                <img className='rankIcon' src={ranks.find(r => r.tier == data?.rankInfo?.rank)?.icon || ranks.find(r => r.name == 'UNRANKED').icon} alt={`${data?.rankInfo?.rank}-icon`}/>
                <p className="rankTitle">{ranks.find(r => r.tier == data?.rankInfo?.rank)?.name}</p>
                <div className="rankProgress">
                    <div className="progressBarContainer">
                        <p className="shield">{data?.rankInfo?.shield}</p>
                        <div style={{backgroundColor: 'var(--green)', height: '8px', width: '320px', borderRadius: '3px'}}></div>
                    </div>
                    <div className="rrContainer">
                        <span>RANK RATING</span>
                        <p className="rr">{data?.rankInfo?.rr}
                            { data?.rankInfo?.rank < 21 &&
                                <span>/100</span>
                            }
                        </p>
                    </div>
                </div>
            </div>
            {/* promedios */}
            <section className="matchContainer">
                {/* fecha */}
                {
                    data?.matches?.map((m, index) => <Match key={m.date} index={index} data={m}></Match>)
                }
            </section>
        </div>
    )
}

export default Player