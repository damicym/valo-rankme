import Match from './Match.jsx'

function Matches({ matches, selectedMode, selectedSeason }) {
    return (
        <section className="matchContainer">
            {/* fecha */}
            {
                matches?.filter((m) => m.mode_id === selectedMode && (selectedSeason === null || m.season_id === selectedSeason))
                    ?.map((m, index) => <Match key={m.started_at} index={index} data={m}></Match>)
            }
        </section>
    )
}

export default Matches
