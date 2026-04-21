import '../styles/NavBar.css'
import { SECTIONS } from '../config'

function NavBar({ selectedSection, setSelectedSection, showSearchModal, setShowSearchModal }) { 
    return (
        <nav className="navBar">
            <div className="logo" onClick={() => setSelectedSection(SECTIONS.HOME)}>
                <img src="/assets/logo.png" alt="logo" />
                <span>Skirmish Ranks</span>
            </div>
            <div className='searchBtn' onClick={() => setShowSearchModal(true)}>
                <img src="/assets/search.png" alt="search" />
                <span>Buscar jugador</span>
            </div>
        </nav>
    )
}

export default NavBar