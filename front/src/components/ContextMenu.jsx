function ContextMenu({ elements, msg, elOnClick, show }) {
    return (
        <div className='ctxMenu' style={{ display: show ? 'flex' : 'none' }}>
            {
                elements.map((e, i) => 
                    <button key={i} className="ctxMenuEl" onClick={() => elOnClick(e.id)}>
                        {e.name}
                    </button>
                )
            }
            { msg &&
                <div className="ctxMenuMsg">
                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-info-circle"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M12 9h.01" /><path d="M11 12h1v4h1" /></svg>
                    {msg}
                </div>
            }
        </div>
    )
}

export default ContextMenu
