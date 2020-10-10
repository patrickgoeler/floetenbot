import axios from "axios"
import { GOOGLE_TOKEN } from "../config"
import { Item, YoutubeSearchResult } from "../types/youtube"

export async function getVideoUrl(query: string): Promise<Item> {
  try {
    const { data } = await axios.get<YoutubeSearchResult>(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURI(query)}&key=${GOOGLE_TOKEN}`,
    )
    if (data.items && data.items.length > 0) {
      const item = data.items[0]
      return item
    }
    throw new Error("No items")
  } catch (error) {
    console.log(error)
    throw new Error(error)
  }
}
