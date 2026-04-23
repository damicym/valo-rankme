import { useEffect } from 'react'
import '../styles/SearchModal.css'

function SearchModal({ handleSubmit, loading, setShowSearchModal }) { 

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (loading) return () => {
                    document.removeEventListener('keydown', handleKeyDown)
                }
                setShowSearchModal(false)
            }
        }
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [setShowSearchModal, loading])

    return (
        <div 
            className="modalContainer" 
            onMouseDown={() => {
                if (loading) return
                setShowSearchModal(false)}
            }
        >
            <div className='searchModal' onMouseDown={(e) => e.stopPropagation()}>
                <div 
                    className='closeBtn' 
                    style={loading ? { pointerEvents: 'none', opacity: 0.35 } : {}}
                    onClick={() => {
                        if (loading) return
                        setShowSearchModal(false)}
                    }
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-badge-left">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M11 17h6l-4 -5l4 -5h-6l-4 5l4 5" />
                    </svg>
                    <span>Volver</span>
                </div>
                <label htmlFor="playerInput">Buscar jugador</label>
                <form 
                    onSubmit={handleSubmit}
                    >
                    <div className='inputField'>
                        <div className='iconContainer' style={ loading ? { backgroundColor: 'var(--redT)' } : { backgroundColor: 'var(--red)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="search-box__logo" data-v-9c13c171=""><path d="M2.2,3.8l.1.1c.2.3,11.8,14.8,12.8,16V20a.1.1,0,0,1-.1.1H8.8a.52.52,0,0,1-.4-.2C8.2,19.7,4,14.5,2.1,12a.31.31,0,0,0-.1-.2V3.9H2a.349.349,0,0,1,.2-.1ZM22,4h0c0-.1-.1-.1-.1-.2h-.1l-.2.2c-.9,1.1-8.1,10.1-8.3,10.3l-.1.1c0,.1,0,.1.1.1h6.2c.1,0,.2-.1.3-.2l.2-.2c.5-.7,1.7-2.2,1.8-2.3,0-.1,0-.1.1-.2v-.1C22,9.1,22,6.6,22,4Z" transform="translate(0 0.2)"></path></svg>
                            { loading && <div className='progress'></div> }
                        </div>
                        <div>
                            <input disabled={loading} id="playerInput" name='playerInput' autoComplete='on' required className='playerInput' maxLength={100} minLength={6} type="text" placeholder='my name#tag' pattern='[^#]+#[^#]+' title='El formato debe ser nombre#tag' />
                            <span>* Distingue mayúsculas/minúsculas</span>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default SearchModal