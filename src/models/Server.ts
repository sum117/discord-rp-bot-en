import { dndPlugin } from "@/plugins/dndPlugin";
import { moneyPlugin } from "../plugins/moneyPlugin";
import type { ServerType } from "../services/serverService";

export default class Server implements ServerType {
  id: string;
  moneyPluginEnabled: boolean;
  dndPluginEnabled: boolean;
  constructor(data: ServerType) {
    this.id = data.id;
    this.moneyPluginEnabled = data.moneyPluginEnabled;
    this.dndPluginEnabled = data.dndPluginEnabled;
  }

  public getPlugins() {
    const plugins = [];
    if (this.moneyPluginEnabled) {
      plugins.push(moneyPlugin);
    }
    if (this.dndPluginEnabled) {
      plugins.push(dndPlugin);
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
    return this;
  }

  public removePlugin(pluginName: string) {
    if (pluginName === moneyPlugin.name) {
      this.moneyPluginEnabled = false;
    }
    if (pluginName == dndPlugin.name) {
      this.dndPluginEnabled = false;
    }
    return this;
  }
}
