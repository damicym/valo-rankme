// import { useEffect, useState } from 'react'
import Match from "./Match"

function Player({ data }) {

    return (
        <div className="player">
            <p>{data?.user}</p>
            <div className="rank">
                {/* svg */}
                <p>{data?.rankInfo?.rank}</p>
                <p>{data?.rankInfo?.shield}</p>
                <p>{data?.rankInfo?.rr}</p>
            </div>
            <section className="matchContainer">
                {/* fecha */}
                {
                    data?.matches?.map((m) => <Match key={m.date} data={m}></Match>)
                }
            </section>
        </div>
    )
}

export default Player