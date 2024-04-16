import { Message, type CommandInteraction } from "discord.js";
import ImgurClient from "imgur";

export default class CommonService {
  public static imgurClient = new ImgurClient({ clientId: Bun.env.IMGUR_CLIENT_ID });
  public static async tryDeleteMessage(messageOrCommand: Message | CommandInteraction, time?: number) {
    try {
      if (time) {
        await CommonService.wait(time);
      }
      if (messageOrCommand instanceof Message) {
        await messageOrCommand.delete();
      } else {
        await messageOrCommand.deleteReply();
      }
    } catch (error) {
      console.error("Failed to delete message", error);
    }
  }

  public static splitCamelCaseString(input: string) {
    return input.replace(/([a-z](?=[A-Z]))/g, "$1 ");
  }

  public static async wait(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  public static getRandomColor() {
    var letters = "0123456789ABCDEF";
    var color = "#";
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  public static isAbsoluteImageUrl(url: string) {
    try {
      const parsedUrl = new URL(url);
      const allowedImageExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
      parsedUrl.search = "";
      parsedUrl.hash = "";
      return (
        parsedUrl.protocol === "https:" &&
        parsedUrl.host !== "" &&
        parsedUrl.pathname !== "" &&
        allowedImageExtensions.some((ext) => parsedUrl.pathname.endsWith(ext))
      );
    } catch (error) {
      return false;
    }
  }

  public static async uploadToImgur(imageUrl: string) {
    const upload = await this.imgurClient.upload({
      name: new URL(imageUrl).pathname.split("/").pop(),
      image: imageUrl,
      description: `Uploaded with RoleplayBot by Discord user at  ${new Date().toISOString()}`,
      type: "url",
      title: "RoleplayBot Image Upload",
    });
    return upload.data.link;
  }

  public static randomIntFromInterval(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
