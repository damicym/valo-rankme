import ranks from '../data/ranks.json'

function HomeSection({ setShowSearchModal }) {
    return (
        <div className='home'>
            <div className='home__ranks-bg' aria-hidden='true'>
                {[3,6,9,12,15,17,18,21,24].map(tier => {
                    const rank = ranks.find(r => r.tier == tier)
                    return rank ? <img key={tier} src={rank.icon} alt='' className='home__rank-icon' /> : null
                })}
            </div>
            <div className='home__content'>
                <div className='home__badge'>VALORANT RANKER</div>
                <h1 className='home__title'>
                    Conocé tu<br />
                    <span className='home__title--accent'>rendimiento</span>
                </h1>
                <p className='home__subtitle'>
                    Buscá cualquier jugador y explorá su historial de partidas, rangos por temporada y estadísticas de partidas que no son oficialmente competitivas.
                </p>
                <button className='btn home__cta' onClick={() => setShowSearchModal(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                    Buscar jugador
                </button>
            </div>
        </div>
    )
}

export default HomeSection
