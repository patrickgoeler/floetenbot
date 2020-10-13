export interface Track {
  album: Album
  artists?: ArtistsEntity[] | null
  available_markets?: null[] | null
  disc_number: number
  duration_ms: number
  explicit: boolean
  external_ids: ExternalIds
  external_urls: ExternalUrls
  href: string
  id: string
  is_local: boolean
  name: string
  popularity: number
  preview_url?: null
  track_number: number
  type: string
  uri: string
}

export interface Album {
  album_type: string
  artists?: ArtistsEntity[] | null
  available_markets?: null[] | null
  external_urls: ExternalUrls
  href: string
  id: string
  images?: ImagesEntity[] | null
  name: string
  release_date: string
  release_date_precision: string
  total_tracks: number
  tracks?: { items: Track[] }
  type: string
  uri: string
}
export interface ArtistsEntity {
  external_urls: ExternalUrls
  href: string
  id: string
  name: string
  type: string
  uri: string
  genres?: string[]
}
export interface ExternalUrls {
  spotify: string
}
export interface ImagesEntity {
  height: number
  url: string
  width: number
}
export interface ExternalIds {
  isrc: string
}
export interface TopTracks {
  tracks: Track[]
}

export interface Playlist {
  collaborative: boolean
  description: string
  external_urls: ExternalUrls
  followers: Followers
  href: string
  id: string
  images?: ImagesEntity[] | null
  name: string
  owner: Owner
  primary_color?: null
  public: boolean
  snapshot_id: string
  tracks: Tracks
  type: string
  uri: string
}
export interface Followers {
  href?: null
  total: number
}
export interface Owner {
  display_name: string
  external_urls: ExternalUrls
  href: string
  id: string
  type: string
  uri: string
}
export interface Tracks {
  href: string
  items?: ItemsEntity[] | null
  limit: number
  next?: null
  offset: number
  previous?: null
  total: number
}
export interface ItemsEntity {
  added_at: string
  added_by: AddedBy
  is_local: boolean
  primary_color?: null
  track: Track
  video_thumbnail: VideoThumbnail
}
export interface AddedBy {
  external_urls: ExternalUrls
  href: string
  id: string
  type: string
  uri: string
}
export interface ImagesEntity1 {
  height: number
  url: string
  width: number
}
export interface VideoThumbnail {
  url?: null
}
