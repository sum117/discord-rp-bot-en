import { type CommandInteraction, Message } from "discord.js";
import Waifuvault from "waifuvault-node-api";

export default class CommonService {
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

  public static wait(time: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, time);
    });
  }

  public static getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
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

  public static randomIntFromInterval(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  public static async uploadToWaifuvault(url: string) {
    const parsedUrl = new URL(url);
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadedFile = await Waifuvault.uploadFile({
      file: buffer,
      filename: parsedUrl.pathname.split("/").pop() ?? "image.png",
    });
    return uploadedFile.url;
  }
}
