// import { useEffect, useState } from 'react'
import Match from "./Match"
import ranks from '../data/ranks.json'
import shields from '../data/shields.json'

function Player({ data }) {

    return (
        <div className="player" key={data?.user}>
            <div className="playerInfo">
                <p className="user">{data?.user?.split('#')[0]}<span>#{data?.user?.split('#')[1]}</span></p>
                <img className='rankIcon' src={ranks.find(r => r.tier == data?.rankInfo?.rank)?.icon || ranks.find(r => r.name == 'UNRANKED').icon} alt={`${data?.rankInfo?.rank}_rank_icon`}/>
                <p className="rankTitle" style={{color: ranks.find(r => r.tier == data?.rankInfo?.rank)?.color}}>{ranks.find(r => r.tier == data?.rankInfo?.rank)?.es_name}</p>
                <div className="rankProgress">
                    <div className="progressBarContainer">
                        { data?.rankInfo?.shield > 0 &&
                            <img className="shield" src={shields.find(s => s.level == data?.rankInfo?.shield)?.icon} alt={`${data?.rankInfo?.shield}_shield_icon`}/>
                        }
                        <div className="progressBar">
                            <div 
                                className="progressBarInner" 
                                style={ data?.rankInfo?.rank < 21 
                                    ? {borderRadius: '3px 0 0 3px', width: `${data?.rankInfo?.rr / 100 * 312}px`}
                                    : {borderRadius: '3px 3px 3px 3px', width: '312px'}
                                }
                            ></div>
                        </div>
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