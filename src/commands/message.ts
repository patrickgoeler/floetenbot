import Discord from "discord.js"
// import ytdl from "ytdl-core-discord"
import ytdl from "discord-ytdl-core"
import { getVideoUrl } from "../api/youtube"
import logger from "../utils/logger"
import { Server, Song, store } from ".."

export async function start(message: Discord.Message, args: string[]) {
  message.channel.startTyping()
  if (args.length === 0) {
    await message.channel.send("Gib 2. Parameter du Mongo")
    return
  }
  const voiceChannel = message.member?.voice.channel
  if (!voiceChannel) {
    await message.channel.send("Du befindest dich nicht in einem Voice Channel du Mongo")
    return
  }
  if (!message.guild) {
    await message.channel.send("Guild not defined")
    return
  }
  const item = await getVideoUrl(args.join(" "))
  const song: Song = {
    title: item.snippet.title,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
  }
  const server = store.get(message.guild.id)

  if (!server) {
    // new server
    const newServer: Server = {
      id: message.guild.id,
      songs: [song],
      connection: null,
      voiceChannel,
      textChannel: message.channel,
    }
    store.set(message.guild.id, newServer)
    try {
      const connection = await voiceChannel.join()
      connection.voice.setSelfDeaf(true)
      newServer.connection = connection
      await play(message.guild.id, song)
    } catch (error) {
      logger.error(error)
      store.delete(message.guild.id)
      message.channel.send(error)
    }
  } else {
    // just add song to queue
    server.songs.push(song)
    message.channel.send(`${song.title} ist jetzt in der queue`)
  }
  message.channel.stopTyping()
}

export async function play(guildId: string, song: Song) {
  const server = store.get(guildId)
  if (!server) {
    return
  }
  if (!song) {
    // queue empty
    server?.voiceChannel?.leave()
    store.delete(guildId)
    return
  }
  if (!server.connection) {
    // not in voice channel
    return
  }
  const stream = ytdl(song.url, {
    quality: "highestaudio",
    opusEncoded: true,
    encoderArgs: ["-af", "bass=g=15,dynaudnorm=f=200"],
  })
  server.connection
    .play(stream, {
      type: "opus",
      highWaterMark: 50,
      bitrate: 128,
    })
    .on("finish", () => {
      server.songs.shift()
      play(guildId, server.songs[0])
    })
    .on("error", (error) => logger.error(error))
  await server.textChannel.send(`Los geht's mit ${song.title}`)
}

export async function stop(message: Discord.Message) {
  if (!message.member?.voice.channel) {
    await message.channel.send("Du befindest dich nicht in einem Voice Channel du Mongo")
    return
  }
  const server = store.get(message.guild?.id as string) as Server
  server.songs = []
  server.connection?.dispatcher.end()
}

export async function skip(message: Discord.Message) {
  if (!message.member?.voice.channel) {
    await message.channel.send("You have to be in a voice channel to stop the music!")
    return
  }
  const server = store.get(message.guild?.id as string)
  if (!server) {
    await message.channel.send("There is no song that I could skip!")
    return
  }
  // ending current dispatcher triggers the on end hook which plays the next song
  server.connection?.dispatcher.end()
}

export async function leave(message: Discord.Message) {
  const server = store.get(message.guild?.id as string) as Server
  if (server.voiceChannel) {
    await server.voiceChannel.leave()
    await message.react("👋")
  }
}
