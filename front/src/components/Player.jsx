// import { useEffect, useState } from 'react'
import Match from "./Match"
import ranks from '../data/ranks.json'
import shields from '../data/shields.json'

function PlayerRank({ data, /* isMain */ }) { 

    return (
            <div className="playerRank" /* style={{transform: !isMain ? 'scale(0.85)' : 'scale(1)', marginBottom: !isMain ? '5px' : '0'}} */>
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
                                    ? {borderRadius: '4px 0 0 4px', width: `${data?.rankInfo?.rr / 100 * 312}px`}
                                    : {borderRadius: '4px 4px 4px 4px', width: '312px'}
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
    )
}

export default PlayerRank