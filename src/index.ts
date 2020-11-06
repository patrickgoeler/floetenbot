import Discord from "discord.js"
import express from "express"
import { TOKEN } from "./config"
import { onMessage } from "./handlers/message"
import { onVoiceStateUpdate } from "./handlers/voiceStateUpdate"
import logger from "./utils/logger"

export interface Server {
  songs: Song[]
  connection: Discord.VoiceConnection | null
  id: string
  voiceChannel: Discord.VoiceChannel
  textChannel: Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel
}

export interface Song {
  url?: string
  title: string
}

export const store = new Map<string, Server>()

const client = new Discord.Client()

client.on("ready", () => logger.log("info", "The bot is online!"))
client.on("debug", (m) => logger.log("debug", m))
client.on("warn", (m) => logger.log("warn", m))
client.on("error", (m) => logger.log("error", m))

process.on("uncaughtException", (error) => logger.log("error", error))

client.on("message", onMessage)

client.on("voiceStateUpdate", onVoiceStateUpdate)

client.login(TOKEN)

const app = express()
app.get("/", (_, res) => {
  return res.send("Ok")
})
app.listen(process.env.PORT, () => {
  logger.info(`Running on ${process.env.PORT}`)
})
