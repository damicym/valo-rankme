import { useEffect, useMemo, useState } from "react"
import ContextMenu from "./ContextMenu"
import '../styles/Filters.css'

function Filters({ displayModes, selectedMode, setSelectedMode, selectedSeason, setSelectedSeason, matches, gameModes, gameSeasons }) {
    const modeIds = useMemo(() => {
        const matchesByMode = matches?.reduce((acc, match) => {
            if (!acc.has(match.mode_id)) {
                acc.set(match.mode_id, 1)
            } else {
                acc.set(match.mode_id, acc.get(match.mode_id) + 1)
            }
            return acc
        }, new Map())
        return Array.from(new Set((matches ?? []).map(m => m.mode_id)))
            .sort((a, b) => (matchesByMode.get(b) ?? 0) - (matchesByMode.get(a) ?? 0))
    }, [matches])
    const seasonIds = useMemo(() => {
        return Array.from(new Set((matches ?? []).map(m => m.season_id)))
    }, [matches])
    const modes = useMemo(() => {
        return modeIds.map(id => ({id, name: gameModes?.find(m => m.id === id)?.name || id}))
    }, [modeIds, gameModes])
    const seasons = useMemo(() => {
        return seasonIds.map(id => ({id, name: gameSeasons?.find(s => s.id === id)?.name || id}))
    }, [seasonIds, gameSeasons])

    const [mainModes, setMainModes] = useState(modes.slice(0, 3))
    const [mainSeasons, setMainSeasons] = useState(seasons.slice(0, 1))
    const [secondaryModes, setSecondaryModes] = useState(modes.slice(3))
    const [secondarySeasons, setSecondarySeasons] = useState(seasons.slice(1))

    const [showModeCtxMenu, setShowModeCtxMenu] = useState(false)
    const [showSeasonCtxMenu, setShowSeasonCtxMenu] = useState(false)

    useEffect(() => {
        setMainModes(modes.slice(0, 3))
        setSecondaryModes(modes.slice(3))
    }, [modes])

    useEffect(() => {
        if (!displayModes || typeof setSelectedMode !== 'function') return
        if (!modeIds.length) {
            if (selectedMode !== null) setSelectedMode(null)
            return
        }

        if (selectedMode === null || !modeIds.includes(selectedMode)) {
            setSelectedMode(modeIds[0])
        }
    }, [displayModes, modeIds, selectedMode, setSelectedMode])

    useEffect(() => {
        setMainSeasons(seasons.slice(0, 1))
        setSecondarySeasons(seasons.slice(1))
    }, [seasons])

    useEffect(() => {
        if (typeof setSelectedSeason !== 'function') return
        if (selectedSeason !== null && !seasonIds.includes(selectedSeason)) {
            setSelectedSeason(null)
        }
    }, [seasonIds, selectedSeason, setSelectedSeason])

    const replaceLastMode = (id) => {
        const nextMode = modes.find(m => m.id === id)
        if (!nextMode) return

        const previousLastMode = mainModes[mainModes.length - 1]
        const newMainModes = [...mainModes]
        newMainModes[newMainModes.length - 1] = nextMode
        setMainModes(newMainModes)
        setSecondaryModes(() => {
            let newSecondaryModes = modes.filter(m => !newMainModes.some(mainMode => mainMode.id === m.id))
            if (previousLastMode && !newSecondaryModes.some(m => m.id === previousLastMode.id)) {
                newSecondaryModes.push(previousLastMode)
            }
            return newSecondaryModes
        })
        setSelectedMode(id)
        setShowModeCtxMenu(false)
    }

    const replaceLastSeason = (id) => {
        const nextSeason = seasons.find(s => s.id === id)
        if (!nextSeason) return

        const previousLastSeason = mainSeasons[mainSeasons.length - 1]
        const newMainSeasons = [...mainSeasons]
        newMainSeasons[newMainSeasons.length - 1] = nextSeason
        setMainSeasons(newMainSeasons)
        setSecondarySeasons(() => {
            let newSecondarySeasons = seasons.filter(s => !newMainSeasons.some(mainSeason => mainSeason.id === s.id))
            if (previousLastSeason && !newSecondarySeasons.some(s => s.id === previousLastSeason.id)) {
                newSecondarySeasons.push(previousLastSeason)
            }
            return newSecondarySeasons
        })
        setSelectedSeason(id)
        setShowSeasonCtxMenu(false)
    }

    return (
        <>
            <div className='filters' style={displayModes ? {justifyContent: 'space-between'} : {justifyContent: 'flex-end'}}>
                { displayModes &&
                    <section className='selector left'>
                        {
                            mainModes.filter(Boolean).map(m =>
                                <button 
                                    className={selectedMode === m.id ? 'filterBtn active' : 'filterBtn'} 
                                    id={m.id} 
                                    key={m.id} 
                                    onClick={() => {
                                        setSelectedMode(m.id)
                                        setShowModeCtxMenu(false)
                                        setShowSeasonCtxMenu(false)
                                    }}
                                >
                                    {m.name || m.id}
                                </button>
                            )
                        }
                        <button 
                            className='filterBtn' 
                            style={{flex: '0', borderTopRightRadius: '8px', borderBottomRightRadius: '8px'}} 
                            onClick={() => {
                                setShowModeCtxMenu(!showModeCtxMenu)
                                setShowSeasonCtxMenu(false)
                            }}
                            key={-1}
                        >
                            { !showModeCtxMenu
                                ? <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M11 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M11 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>
                                : <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-x"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
                            }
                        </button>
                        <ContextMenu 
                            show={showModeCtxMenu}
                            elements={secondaryModes}
                            elOnClick={replaceLastMode}
                            msg="No se encontraron partidas con más modos"
                        />
                    </section>
                }
                <section className='selector right'>
                    { displayModes &&
                        <button
                            className={selectedSeason === null ? 'filterBtn active' : 'filterBtn'} id="allSeasonsBtn" key="allSeasonsBtn" onClick={() => {
                                setSelectedSeason(null)
                                setShowSeasonCtxMenu(false)
                            }}
                        >
                            Todos los episodios
                        </button>
                    }
                    {
                        mainSeasons.filter(Boolean).map((s, index) =>
                            <button 
                                className={selectedSeason === s.id || (!displayModes && selectedSeason === null && index === 0) ? 'filterBtn active' : 'filterBtn'} 
                                id={s.id} 
                                key={s.id} 
                                onClick={() => {
                                    if (selectedSeason === s.id || (!displayModes && selectedSeason === null && index === 0)) return
                                    setSelectedSeason(s.id)
                                    setShowSeasonCtxMenu(false)
                                    setShowModeCtxMenu(false)
                                }}
                            >
                                {s.name || s.id}
                            </button>
                        )
                    }
                    <button 
                        className='filterBtn' 
                        style={{flex: '0', borderTopRightRadius: '8px', borderBottomRightRadius: '8px'}} 
                        onClick={() => {
                            setShowSeasonCtxMenu(!showSeasonCtxMenu)
                            setShowModeCtxMenu(false)
                        }}
                        key={-1}
                    >
                        { !showSeasonCtxMenu
                            ? <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M11 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M11 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>
                            : <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-x"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
                        }
                    </button>
                    <ContextMenu 
                        show={showSeasonCtxMenu}
                        elements={secondarySeasons}
                        elOnClick={replaceLastSeason}
                        msg="No se encontraron partidas con más episodios"
                    />
                </section>
            </div>
        </>
    )
}

export default Filters
