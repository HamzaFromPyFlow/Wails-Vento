const pageViewEvents = [
  "page.view.recording",
  "page.view.viewRecording",
  "page.view.new",
  "page.view.home",
  "page.view.login",
  "page.view.pricing",
] as const;

const eventType = [
  ...pageViewEvents,
  "modal.open.upsell",
  "click.buyCoffee",
  "click.header.login",
  "click.header.signup",
  "click.viewRecord",
  "click.recording.more",
  "click.goRecordPage",
  "click.startRecord",
  "click.pauseRecord",
  "click.try.extension",
  "click.try.vento",
  "click.editor.metadata",
  "click.ignore",
  "click.rewind",
  "click.saveVideo",
  "click.cancelVideo",
  "click.cancelEdit",
  "click.jumpToLastRewind",
  "click.download",
  "click.downloadTranscript",
  "click.signIn",
  "click.signUp.toSave",
  "click.copy.link",
  "click.pricing.monthly",
  "click.pricing.yearly",
  "click.pricing.ltd",
  "click.pricing.deleteCta",
  "click.pricing.yourRecordings",
  "click.pricing.modalUpsell",
  "click.pricing.ignoreUpsell",
] as const;
export type EventType = (typeof eventType)[number];

const userPropertyType = [
  // Incrementable counters
  "cnt.videoCreate",
  "cnt.videoView",
  "cnt.pauseRecord",
  "cnt.rewind",
  "cnt.saveVideo",
  "cnt.cancelVideo",
  "cnt.jumpToLastRewind",

  // Bool -> Set once
  "hasClickedAccountCreate",
  "hasClickedExtensionUpsell",

  // Current state, will toggle
  "isLoggedIn",
  "isExtensionInstalled",
] as const;
export type UserPropertyType = (typeof userPropertyType)[number];

export const setOnceEventToUserProp: { [key in EventType]?: UserPropertyType } =
  {
    "click.signIn": "hasClickedAccountCreate",
    "click.try.extension": "hasClickedExtensionUpsell",
  };

export const incrementEventToUserProp: {
  [key in EventType]?: UserPropertyType;
} = {
  "click.startRecord": "cnt.videoCreate",
  "page.view.recording": "cnt.videoView",
  "click.pauseRecord": "cnt.pauseRecord",
  "click.rewind": "cnt.rewind",
  "click.saveVideo": "cnt.saveVideo",
  "click.cancelVideo": "cnt.cancelVideo",
  "click.jumpToLastRewind": "cnt.jumpToLastRewind",
};
