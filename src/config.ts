import dotenv from "dotenv"

dotenv.config()
export const TOKEN = process.env.TOKEN || ""

export const PREFIX = process.env.PREFIX || ""

export const GOOGLE_TOKEN = process.env.GOOGLE_TOKEN || ""

export const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || ""

export const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || ""

export const SPOTIFY_ENCODED_AUTH = process.env.SPOTIFY_ENCODED_AUTH || ""
