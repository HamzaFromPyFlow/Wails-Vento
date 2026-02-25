import videojs from "video.js";

const Button = videojs.getComponent("Button");
const Component = videojs.getComponent("Component");

class CaptionButton extends Component {
  constructor(_player, _options) {
    super(_player, _options);

    this.options = _options;
    this.player = _player;

    const captionButton = (this.captionButton = this.player.controlBar.addChild(
      "button",
      {},
      12
    ));

    captionButton.controlText("Toggle Caption");
    captionButton.addClass("caption-button");
    captionButton.addClass("vjs-disabled");

    if (!this.options.src) {
      captionButton.addClass("vjs-hidden");
    }

    captionButton.el().addEventListener("pointerdown", () => {
      this.toggleCaption();
    });
  }

  toggleCaption(state) {
    if (!this.options.src) {
      console.log("No caption available");
      return;
    }

    if (!this.track) {
      this.track = this.player.addRemoteTextTrack(this.options, false);
    }

    const textTracks = this.player.textTracks();

    for (let i = 0; i < textTracks.length; i++) {
      const textTrack = textTracks[i];
      if (
        textTrack.kind === this.options.kind &&
        textTrack.label === this.options.label
      ) {
        if (textTrack.mode === "showing" || state === false) {
          this.captionButton.addClass("vjs-disabled");
          this.captionButton.removeClass("vjs-active");

          textTrack.mode = "disabled";
        } else if (textTrack.mode === "disabled" || state === true) {
          this.captionButton.removeClass("vjs-disabled");
          this.captionButton.addClass("vjs-active");

          textTrack.mode = "showing";
        }
      }
    }
  }

  updateOption(_options) {
    this.options = _options;

    if (!this.options.src) {
      this.captionButton.addClass("vjs-hidden");
      this.toggleCaption(false);
    } else {
      this.captionButton.removeClass("vjs-hidden");
      this.toggleCaption(true);
    }
  }
}

export default CaptionButton;

