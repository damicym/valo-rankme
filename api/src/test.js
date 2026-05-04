import { getHDEVMatches, getHDEVPlayerPuuid } from "./libs/api_requests.js";

export async function test() {
    const player = await getHDEVPlayerPuuid("apel#Ado")
    console.log(player)
}