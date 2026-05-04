import UserNav from './UserNav.jsx'
import HomeSection from './HomeSection.jsx'
import InfoByUserSection from './InfoByUserSection.jsx'
import { SECTIONS } from '../config.js'

function MainSection({ setSelectedSection, domixUser, section, userSection, setUserSection, player1Data, selectedMode, setSelectedMode, selectedSeason, setSelectedSeason, selectedRankInfo, filteredMatches, gameModes, gameSeasons, agents, lastSeason, APIStatus, reloadData, setShowSearchModal }) {
    switch (section) {
        case SECTIONS.HOME:
            return <HomeSection setShowSearchModal={setShowSearchModal} />
        case SECTIONS.PLAYER:
            if (!player1Data?.puuid || player1Data?.error) return (
                <div className='noPlayerFound'>
                    <h1 className='mainTitle'>
                        No se encontró el jugador
                        { player1Data?.error &&
                            <span className='error'>{player1Data.error.replace(/^Error:\s*/i, '')}</span>
                        }
                    </h1>
                    <p className='subtitle'>
                        Asegurate de escribir el nombre y tag correctamente, por ejemplo: <strong>{domixUser}</strong>.
                        <br />
                        Si el problema persiste, probá con otro jugador o intentalo más tarde.
                    </p>
                    <section className='btnList'>
                        <div className='btnContainer'>
                            <button className='btn mainBtn shining' onClick={() => setShowSearchModal(true)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                                Buscar jugador
                            </button>
                        </div>
                        <div className='btnContainer'>
                            <button className='btn secondaryBtn' onClick={() => setSelectedSection(SECTIONS.HOME)}>
                                Volver al inicio
                            </button>
                        </div>
                    </section>
                </div>
            )
            return (
                <div className='playerSection'>
                    <UserNav
                        selectedSection={userSection}
                        setSelectedSection={setUserSection}
                        name={player1Data?.name}
                        tag={player1Data?.tag}
                        banner={player1Data?.display?.banner}
                        title={player1Data?.display?.title}
                        level={player1Data?.display?.level}
                        levelBorder={player1Data?.display?.level_border}
                        lastUpdated={player1Data?.last_updated}
                        nextUpdate={player1Data?.next_update}
                        serverOnline={APIStatus?.online}
                        reloadData={reloadData}
                    />
                    <InfoByUserSection
                        userSection={userSection}
                        player1Data={player1Data}
                        selectedMode={selectedMode}
                        setSelectedMode={setSelectedMode}
                        selectedSeason={selectedSeason}
                        setSelectedSeason={setSelectedSeason}
                        selectedRankInfo={selectedRankInfo}
                        filteredMatches={filteredMatches}
                        gameModes={gameModes}
                        gameSeasons={gameSeasons}
                        agents={agents}
                        lastSeason={lastSeason}
                    />
                </div>
            )
        default:
            return null
    }
}

export default MainSection
