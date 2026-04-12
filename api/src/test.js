import { getPlayerRank } from "./libs/match_parser.js"
// import competitive_raw_example from '../local/competitive_raw_example.json' assert { type: 'json' }

export async function test() {
    const prevRRChanges = [20, 19, 29, -21, 12, -25]
    const rankInfo = getPlayerRank(prevRRChanges, null, -26)
    console.log(rankInfo)
}