// import { useEffect, useState } from 'react'
import '../styles/SearchModal.css'

function SearchModal({ handleSubmit, loading }) { 
    return (
        <div className="modalContainer">
            <div className='searchModal'>
                <form 
                    onSubmit={handleSubmit}
                >
                    <div className='inputField'>
                        <label for="playerInput">Mi usuario</label>
                        <input id="playerInput" name='playerInput' autoComplete='on' required className='playerInput' maxLength={100} minLength={6} type="text" placeholder='my name#tag' pattern='[^#]+#[^#]+' title='El formato debe ser nombre#tag' />
                        <span>* Distingue mayúsculas/minúsculas</span>
                    </div>
                    <div className='submitBtnContainer'>
                        <button className='submitBtn btn' disabled={loading} style={ loading ? { cursor: 'not-allowed', backgroundColor: 'var(--greenT)' } : { backgroundColor: 'var(--green)' }} type="submit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-send-2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4.698 4.034l16.302 7.966l-16.302 7.966a.503 .503 0 0 1 -.546 -.124a.555 .555 0 0 1 -.12 -.568l2.468 -7.274l-2.468 -7.274a.555 .555 0 0 1 .12 -.568a.503 .503 0 0 1 .546 -.124" /><path d="M6.5 12h14.5" /></svg>
                            Vamos!
                        </button>
                        { loading && <div className='progress'></div> }
                    </div>
                </form>
            </div>
        </div>
    )
}

export default SearchModal