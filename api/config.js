import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '.env') })

const parseInteger = (value, fallback) => {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : fallback
}

export const config = {
    HENRIKDEV_ACCESS_TOKEN: process.env.HENRIKDEV_ACCESS_TOKEN,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SECRET: process.env.SUPABASE_SECRET,
    POLLING: process.env.POLLING === 'true',
    POLLING_INTERVAL: parseInteger(process.env.POLLING_INTERVAL, 3 * 60 * 1000),
    PLAYER_SYNC_INTERVAL: parseInteger(process.env.PLAYER_SYNC_INTERVAL, 3 * 60 * 1000),
    PORT: process.env.PORT || 3000,
    LOG_TIMEZONE: process.env.LOG_TIMEZONE || 'UTC'
}
