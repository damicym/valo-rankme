import ranks from '../data/ranks.json'
import { useEffect, useRef, useState } from 'react'

const rankTiers = [1,4,7,10,13,16,19,22,24]

function HomeSection({ setShowSearchModal }) {
    const scrollRef = useRef(null)
    
    useEffect(() => {
        const scrollElement = scrollRef.current
        if (!scrollElement) return

        const updateCenterRank = () => {
            const scrollContainer = scrollElement.parentElement
            const containerWidth = scrollContainer.offsetWidth
            const containerCenter = containerWidth / 2

            // Obtener el transform actual
            const transform = window.getComputedStyle(scrollElement).transform
            const matrix = new DOMMatrix(transform)
            const translateX = Math.abs(matrix.m41) // m41 es translateX

            // Calcular la posición absoluta del centro del viewport
            const absoluteCenter = translateX + containerCenter

            // Obtener todos los iconos
            const icons = scrollElement.querySelectorAll('.bgRankIcon')
            
            // Encontrar el icono más cercano al centro
            let closestIcon = null
            let minDistance = Infinity

            icons.forEach((icon, index) => {
                const iconLeft = icon.offsetLeft
                const iconCenter = iconLeft + icon.offsetWidth / 2
                const distance = Math.abs(iconCenter - absoluteCenter)

                if (distance < minDistance) {
                    minDistance = distance
                    closestIcon = { icon, index }
                }
            })

            if (closestIcon) {
                scrollRef.current.querySelectorAll('.bgRankIcon').forEach(icon => icon.classList.remove('highlight'))
                closestIcon.icon.classList.add('highlight')
            }
        }

        // Actualizar cada frame de la animación
        const intervalId = setInterval(updateCenterRank, 100)

        return () => clearInterval(intervalId)
    }, [])
    
    return (
        <div className='home'>
            <div className='ranksBg' aria-hidden='true'>
                <div className='ranksScroll' ref={scrollRef}>
                    {[...Array(6)].map((_, index) => (
                        rankTiers.map(tier => {
                            const rank = ranks.find(r => r.tier == tier)
                            return rank ? <img key={`${index}-${tier}`} src={rank.icon} alt='' className='bgRankIcon' loading='lazy' decoding='async' /> : null
                        })
                    ))}
                </div>
            </div>
            <div className='content'>
                <div className='badge'>VALORANT RANKME</div>
                <h1 className='mainTitle'>
                    Conocé tu
                    <span className='accent'>rendimiento</span>
                    <span className='light'>no competitivo</span>
                </h1>
                <p className='subtitle'>
                    Buscá cualquier jugador y explorá su historial de partidas, estadísticas y <span style={{ textDecoration: 'underline' }}>rangos para todos los modos</span>.
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
