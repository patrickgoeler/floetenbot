import Discord from "discord.js"
import { TOKEN } from "./config"
import { onMessage } from "./handlers/message"
import logger from "./utils/logger"

const client = new Discord.Client()

client.on("ready", () => logger.log("info", "The bot is online!"))
client.on("debug", (m) => logger.log("debug", m))
client.on("warn", (m) => logger.log("warn", m))
client.on("error", (m) => logger.log("error", m))

process.on("uncaughtException", (error) => logger.log("error", error))

client.on("message", onMessage)

client.login(TOKEN)
