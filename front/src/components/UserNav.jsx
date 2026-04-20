import '../styles/UserNav.css'

function UserNav({ name, tag, banner, title, level, levelBorder }) {
    return (
        <div className="userNav">
            <div className="bannerContainer">
                <img src={banner} alt="banner" />
                <div className="userInfo">
                    <div className="user">
                        {name}
                        <span>#{tag}</span>
                    </div>
                    <p>{title}</p>
                </div>
                <div className="levelContainer">
                    <img src={levelBorder} alt="level border" />
                    <span>{level}</span>
                </div>
            </div>
            {/* <div className="nav">
            </div> */}
        </div>
    )
}

export default UserNav