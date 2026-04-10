import { getPlayerRank } from "./libs/match_parser.js"

export async function test() {
    const prevRRChanges = [20, 19, 29, -21, 12, -25]
    const rankInfo = getPlayerRank(prevRRChanges, null, -26)
    console.log(rankInfo)
}