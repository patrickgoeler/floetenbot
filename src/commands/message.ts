import Discord from "discord.js"
import ytdl from "ytdl-core-discord"
import { getVideoUrl } from "../api/youtube"
import logger from "../utils/logger"

let connection: Discord.VoiceConnection

export async function play(message: Discord.Message, args: string[]) {
  if (args.length === 0) {
    await message.channel.send("Gib 2. Parameter du Mongo")
    return
  }
  if (!message.member?.voice.channel) {
    await message.channel.send("Du befindest dich nicht in einem Voice Channel du Mongo")
    return
  }
  try {
    const item = await getVideoUrl(args.join(" "))

    connection = await message.member.voice.channel.join()

    // dispatcher = connection.play("src/blackflame.mp3")
    const dispatcher = connection.play(await ytdl(`https://www.youtube.com/watch?v=${item.id.videoId}`), {
      type: "opus",
      highWaterMark: 50,
      bitrate: 128,
    })

    message.channel.send(`Los geht's mit ${item.snippet.title}`)

    // Always remember to handle errors appropriately!
    dispatcher.on("error", (error) => {
      logger.error(error.message)
    })
    dispatcher.on("finish", () => {
      // play next from queue
      dispatcher.destroy()
    })
  } catch (error) {
    logger.error(error)
  }
}

export async function stop(message: Discord.Message) {
  if (!message.member?.voice.channel) {
    await message.channel.send("Du befindest dich nicht in einem Voice Channel du Mongo")
    return
  }
  if (connection) {
    connection.dispatcher.end()
  }
}

export async function leave(message: Discord.Message) {
  if (message.member?.voice.channel) {
    await message.member.voice.channel.leave()
    await message.react("👋")
  }
}
