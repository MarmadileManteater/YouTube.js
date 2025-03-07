import type Player from '../../../core/Player.js';
import { InnertubeError } from '../../../utils/Utils.js';
import type { RawNode } from '../../index.js';

export default class Format {
  itag: number;
  mime_type: string;
  is_type_otf: boolean;
  bitrate: number;
  average_bitrate?: number;
  width: number;
  height: number;

  init_range?: {
    start: number;
    end: number;
  };

  index_range?: {
    start: number;
    end: number;
  };

  last_modified: Date;
  content_length?: number;
  quality?: string;
  quality_label?: string;
  fps?: number;
  url?: string;
  cipher?: string;
  signature_cipher?: string;
  audio_quality?: string;
  audio_track?: {
    audio_is_default: boolean;
    display_name: string;
    id: string;
  };
  approx_duration_ms: number;
  audio_sample_rate?: number;
  audio_channels?: number;
  loudness_db?: number;
  has_audio: boolean;
  has_video: boolean;
  language?: string | null;
  is_dubbed?: boolean;
  is_descriptive?: boolean;
  is_original?: boolean;

  constructor(data: RawNode) {
    this.itag = data.itag;
    this.mime_type = data.mimeType;
    this.is_type_otf = data.type === 'FORMAT_STREAM_TYPE_OTF';
    this.bitrate = data.bitrate;
    this.average_bitrate = data.averageBitrate;
    this.width = data.width;
    this.height = data.height;

    this.init_range = data.initRange ? {
      start: parseInt(data.initRange.start),
      end: parseInt(data.initRange.end)
    } : undefined;

    this.index_range = data.indexRange ? {
      start: parseInt(data.indexRange.start),
      end: parseInt(data.indexRange.end)
    } : undefined;

    this.last_modified = new Date(Math.floor(parseInt(data.lastModified) / 1000));
    this.content_length = parseInt(data.contentLength);
    this.quality = data.quality;
    this.quality_label = data.qualityLabel;
    this.fps = data.fps;
    this.url = data.url;
    this.cipher = data.cipher;
    this.signature_cipher = data.signatureCipher;
    this.audio_quality = data.audioQuality;
    this.approx_duration_ms = parseInt(data.approxDurationMs);
    this.audio_sample_rate = parseInt(data.audioSampleRate);
    this.audio_channels = data.audioChannels;
    this.loudness_db = data.loudnessDb;
    this.has_audio = !!data.audioBitrate || !!data.audioQuality;
    this.has_video = !!data.qualityLabel;

    if (this.has_audio) {
      const args = new URLSearchParams(this.cipher || this.signature_cipher);
      const url_components = new URLSearchParams(args.get('url') || this.url);

      this.language = url_components.get('xtags')?.split(':').find((x: string) => x.startsWith('lang='))?.split('=').at(1) || null;
      this.is_dubbed = url_components.get('xtags')?.split(':').find((x: string) => x.startsWith('acont='))?.split('=').at(1) === 'dubbed';
      this.is_descriptive = url_components.get('xtags')?.split(':').find((x: string) => x.startsWith('acont='))?.split('=').at(1) === 'descriptive';
      this.is_original = url_components.get('xtags')?.split(':').find((x: string) => x.startsWith('acont='))?.split('=').at(1) === 'original' || !this.is_dubbed;

      if (Reflect.has(data, 'audioTrack')) {
        this.audio_track = {
          audio_is_default: data.audioTrack.audioIsDefault,
          display_name: data.audioTrack.displayName,
          id: data.audioTrack.id
        };
      }
    }
  }

  /**
   * Deciphers the streaming url of the format.
   * @returns Deciphered URL.
   */
  decipher(player: Player | undefined): string {
    if (!player) throw new InnertubeError('Cannot decipher format, this session appears to have no valid player.');
    return player.decipher(this.url, this.signature_cipher, this.cipher);
  }
}