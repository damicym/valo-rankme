import { useState, useEffect, useRef } from 'react'
import '../styles/SearchModal.css'

const cicleInterval = 2 * 1000
const defMsg = ""
const msgDefList = [
    "Espiando cámaras",
    "Lurkeando spawns",
    "Defusando spikes",
    "Recargando outlaws",
    "Apuntando lineups",
    "Desperdiciando updrafts",
    "Esperando humos",
    "Holdeando ángulos",
    "Calculando créditos",
    "Limpiando esquinas"
]
const shuffleArr = (arr) => {
    let res = [...arr]
    res.sort(() => Math.random() - 0.5)
    return res
}

function SearchModal({ handleSearch, loading, setShowSearchModal, isUserFormat, domixUser }) { 
    const [loadingMsg, setLoadingMsg] = useState(null)
    const loadingMsgRef = useRef(null)
    const msgs = useRef(shuffleArr(msgDefList))
    const [error, setError] = useState(null)
    const inputRef = useRef(null)
    const [validInput, setValidInput] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        const formData = new FormData(e.target)
        const error = await handleSearch(formData)
        if (error) {
            setError(error)
            inputRef.current.focus()
        }
    }

    const evalValidity = (e) => {
        const value = e.target.value
        const valid = isUserFormat(value)
        setValidInput(valid)
    }


    useEffect(() => {
        if (!loading) return
        
        const cicleMsgs = () => {
            if (loadingMsgRef.current && loadingMsgRef.current !== defMsg) {
                const currentFirstEl = msgs.current[0]
                msgs.current.splice(0, 1)
                msgs.current.push(currentFirstEl)
            }
            setLoadingMsg(msgs.current[0])
            loadingMsgRef.current = msgs.current[0]
        }
        
        cicleMsgs()
        const cicle = setInterval(cicleMsgs, cicleInterval)
        return () => clearInterval(cicle)
    }, [loading])

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
            style={{
                backdropFilter: 'blur(16px) saturate(120%)',
                WebkitBackdropFilter: 'blur(18px) saturate(120%)',
            }}
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
                            { loading && 
                            <div 
                                className='progress'
                                style={{
                                    borderTopLeftRadius: '8px',
                                    borderBottomLeftRadius: '8px',
                                    backgroundColor: 'var(--red)',
                                }}
                            ></div> 
                            }
                        </div>
                        <div className='inputContainer'>
                            <input 
                                className='playerInput'
                                ref={inputRef}
                                disabled={loading} 
                                id="playerInput" 
                                name='playerInput' 
                                autoComplete='on' 
                                maxLength={100} 
                                type="text" 
                                placeholder={domixUser ? `Ej.: ${domixUser}` : "nombre#tag"}
                                onChange={evalValidity}
                            />
                            <span className='bottomMsg'>
                                <span className='bottomMsgText' style={error ? { color: 'var(--red)' } : {}}>{error ? error : loading ? loadingMsg : defMsg}</span>
                                {loading &&
                                    <span className='waving'>
                                        <span style={{"--delay": '0.1s'}}>.</span><span style={{"--delay": '0.2s'}}>.</span><span style={{"--delay": '0.3s'}}>.</span>
                                    </span>
                                }
                            </span>
                            <button 
                                type='submit'
                                disabled={loading || !validInput}
                                className='submitBtn btn'
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-arrow-badge-right">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M7 6l-.112 .006a1 1 0 0 0 -.669 1.619l3.501 4.375l-3.5 4.375a1 1 0 0 0 .78 1.625h6a1 1 0 0 0 .78 -.375l4 -5a1 1 0 0 0 0 -1.25l-4 -5a1 1 0 0 0 -.78 -.375h-6z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default SearchModal