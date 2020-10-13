import Discord from "discord.js"
// import ytdl from "ytdl-core-discord"
import ytdl from "discord-ytdl-core"
import { getVideoInfo, getVideoUrl } from "../api/youtube"
import logger from "../utils/logger"
import { Server, Song, store } from ".."
import { getSongQueries } from "../api/spotify"

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
    await message.channel.send("Gilde nicht definiert")
    return
  }
  // eslint-disable-next-line no-useless-escape
  const urlRegex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/=]*)?/gi

  let songs: Song[] = []

  try {
    if (args[0].match(new RegExp(urlRegex))) {
      // handle link
      if (args[0].includes("spotify")) {
        // handle spotify
        const titles = await getSongQueries(args[0])
        songs = [...titles.map((t) => ({ title: t }))]
      } else if (args[0].includes("youtube")) {
        // play link directly
        const song = await getVideoInfo(args[0])
        songs.push(song)
      } else {
        await message.channel.send("Nur Youtube Links werden unterstützt du Mongo")
        return
      }
    } else {
      // normal search terms
      const item = await getVideoUrl(args.join(" "))
      const song: Song = {
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      }
      songs.push(song)
    }
  } catch (error) {
    logger.error(error)
    await message.channel.send("Evtl. ist die Youtube API Quota überstiegen")
  }

  const server = store.get(message.guild.id)

  if (!server) {
    // new server
    const newServer: Server = {
      id: message.guild.id,
      songs,
      connection: null,
      voiceChannel,
      textChannel: message.channel,
    }
    store.set(message.guild.id, newServer)
    try {
      const connection = await voiceChannel.join()
      connection.voice.setSelfDeaf(true)
      newServer.connection = connection
      await play(message.guild.id, songs[0])
    } catch (error) {
      logger.error(error)
      store.delete(message.guild.id)
      message.channel.send(error)
    }
  } else {
    // just add song to queue
    server.songs = [...server.songs, ...songs]
    if (songs.length > 1) {
      message.channel.send(`${songs.map((s) => s.title).join(", ")} sind jetzt in der queue`)
    } else {
      message.channel.send(`${songs[0].title} ist jetzt in der queue`)
    }
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
  if (!song.url) {
    const item = await getVideoUrl(song.title)
    song.url = `https://www.youtube.com/watch?v=${item.id.videoId}`
  }
  const stream = ytdl(song.url, {
    filter: "audioonly",
    opusEncoded: true,
    highWaterMark: 50,
    encoderArgs: ["-af", "bass=g=20"],
    // encoderArgs: ["-af", "bass=g=20,dynaudnorm=f=200"],
  })
  server.connection
    .play(stream, {
      type: "opus",
      highWaterMark: 50,
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

export async function queueFull(message: Discord.Message) {
  const server = store.get(message.guild?.id as string)
  if (!server) {
    await message.channel.send("Grade läuft doch gar nichts")
  } else if (server.songs.length === 0) {
    await message.channel.send("Nichts in der queue")
  } else {
    const fields: Discord.EmbedFieldData[] = [{ name: "Aktueller Titel", value: `1) ${server.songs[0].title}` }]
    if (server.songs.length > 1) {
      let text = ""
      for (let i = 1; i < server.songs.length; i++) {
        const song = server.songs[i]
        const songTitle = `${i + 1}) ${song.title}`
        text += `${songTitle}\n`
        if (i % 9 === 0) {
          fields.push({ name: `Tracks ${i - 7} bis ${i + 1}`, value: text })
          text = ""
        }
      }
    }
    const queueMessage = new Discord.MessageEmbed()
      .setColor("#0099ff")
      .setTitle("Ganze Queue")
      .setDescription("Du kannst '_jump X' benutzen um zur Nummer X zu skippen")
      .addFields(...fields)
      .setTimestamp()
      .setFooter("Flötenbot bester Bot")
    await message.channel.send(queueMessage)
  }
}

export async function queue(message: Discord.Message) {
  const server = store.get(message.guild?.id as string)
  if (!server) {
    await message.channel.send("Grade läuft doch gar nichts")
  } else if (server.songs.length === 0) {
    await message.channel.send("Nichts in der queue")
  } else {
    const fields: Discord.EmbedFieldData[] = [{ name: "Aktueller Titel", value: `1) ${server.songs[0].title}` }]
    if (server.songs.length > 1) {
      let text = ""
      for (let i = 1; i < server.songs.length; i++) {
        const song = server.songs[i]
        const songTitle = `${i + 1}) ${song.title}`
        text += `${songTitle}\n`
        if (i % 9 === 0) {
          text += `...\nTotal: ${server.songs.length}`
          fields.push({ name: `Tracks ${i - 7} bis ${i + 1}`, value: text })
          text = ""
          break
        }
      }
    }
    const queueMessage = new Discord.MessageEmbed()
      .setColor("#0099ff")
      .setTitle("Kurze Queue")
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
