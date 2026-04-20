import { getHDEVPlayerDisplay } from "./libs/api_requests.js"
import { updatePlayerDisplay } from "./libs/db/queries.js"
import { getPlayerRank } from "./libs/match_parser.js"
// import competitive_raw_example from '../local/competitive_raw_example.json' assert { type: 'json' }

export async function test0() {
    const prevRRChanges = [20, 19, 29, -21, 12, -25]
    const rankInfo = getPlayerRank(prevRRChanges, null, -26)
    console.log(rankInfo)
}

export async function test() {
    updatePlayerDisplay('9c10981a-3fc4-5eb4-9a3f-8e3008aeaa20')
}