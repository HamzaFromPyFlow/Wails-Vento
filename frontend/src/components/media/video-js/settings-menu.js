import videojs from "video.js";

const MenuButton = videojs.getComponent("MenuButton");
const Menu = videojs.getComponent("Menu");
const MenuItem = videojs.getComponent("MenuItem");

class SettingsMenuButton {
  constructor(player, _options) {
    this.options = _options;

    const sourceItems = {
      "Picture-in-Picture": () => {
        if (player.isInPictureInPicture()) {
          player.exitPictureInPicture();
        } else {
          player.requestPictureInPicture();
        }
      },
      Download: () => {
        const src = player.src();

        if (this.options?.redirectLink) {
          window.location.href = this.options.redirectLink;
        } else if (src) {
          const downloadEl = document.createElement("a");
          downloadEl.href = src;

          downloadEl.download = "Vento-" + new Date().toISOString() + ".mp4";

          document.body.appendChild(downloadEl);
          downloadEl.click();
          document.body.removeChild(downloadEl);
        }
      },
    };
    const sourceMenu = new Menu(player);

    for (const itemKey in sourceItems) {
      const handler = sourceItems[itemKey];

      const sourceMenuItem = new MenuItem(player, { label: itemKey });

      sourceMenuItem.el_.addEventListener("pointerdown", () => {
        handler();
      });
      sourceMenu.addItem(sourceMenuItem);
    }

    const sourceMenuButton = new MenuButton(player);
    sourceMenuButton.addChild(sourceMenu, {}, 1);
    sourceMenuButton.controlText("settings menu button");

    sourceMenuButton.addClass("settings-menu-button");
    player.controlBar.addChild(sourceMenuButton, {}, 20);
  }
}

export default SettingsMenuButton;

