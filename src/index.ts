import Discord from "discord.js"
import ytdl from "ytdl-core-discord"
import { PREFIX, TOKEN } from "./config"
import { getVideoUrl } from "./api/youtube"

const client = new Discord.Client()

client.once("ready", () => {
  console.log("Ready!")
})

let dispatcher: Discord.StreamDispatcher

client.on("message", async (message) => {
  console.log(message.content)
  if (message.content.startsWith(`${PREFIX}play`) && message.member?.voice.channel) {
    const splits = message.content.split(" ")
    const query = splits.slice(1)
    if (!query) {
      return message.channel.send("Gib 2. Parameter du Mongo")
    }
    try {
      const item = await getVideoUrl(query.join(" "))

      const connection = await message.member.voice.channel.join()

      // dispatcher = connection.play("src/blackflame.mp3")
      dispatcher = connection.play(await ytdl(`https://www.youtube.com/watch?v=${item.id.videoId}`), {
        type: "opus",
        highWaterMark: 50,
        bitrate: 128,
      })

      message.channel.send(`Los geht's mit ${item.snippet.title}`)

      // Always remember to handle errors appropriately!
      dispatcher.on("error", (error) => {
        throw new Error(error.message)
      })
    } catch (error) {
      console.error(error)
      return message.channel.send("Irgendwas ist schief gegangen lol")
    }
  }

  if (message.content === `${PREFIX}stop` && dispatcher) {
    dispatcher.destroy()
  }

  if (message.content === `${PREFIX}leave` && message.member?.voice.channel) {
    await message.member.voice.channel.leave()
  }

  return true
})

client.login(TOKEN)
