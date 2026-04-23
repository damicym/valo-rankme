import { useState } from "react"
import ContextMenu from "./ContextMenu"
import '../styles/Filters.css'

function Filters({ ranksInfo, displayModes, selectedMode, setSelectedMode, selectedSeason, setSelectedSeason, matches, gameModes, gameSeasons }) {
    const modeIds = Array.from(new Set(matches?.map(m => m.mode_id)))
        .sort((a, b) => 
            ranksInfo?.find(r => r.mode_id === a)?.matches_played + ranksInfo?.find(r => r.mode_id === b)?.matches_played
        )
    const seasonIds = Array.from(new Set(matches?.map(m => m.season_id)))
    const modes = modeIds.map(id => ({id, name: gameModes?.find(m => m.id === id)?.name || id}))
    const seasons = seasonIds.map(id => ({id, name: gameSeasons?.find(s => s.id === id)?.name || id}))

    const [mainModes, setMainModes] = useState(modes.slice(0, 3))
    const [mainSeasons, setMainSeasons] = useState(seasons.slice(0, 1))
    const [secondaryModes, setSecondaryModes] = useState(modes.slice(3))
    const [secondarySeasons, setSecondarySeasons] = useState(seasons.slice(1))

    const [showModeCtxMenu, setShowModeCtxMenu] = useState(false)
    const [showSeasonCtxMenu, setShowSeasonCtxMenu] = useState(false)

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
                                    onClick={() => setSelectedMode(m.id)}
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
                            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M11 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M11 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>
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
                    <button
                        className={selectedSeason === null ? 'filterBtn active' : 'filterBtn'} id="allSeasonsBtn" key="allSeasonsBtn" onClick={() => setSelectedSeason(null)}
                    >
                        All seasons
                    </button>
                    {
                        mainSeasons.filter(Boolean).map(s =>
                            <button 
                                className={selectedSeason === s.id ? 'filterBtn active' : 'filterBtn'} 
                                id={s.id} 
                                key={s.id} 
                                onClick={() => setSelectedSeason(s.id)}
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
                        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M11 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M11 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>
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
