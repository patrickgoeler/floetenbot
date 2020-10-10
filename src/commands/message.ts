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

export async function queue(message: Discord.Message) {
  const server = store.get(message.guild?.id as string)
  if (!server) {
    await message.channel.send("Grade läuft doch gar nichts")
  } else if (server.songs.length === 0) {
    await message.channel.send("Nichts in der queue")
  } else {
    const fields = [{ name: "Aktueller Titel", value: `1) ${server.songs[0].title}` }]
    if (server.songs.length > 1) {
      const text = server.songs
        .slice(1)
        .map((song, index) => `${index + 2}) ${song.title}`)
        .join("\n")
      fields.push({ name: "Nächste Titel", value: text })
    }
    const queueMessage = new Discord.MessageEmbed()
      .setColor("#0099ff")
      .setTitle("Queue")
      .setDescription("Du kannst '_jump X' benutzen um zur Nummer X zu skippen")
      .addFields(...fields)
      .setTimestamp()
      .setFooter("Flötenbot bester Bot")
    await message.channel.send(queueMessage)
  }
}

export async function jump(message: Discord.Message, args: string[]) {
  const server = store.get(message.guild?.id as string)
  const position = Number(args[0])
  if (!server) {
    await message.channel.send("Grade läuft doch gar nichts")
  } else if (server.songs.length === 0) {
    await message.channel.send("Nichts in der queue")
  } else if (args.length > 1) {
    await message.channel.send("Nur 1 Paramter (jump position) du Mongo")
  } else if (!position || position < 0) {
    await message.channel.send("Du musst auch eine valide Nummer angeben du Mongo")
  } else if (position === 1) {
    await message.channel.send("Das Lied läuft doch schon du Mongo")
  } else if (position > server.songs.length) {
    await message.channel.send("So viele Lieder sind gar nicht in der Queue du Mongo")
  } else {
    // one queue element is removed on dispatcher end
    // so if we only jump one ahead it splices (0, 0) and it is handled like a skip
    server.songs.splice(0, position - 2)
    server.connection?.dispatcher.end()
  }
}
