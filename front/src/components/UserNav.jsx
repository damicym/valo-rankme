import '../styles/UserNav.css'
import { USER_SECTIONS } from '../config'

function UserNav({ name, tag, banner, title, level, levelBorder, selectedSection, setSelectedSection }) {
    return (
        <div className="userNav">
            <div className="bannerContainer">
                <img className='banner' src={banner} alt="banner" />
                <div className="userInfo">
                    <div className="user">
                        {name}
                        <span>#{tag}</span>
                    </div>
                    <p className="title">{title}</p>
                </div>
                <div className="levelContainer">
                    <div className='levelSubContainer'>
                        <img src={levelBorder} alt="level border" />
                        <span>{level}</span>
                    </div>
                </div>
            </div>
            <div className="navButtons">
                {Object.entries(USER_SECTIONS).map(([section, id]) => (
                    <button
                        key={id}
                        className={`navBtn ${selectedSection === id ? 'active' : ''}`}
                        onClick={() => setSelectedSection(id)}
                    >
                        {section.charAt(0).toUpperCase() + section.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default UserNav