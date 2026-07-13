import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { YokisHTTPAccessory } from './platformAccessory';
import { YokisClient } from './YokisClient';

export class YokisAPIPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  public readonly accessories: PlatformAccessory[] = [];
  public client!: YokisClient;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    if (!config.username || !config.password) {
      this.log.debug('Configuration missing, no username and/or password');
    } else {
      this.client = new YokisClient(log, config.username, config.password);
      this.log.debug('Finished initializing platform:', this.config.name);

      this.api.on('didFinishLaunching', () => {
        log.debug('Executed didFinishLaunching callback');
        this.discoverDevices();
      });
    }
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    this.accessories.push(accessory);
  }

  async discoverDevices() {
    await this.client.loginUser();
    await this.client.fetchInstallation();

    for (const box of this.client.boxes.values()) {

      for (const module of box.modules.values()) {

        const uuid = this.api.hap.uuid.generate(
          `Yokis-MTR2000ER-${box.boxId}-${module.uid}`,
        );

        const existingAccessory = this.accessories.find(
          accessory => accessory.UUID === uuid,
        );

        if (existingAccessory) {
          this.log.debug(
            'Restoring existing accessory from cache:',
            existingAccessory.displayName,
          );

          existingAccessory.context.device = module;

          new YokisHTTPAccessory(this, existingAccessory);

        } else {

          this.log.debug('Adding new accessory:', module.name);

          const accessory = new this.api.platformAccessory(
            module.name,
            uuid,
          );

          accessory.context.device = module;

          new YokisHTTPAccessory(this, accessory);

          this.api.registerPlatformAccessories(
            PLUGIN_NAME,
            PLATFORM_NAME,
            [accessory],
          );
        }
      }
    }
    setInterval(() => {
      this.fetchStatus();
    }, 10000);
  }

  async fetchStatus() {
    await this.client.fetchStatus();
  }
}
