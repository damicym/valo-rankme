import '../styles/NavLink.css'
import { forwardRef } from 'react'

const NavLink = forwardRef(({ href, icon, msg, tooltipStyle, className, target = '_blank', onClick }, ref) => {
    const handleClick = (event) => {
        if (!href) {
            event.preventDefault()
        }

        if (onClick) {
            onClick(event)
        }
    }

    return (
        <div className='navLinkContainer'>
            <a ref={ref} className={`navLink ${className || ''}`} href={href || undefined} target={href ? target : undefined} rel={href ? "noreferrer noopener" : undefined} aria-label={href ? `Enlace a ${href}` : undefined} onClick={handleClick}>
                {icon}
            </a>
            <div className='navLinkTooltip' role='tooltip' style={tooltipStyle}>
                {msg}
            </div>
        </div>
    )
})

NavLink.displayName = 'NavLink'

export default NavLink
