// import { useEffect, useState } from 'react'
import ranks from '../data/ranks.json'
import shields from '../data/shields.json'
import '../styles/PlayerRank.css'

function PlayerRank({ style, rankInfo, direction = 'vertical', displayModeName = false, displaySeasonName = false, gameMode = null, season = null }) { 
    const safeRankInfo = rankInfo || { rank: 0, rr: 0, shield: 0 }

    return (
            <div className="playerRank" style={style}>
                { displayModeName && displaySeasonName ?
                    <span className='rankNameV2'>{season} // {gameMode}</span>
                    : displayModeName ?
                        <span className='rankNameV2'>{gameMode}</span>
                    : displaySeasonName ?
                        <span className='rankNameV2'>{season}</span>
                    : null
                }
                <div className={`rankHeader ${direction}`}>
                    <img className='rankIcon' src={ranks.find(r => r.tier == safeRankInfo.rank)?.icon || ranks.find(r => r.name == 'UNRANKED').icon} alt={`${safeRankInfo.rank}_rank_icon`}/>
                    <p 
                        className="rankTitle" style={{color: ranks.find(r => r.tier == safeRankInfo.rank)?.color}}
                    >
                        {ranks.find(r => r.tier == safeRankInfo.rank)?.name || ranks.find(r => r.name == 'UNRANKED').es_name}
                    </p>
                </div>
                <div className="rankProgress">
                    {/* { displayName &&
                        <span className='rankName'>{season} // {gameMode}</span>
                    } */}
                    <div className="progressBarContainer">
                        { safeRankInfo.shield > 0 &&
                            <img className="shield" src={shields.find(s => s.level == safeRankInfo.shield)?.icon} alt={`${safeRankInfo.shield}_shield_icon`}/>
                        }
                        <div className="progressBar">
                            <div 
                                className="progressBarInner" 
                                style={ safeRankInfo.rank < 21 
                                    ? { borderRadius: '4px 0 0 4px', width: `${safeRankInfo.rr / 100 * 372}px`, backgroundColor: 'var(--green)', filter: 'drop-shadow(0 0 2px var(--green))' }
                                    : { borderRadius: '4px 4px 4px 4px', width: '372px', backgroundColor: 'var(--green)', filter: 'drop-shadow(0 0 2px var(--green))' }
                                }
                            ></div>
                        </div>
                    </div>
                    <div className="rrContainer">
                        <span>RANK RATING</span>
                        <p className="rr">{safeRankInfo.rr}
                            { safeRankInfo.rank < 21 &&
                                <span>/100</span>
                            }
                        </p>
                    </div>
                </div>
            </div>
    )
}

export default PlayerRank