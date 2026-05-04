import ranks from '../data/ranks.json'

function HomeSection({ setShowSearchModal }) {
    return (
        <div className='home'>
            <div className='ranksBg' aria-hidden='true'>
                {[1,4,7,10,13,16,19,22,24].map(tier => {
                    const rank = ranks.find(r => r.tier == tier)
                    return rank ? <img key={tier} src={rank.icon} alt='' className='bgRankIcon' loading='lazy' decoding='async' /> : null
                })}
            </div>
            <div className='content'>
                <div className='badge'>VALORANT RANKME</div>
                <h1 className='mainTitle'>
                    Conocé tu
                    <span className='accent'>rendimiento</span>
                    <span className='light'>no competitivo</span>
                </h1>
                <p className='subtitle'>
                    Buscá cualquier jugador y explorá su historial de partidas, estadísticas, y rangos para los modos en los que Valorant no te da un rango.
                </p>
                <section className='btnList'>
                    <div className='btnContainer'>
                        <button className='btn mainBtn shining' onClick={() => setShowSearchModal(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                            Buscar jugador
                        </button>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default HomeSection
