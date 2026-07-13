import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { YokisAPIPlatform } from './platform';
import { YokisModule } from './YokisClient';

export class YokisHTTPAccessory {
  private service: Service;
  private get module(): YokisModule {
    return this.accessory.context.device as YokisModule;
  }

  constructor(
    private readonly platform: YokisAPIPlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        'Yokis',
      )
      .setCharacteristic(
        this.platform.Characteristic.Model,
        'MTR2000ER',
      )
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        this.module.uid,
      );

    this.service =
      this.accessory.getService(this.platform.Service.Lightbulb)||
      this.accessory.addService(this.platform.Service.Lightbulb);

    this.service.setCharacteristic(
      this.platform.Characteristic.Name,
      this.module.name,
    );

    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    setInterval(() => {
      this.updateAccessoryState();
    }, 500);
  }

  async updateAccessoryState() {
    try {
      this.platform.log.debug(
        `Updating accessory state: accessory ${this.module.name} is on: ${this.module.isOn}`,
      );

      this.service.updateCharacteristic(
        this.platform.Characteristic.On,
        this.module.isOn,
      );
    } catch (error) {
      this.platform.log.error(
        '[updateAccessoryState] Error on getModuleStatus response:',
        error,
      );
    }
  }

  async setOn(value: CharacteristicValue) {
    await this.platform.client.toggleModule(
      this.module,
      value as boolean,
    );

    this.module.isOn = value as boolean;

    this.updateAccessoryState();

    this.platform.log.debug('Set Characteristic On ->', value);
  }

  async getOn(): Promise<CharacteristicValue> {
    this.platform.log.debug(
      `Getting characteristic on status for accessory ${this.module.name} is on: ${this.module.isOn}`,
    );

    return this.module.isOn;
  }
}
