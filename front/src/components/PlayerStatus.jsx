import { useState, useEffect, useRef, useCallback } from 'react'
import { getTimeBetweenNow } from '../libs/utils/match_helpers.js'
import '../styles/PlayerStatus.css'

function PlayerStatus({ lastUpdated, nextUpdate, serverOnline, reloadData }) { 
    const [loading, setLoading] = useState(false)
    const [fakeLoading, setFakeLoading] = useState(false)
    const [loadingRes, setLoadingRes] = useState(null)
    const [showLoadingRes, setShowLoadingRes] = useState(false)
    const [lastUpdatedTick, setLastUpdatedTick] = useState(0)
    const [nextUpdateTick, setNextUpdateTick] = useState(0)
    const isReloadingRef = useRef(false)
    const hideLoadingResTimeout = useRef(null)
    const clearLoadingResTimeout = useRef(null)
    const timeToNextUpdateRef = useRef(null)

    const clearLoadingResTimers = useCallback(() => {
        if (hideLoadingResTimeout.current) {
            clearTimeout(hideLoadingResTimeout.current)
            hideLoadingResTimeout.current = null
        }
        if (clearLoadingResTimeout.current) {
            clearTimeout(clearLoadingResTimeout.current)
            clearLoadingResTimeout.current = null
        }
    }, [])
    
    const handleReload = useCallback(async (e = null) => {
        e?.stopPropagation()
        if (isReloadingRef.current) return
        isReloadingRef.current = true
        setLoading(true)
        try {
            const res = await reloadData()
            if (res) {
                setLoadingRes(res)
                setShowLoadingRes(true)
                clearLoadingResTimers()
                hideLoadingResTimeout.current = setTimeout(() => {
                    setShowLoadingRes(false)
                }, 3600)
                clearLoadingResTimeout.current = setTimeout(() => {
                    setLoadingRes(null)
                    clearLoadingResTimeout.current = null
                }, 4000)
            }
        } finally {
            setLoading(false)
            isReloadingRef.current = false
        }
    }, [reloadData, clearLoadingResTimers])

    useEffect(() => {
        if (loading) {
            setFakeLoading(true)
        } else {
            const timeout = setTimeout(() => {
                setFakeLoading(false)
            }, 150)
            return () => clearTimeout(timeout)
        }
    }, [loading])

    useEffect(() => {
        if (!lastUpdated || !nextUpdate || !serverOnline) return
        if (fakeLoading || loading) return
        const now = new Date()
        timeToNextUpdateRef.current = new Date(nextUpdate) - now
        if (timeToNextUpdateRef.current <= 0) return
        let timer
        if (timeToNextUpdateRef.current < -5000) {
            handleReload()
        } else {
            timer = setTimeout(() => {
                handleReload()
            }, timeToNextUpdateRef.current + 5 * 1000)
        }
        return () => clearTimeout(timer)
    }, [lastUpdated, nextUpdate, serverOnline, handleReload, fakeLoading, loading])

    useEffect(() => {
        return () => {
            clearLoadingResTimers()
        }
    }, [clearLoadingResTimers])

    useEffect(() => {
        if (!lastUpdated) return

        const interval = setInterval(() => {
            setLastUpdatedTick(tick => tick + 1)
        }, 30000)

        return () => clearInterval(interval)
    }, [lastUpdated])

    useEffect(() => {
        if (timeToNextUpdateRef.current === null || !lastUpdated || !nextUpdate || !serverOnline) return

        const interval = setInterval(() => {
            setNextUpdateTick(tick => tick + 1)
            timeToNextUpdateRef.current--
            if (timeToNextUpdateRef.current < -5000) {
                handleReload()
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [nextUpdate, lastUpdated, serverOnline, handleReload])

    const lastUpdatedText = getTimeBetweenNow(lastUpdated, { tick: lastUpdatedTick, seconds: false })
    const nextUpdateText = getTimeBetweenNow(nextUpdate, { tick: nextUpdateTick, seconds: 'underMinute', admitPast: false })

    return (
        <div className='statusPosition'>
            <div className='statusContainer' style={{pointerEvents: fakeLoading || (showLoadingRes && loadingRes) ? 'none' : 'auto', "--statusColor": serverOnline ? 'var(--green)' : 'var(--red)', "--statusColorSecondary": serverOnline ? '#0D1D2C' : 'var(--text)'}}>
                <div
                    onClick={handleReload}
                    className='status'
                    tabIndex={0}
                    aria-label={`Last updated ${lastUpdatedText}. Next update ${nextUpdateText}`}
                >
                    <div className='iconContainer' style={{opacity: fakeLoading || (showLoadingRes && loadingRes) ? '0.6' : '1'}} >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-reload"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M19.933 13.041a8 8 0 1 1 -9.925 -8.788c3.899 -1 7.935 1.007 9.425 4.747" /><path d="M20 4v5h-5" /></svg>
                    </div>
                    <div className='info' >
                        <span>
                            { !fakeLoading 
                                ? showLoadingRes && loadingRes 
                                    ? loadingRes
                                    : lastUpdated 
                                        ? `Last updated ${lastUpdatedText}`
                                        : 'Click to reload'
                                : `Updating...`
                            }
                        </span>
                    </div>
                    { fakeLoading ?
                        <div 
                            className='progress' 
                            style={{ 
                                backgroundColor: 'var(--borderT2)', 
                                borderRadius: '6px',
                                width: fakeLoading && !loading ? '100%' : '0%',
                                animation: fakeLoading && !loading ? 'none' : 'fakeLoadSubmit 1s cubic-bezier(.3,.8,.3,1) forwards'
                            }}
                        ></div>
                        : showLoadingRes && loadingRes &&
                            <div 
                                className='progress' 
                                style={{ 
                                    backgroundColor: 'var(--borderT2)', 
                                    borderRadius: '6px',
                                    animation: 'loadingResProgress 3.4s linear forwards'
                                }}
                            ></div>
                    }
                </div>
                {/* { loadingRes &&
                    <span className={`msg ${showLoadingRes ? 'msg-enter' : 'msg-exit'}`}>{loadingRes}</span>
                } */}
                <div className='tooltip' role='tooltip' /* style={lastUpdated ? { left: '0', "--arrow-left": '14px'} : { right: '0', "--arrow-right": '14px'}} */>
                    { serverOnline ?
                        <>
                            <span>
                                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-activity-heartbeat">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M3 12h4.5l1.5 -6l4 12l2 -9l1.5 3h4.5" />
                                </svg>
                                Server Online
                            </span>
                            { nextUpdate &&
                                <>
                                    <div className='line'></div>
                                    <span>Next update available {nextUpdateText}</span>
                                </>
                            }
                        </>
                        :
                        <>
                            <span style={{color: 'var(--red)'}}>
                                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-heart-broken">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
                                    <path d="M12 6l-2 4l4 3l-2 4v3" />
                                </svg>
                                Server Offline
                            </span>
                        </>
                    }
                </div>
            </div>
        </div>
    )
}

export default PlayerStatus