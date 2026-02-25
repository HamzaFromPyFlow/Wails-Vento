// Desktop: use the shared helper from renderer/lib via the alias
import { logClientEvent } from "@lib/misc";
import videojs from "video.js";

const ModalDialog = videojs.getComponent("ModalDialog");
const Component = videojs.getComponent("Component");

class EndVideoModal extends Component {
  constructor(player, options) {
    super(player, options);
    this.options = options;

    const overlay = document?.querySelector(".video-end-modal-container");
    const closeBtn = overlay?.querySelector(".video-end-modal-declineBtn");

    if (!overlay) {
      return;
    }

    closeBtn?.addEventListener("click", () => {
      logClientEvent("click.ignore", {
        type: "video end modal",
      });

      this.toggle(false);
    });

    this.modal = new ModalDialog(player, {
      content: overlay,
      temporary: false,
    });

    player.addChild(this.modal);
    this.modal.addClass("video-end-modal");

    player.on("pause", () => {
      const annotationPopupModal = document.querySelector(
        ".vjs-modal-dialog.annotation-popup"
      );

      if (
        this.options.visible &&
        !player.seeking() &&
        !annotationPopupModal.classList.contains("visible")
      ) {
        this.modal.open();
        this.modal.addClass("visible");
      }
    });

    player.on("ended", () => {
      if (this.options.visible) {
        this.modal.open();
        this.modal.addClass("visible");
      }
    });
  }

  toggle(enable) {
    this.options.visible = enable;
    this.modal?.toggleClass("visible", enable);

    if (enable) {
      this.modal?.open();
    } else {
      this.modal?.close();
    }
  }
}

export default EndVideoModal;

