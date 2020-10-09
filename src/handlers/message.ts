import Discord from "discord.js"
import { leave, play, stop } from "../commands/message"
import { PREFIX } from "../config"
import logger from "../utils/logger"

export async function onMessage(message: Discord.Message): Promise<any> {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return
  logger.info(`Received message: ${message.content} from ${message.author.username}`)

  const args = message.content.slice(PREFIX.length).trim().split(/ +/)
  const command = args.shift()?.toLowerCase()

  if (command === "play") {
    await play(message, args)
  }

  if (command === "stop") {
    await stop(message)
  }

  if (command === "leave") {
    await leave(message)
  }
}
