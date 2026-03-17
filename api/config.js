import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '.env') })

export const config = {
    HENRIKDEV_ACCESS_TOKEN: process.env.HENRIKDEV_ACCESS_TOKEN,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SECRET: process.env.SUPABASE_SECRET,
    POLLING: process.env.POLLING === 'true',
    PORT: process.env.PORT || 3000
}
