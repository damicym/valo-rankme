import { getHDEVPlayerDisplay } from "./libs/api_requests.js"
import { updatePlayerDisplay } from "./libs/db/queries.js"
import { getPlayerRank } from "./libs/match_parser.js"
import { getMatchSeasonId } from "./libs/helpers.js"
import { readFile } from "node:fs/promises"

async function loadApelMatch() {
    const fileUrl = new URL("../local/apel_match.json", import.meta.url)
    const raw = await readFile(fileUrl, "utf8")
    return JSON.parse(raw)
}

export async function test() {
    const match = await loadApelMatch()
    const seasonId = await getMatchSeasonId(match)
    console.log("Season ID:", seasonId)
}