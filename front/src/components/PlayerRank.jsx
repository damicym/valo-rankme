// import { useEffect, useState } from 'react'
import ranks from '../data/ranks.json'
import shields from '../data/shields.json'
import '../styles/PlayerRank.css'

function PlayerRank({ rankInfo, user, loading, error }) { 
    const safeRankInfo = rankInfo || { rank: 0, rr: 0, shield: 0 }

    return (
            <div className="playerRank">
                <p className="user">{user.split('#')[0]}<span>#{user.split('#')[1]}</span></p>
                { !loading && !error &&
                    <>
                        <img className='rankIcon' src={ranks.find(r => r.tier == safeRankInfo.rank)?.icon || ranks.find(r => r.name == 'UNRANKED').icon} alt={`${safeRankInfo.rank}_rank_icon`}/>
                        <p 
                            className="rankTitle" style={{color: ranks.find(r => r.tier == safeRankInfo.rank)?.color}}
                        >
                            {ranks.find(r => r.tier == safeRankInfo.rank)?.es_name || ranks.find(r => r.name == 'UNRANKED').es_name}
                        </p>
                    </>
                }
                <div className="rankProgress">
                    <div className="progressBarContainer">
                        { safeRankInfo.shield > 0 && !loading && !error &&
                            <img className="shield" src={shields.find(s => s.level == safeRankInfo.shield)?.icon} alt={`${safeRankInfo.shield}_shield_icon`}/>
                        }
                        <div className="progressBar">
                            <div 
                                className="progressBarInner" 
                                style={ !loading && !error ?
                                    safeRankInfo.rank < 21 
                                        ? { borderRadius: '4px 0 0 4px', width: `${safeRankInfo.rr / 100 * 372}px`, backgroundColor: 'var(--green)', filter: 'drop-shadow(0 0 2px var(--green))' }
                                        : { borderRadius: '4px 4px 4px 4px', width: '372px', backgroundColor: 'var(--green)', filter: 'drop-shadow(0 0 2px var(--green))' }
                                    : !error ?
                                    { width: '372px', animation: 'fakeLoadRRBar 1s cubic-bezier(.3,.8,.3,1) forwards', backgroundColor: 'var(--yellow)', filter: 'drop-shadow(0 0 2px var(--yellow))' }
                                    : { width: '372px', backgroundColor: 'var(--red)', filter: 'drop-shadow(0 0 2px var(--red))' }
                                }
                            ></div>
                        </div>
                    </div>
                    <div className="rrContainer">
                        <span>{!loading && !error ? 'RANK RATING' : !error ? 'Cargando...' : 'Jugador no encontrado'}</span>
                        { !loading && !error &&
                            <p className="rr">{safeRankInfo.rr}
                                { safeRankInfo.rank < 21 &&
                                    <span>/100</span>
                                }
                            </p>
                        }
                    </div>
                </div>
            </div>
    )
}

export default PlayerRank