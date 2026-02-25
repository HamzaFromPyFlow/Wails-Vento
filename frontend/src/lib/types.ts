import { RecordingModel } from "@schema/index";

export const transcriptionLanguage = [
  { label: "Bulgarian", value: "bg" },
  { label: "Catalan", value: "ca" },
  { label: "Chinese", value: "zh" },
  { label: "Chinese (China)", value: "zh-CN" },
  { label: "Chinese (Taiwan)", value: "zh-TW" },
  { label: "Chinese (Simplified)", value: "zh-Hans" },
  { label: "Chinese (Traditional)", value: "zh-Hant" },
  { label: "Czech", value: "cs" },
  { label: "Danish", value: "da" },
  { label: "Danish (Denmark)", value: "da-DK" },
  { label: "Dutch", value: "nl" },
  { label: "English", value: "en" },
  { label: "English (United States)", value: "en-US" },
  { label: "English (Australia)", value: "en-AU" },
  { label: "English (United Kingdom)", value: "en-GB" },
  { label: "English (New Zealand)", value: "en-NZ" },
  { label: "English (India)", value: "en-IN" },
  { label: "Estonian", value: "et" },
  { label: "Finnish", value: "fi" },
  { label: "Flemish", value: "nl-BE" },
  { label: "French", value: "fr" },
  { label: "French (Canada)", value: "fr-CA" },
  { label: "German", value: "de" },
  { label: "German (Switzerland)", value: "de-CH" },
  { label: "Greek", value: "el" },
  { label: "Hindi", value: "hi" },
  { label: "Hungarian", value: "hu" },
  { label: "Indonesian", value: "id" },
  { label: "Italian", value: "it" },
  { label: "Japanese", value: "ja" },
  { label: "Korean", value: "ko" },
  { label: "Korean (South Korea)", value: "ko-KR" },
  { label: "Latvian", value: "lv" },
  { label: "Lithuanian", value: "lt" },
  { label: "Malay", value: "ms" },
  { label: "Multilingual (Spanish + English)", value: "multi" },
  { label: "Norwegian", value: "no" },
  { label: "Polish", value: "pl" },
  { label: "Portuguese", value: "pt" },
  { label: "Portuguese (Brazil)", value: "pt-BR" },
  { label: "Romanian", value: "ro" },
  { label: "Russian", value: "ru" },
  { label: "Slovak", value: "sk" },
  { label: "Spanish", value: "es" },
  { label: "Spanish (Latin America)", value: "es-419" },
  { label: "Swedish", value: "sv" },
  { label: "Swedish (Sweden)", value: "sv-SE" },
  { label: "Thai", value: "th" },
  { label: "Thai (Thailand)", value: "th-TH" },
  { label: "Turkish", value: "tr" },
  { label: "Ukrainian", value: "uk" },
  { label: "Vietnamese", value: "vi" }
];

export type RecordingModalItem = RecordingModel & {
  isEditable: boolean;
  recordingTimeStr?: string;
};

export enum CtaType {
  TEXT_LINK = "TEXT_LINK",
}

export type CtaLink = {
  id: string
  time: number;
  Ctatype: CtaType;
  linkCtaText: string;
  linkCtaUrl: string;
  isActive: boolean;
};

export enum UPLOAD_STATUS {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED"
}

export type UploadMsg = {
  recordingId: string;
  status: UPLOAD_STATUS;
  progress?: number;
}


export type VideoType = {
  id: string;
  name: string;
  duration: string;
  owner: string;
  date: string;
  isArchived: boolean;
  matchedTranscript: boolean;
};

export type FolderType = {
  id: string;
  name: string;
  owner: string;
  isArchived: boolean;
  videoCount: number;
};

export type SearchResultType =
  | { type: "folder"; data: FolderType }
  | { type: "video"; data: VideoType };
