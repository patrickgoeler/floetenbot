import Discord from "discord.js"
import { Server, store } from ".."
import { jump, leave, pause, queue, queueFull, skip, start, stop } from "../commands/message"
import { PREFIX } from "../config"
import logger from "../utils/logger"

export async function onMessage(message: Discord.Message): Promise<any> {
  try {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return
    logger.info(`Received message: ${message.content} from ${message.author.username}`)

    const args = message.content.slice(PREFIX.length).trim().split(/ +/)
    const command = args.shift()?.toLowerCase()

    if (command === "play") {
      await start(message, args)
    }

    if (command === "stop") {
      await stop(message)
    }

    if (command === "pause") {
      await pause(message)
    }

    if (command === "leave") {
      await leave(message)
    }

    if (command === "skip") {
      await skip(message)
    }

    if (command === "queue_full") {
      await queueFull(message)
    }

    if (command === "queue") {
      await queue(message)
    }

    if (command === "jump") {
      await jump(message, args)
    }
  } catch (error) {
    logger.error(error)
    message.channel.startTyping()
    await message.channel.send("Error Holger fix")
    message.channel.stopTyping()
    const server = store.get(message.guild?.id as string) as Server
    if (server.voiceChannel) {
      await server.voiceChannel.leave()
    }
    store.delete(message.guild?.id as string)
  }
}
