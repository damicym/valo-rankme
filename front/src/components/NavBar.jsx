import '../styles/NavBar.css'
import { SECTIONS } from '../config'
import { useEffect, useState, useRef } from 'react'
import NavLink from './NavLink'

function NavBar({ selectedSection, setSelectedSection, setShowSearchModal, domixUser }) { 
    const [showMsg, setShowMsg] = useState(localStorage.getItem('hideHeaderMsg') !== 'true')
    const [isMsgExiting, setIsMsgExiting] = useState(false)
    const loveNavLinkRef = useRef(null)
    const loveTimeoutRef = useRef(null)

    useEffect(() => {
        const preloadLogo = new Image()
        preloadLogo.src = '/clutchboard-logo.svg'
    }, [])

    const handleLove = () => {
        const loveEl = loveNavLinkRef.current
        if (loveEl) {
            loveEl.classList.remove('showingLove')
            void loveEl.offsetWidth
            loveEl.classList.add('showingLove')
        }
        
        clearTimeout(loveTimeoutRef.current)
        loveTimeoutRef.current = setTimeout(() => {
            if (loveEl) {
                loveEl.classList.remove('showingLove')
            }
        }, 600)
    }

    return (
        <>
            { showMsg &&
                <div className='headerMsg' style={{ animation: isMsgExiting ? 'slideUp 0.2s ease' : 'none' }}>
                    <span>¿Con ganas de encontrar o compartir consejos y lineups? Visitá <a href="https://damicym.github.io/clutchboard/" target="_blank">ClutchBoard</a></span>
                    <button 
                        className='closeMsgBtn' 
                        onClick={() => {
                            setIsMsgExiting(true)
                            setTimeout(() => {
                                localStorage.setItem('hideHeaderMsg', 'true')
                                setShowMsg(false)
                                setIsMsgExiting(false)
                            }, 150)
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-x">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M18 6l-12 12" />
                            <path d="M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            }
            <nav className="navBar">
                <div className={selectedSection === SECTIONS.HOME ? 'logo active' : 'logo'} onClick={() => setSelectedSection(SECTIONS.HOME)}>
                    {/* <img src="./public/favicon.png" alt="logo" /> */}
                    <span>Inicio</span>
                </div>
                <div className='searchBtn' onClick={() => setShowSearchModal(true)}>
                    <div className='iconContainer'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="search-box__logo" data-v-9c13c171=""><path d="M2.2,3.8l.1.1c.2.3,11.8,14.8,12.8,16V20a.1.1,0,0,1-.1.1H8.8a.52.52,0,0,1-.4-.2C8.2,19.7,4,14.5,2.1,12a.31.31,0,0,0-.1-.2V3.9H2a.349.349,0,0,1,.2-.1ZM22,4h0c0-.1-.1-.1-.1-.2h-.1l-.2.2c-.9,1.1-8.1,10.1-8.3,10.3l-.1.1c0,.1,0,.1.1.1h6.2c.1,0,.2-.1.3-.2l.2-.2c.5-.7,1.7-2.2,1.8-2.3,0-.1,0-.1.1-.2v-.1C22,9.1,22,6.6,22,4Z" transform="translate(0 0.2)"></path></svg>                    
                    </div>
                    <div className='textContainer'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-search"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                        <span>Buscar jugador</span>
                    </div>
                </div>
                <section className='navRightSide'>
                    <NavLink 
                        ref={loveNavLinkRef}
                        onClick={() => handleLove()}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-heart"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" /></svg>}
                        msg={<span>Con mucho amor, por <span style={{color: 'var(--yellow)', fontWeight: 650}}>{domixUser || "domix#640"}</span></span>}
                        tooltipStyle={{"--tooltipBg": "var(--red)", filter: "drop-shadow(0 0px 1px var(--red))"}}
                    />
                    <NavLink 
                        href="https://github.com/damicym/skirmish-ranks"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-github"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" /></svg>}
                        msg="Visitá el repositorio en Github"
                        tooltipStyle={{"--tooltipBg": "var(--border)", filter: "none"}}
                    />
                    { !showMsg &&
                        <NavLink 
                            href="https://damicym.github.io/clutchboard/"
                            icon={<img src="/clutchboard-logo.svg" alt="" aria-hidden="true" />}
                            msg="¡Visitá ClutchBoard!"
                            tooltipStyle={{"--tooltipBg": "#BD632F", filter: "none"}}
                        />
                    }
                </section>
            </nav>
        </>
    )
}
export default NavBar