import { dndPlugin } from "@/plugins/dndPlugin";

import { moneyPlugin } from "../plugins/moneyPlugin";
import type { ServerType } from "../services/serverService";

import { streakPlugin } from "../plugins/streakPlugin";

export default class Server implements ServerType {
  id: string;
  //TODO: refactor this monstrosity of a plugin system
  moneyPluginEnabled: boolean;
  dndPluginEnabled: boolean;
  streakPluginEnabled: boolean;
  constructor(data: ServerType) {
    this.id = data.id;
    this.moneyPluginEnabled = data.moneyPluginEnabled;
    this.dndPluginEnabled = data.dndPluginEnabled;
    this.streakPluginEnabled = data.streakPluginEnabled;
  }

  public getPlugins() {
    const plugins = [];
    if (this.moneyPluginEnabled) {
      plugins.push(moneyPlugin);
    }
    if (this.dndPluginEnabled) {
      plugins.push(dndPlugin);
    }

    if (this.streakPluginEnabled) {
      plugins.push(streakPlugin);
    }

    return plugins;
  }

  public addPlugin(pluginName: string) {
    if (pluginName === moneyPlugin.name) {
      this.moneyPluginEnabled = true;
    }
    if (pluginName === dndPlugin.name) {
      this.dndPluginEnabled = true;
    }
    if (pluginName === streakPlugin.name) {
      this.streakPluginEnabled = true;
    }
    return this;
  }

  public removePlugin(pluginName: string) {
    if (pluginName === moneyPlugin.name) {
      this.moneyPluginEnabled = false;
    }
    if (pluginName == dndPlugin.name) {
      this.dndPluginEnabled = false;
    }
    if (pluginName == streakPlugin.name) {
      this.streakPluginEnabled = false;
    }
    return this;
  }
}
