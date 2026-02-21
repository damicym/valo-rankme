import express from "express"
import morgan from "morgan"
import cors from "cors"
import { config } from "./config.js"

const app = express()

app.set('port', config.PORT)

// Desactivar caché durante desarrollo
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
    next()
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use(cors())

export default app