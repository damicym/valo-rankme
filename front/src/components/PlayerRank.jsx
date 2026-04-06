// import { useEffect, useState } from 'react'
import Match from "./Match"
import ranks from '../data/ranks.json'
import shields from '../data/shields.json'

function PlayerRank({ rankInfo, user }) { 
    return (
            <div className="playerRank">
                <p className="user">{user.split('#')[0]}<span>#{user.split('#')[1]}</span></p>
                { rankInfo &&
                    <>
                        <img className='rankIcon' src={ranks.find(r => r.tier == rankInfo.rank)?.icon || ranks.find(r => r.name == 'UNRANKED').icon} alt={`${rankInfo.rank}_rank_icon`}/>
                        <p 
                            className="rankTitle" style={{color: ranks.find(r => r.tier == rankInfo.rank)?.color}}
                        >
                            {ranks.find(r => r.tier == rankInfo.rank)?.es_name || ranks.find(r => r.name == 'UNRANKED').es_name}
                        </p>
                    </>
                }
                <div className="rankProgress">
                    <div className="progressBarContainer">
                        { rankInfo?.shield > 0 &&
                            <img className="shield" src={shields.find(s => s.level == rankInfo.shield)?.icon} alt={`${rankInfo.shield}_shield_icon`}/>
                        }
                        <div className="progressBar">
                            <div 
                                className="progressBarInner" 
                                style={ rankInfo ?
                                    rankInfo.rank < 21 
                                        ? { borderRadius: '4px 0 0 4px', width: `${rankInfo.rr / 100 * 372}px`, backgroundColor: 'var(--green)', filter: 'drop-shadow(0 0 2px var(--green))' }
                                        : { borderRadius: '4px 4px 4px 4px', width: '372px', backgroundColor: 'var(--green)', filter: 'drop-shadow(0 0 2px var(--green))' }
                                    : { width: '372px', animation: 'fakeLoadRRBar 1s cubic-bezier(.3,.8,.3,1) forwards', backgroundColor: 'var(--yellow)', filter: 'drop-shadow(0 0 2px var(--yellow))' }
                                }
                            ></div>
                        </div>
                    </div>
                    <div className="rrContainer">
                        <span>{rankInfo ? 'RANK RATING' : 'Cargando...'}</span>
                        <p className="rr">{rankInfo?.rr}
                            { rankInfo?.rank < 21 &&
                                <span>/100</span>
                            }
                        </p>
                    </div>
                </div>
            </div>
    )
}

export default PlayerRank