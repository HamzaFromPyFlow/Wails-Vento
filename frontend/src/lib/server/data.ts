// Desktop version - simplified server data helpers
// Note: Desktop apps don't use Next.js server components

import type { RecordingModel } from "@schema/index";
import webAPI from "../webapi";

export async function getRecording(id: string) {
  // Get token from localStorage (desktop equivalent of cookies)
  // In a real implementation, you might want to get this from an auth store or secure storage
  const token = typeof window !== "undefined" 
    ? localStorage.getItem("vento-token") 
    : undefined;

  let res: RecordingModel | undefined;
  if (token) {
    res = await webAPI.recording.recordingGetRecording(id).catch((err: any) => {
      console.log("Error retrieving Recording Info: ", err);
      return undefined;
    });
  }

  return res;
}
