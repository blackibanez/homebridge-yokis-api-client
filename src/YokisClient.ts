import axios, { AxiosResponse } from 'axios';
import { Logger } from 'homebridge';

const BASE_ENDPOINT = 'https://www.yokiscloud.fr/api/1_28/individuals/';

export class YokisBox {

  public readonly modules = new Map<string, YokisModule>();

  constructor(
    public readonly boxId: string,
  ) {}
}

export class YokisModule {

  public isOn = false;

  constructor(
    public readonly name: string,
    public readonly uid: string,
    public readonly boxId: string,
  ) {}
}
export class YokisClient {
  private readonly logger: Logger;
  private readonly username: string;
  private readonly password: string;
  userId?: string;
  public readonly boxes = new Map<string, YokisBox>();
  token?: string;

  constructor(logger: Logger, username: string, password: string) {
    this.logger = logger;
    this.username = username;
    this.password = password;
  }

  async postHttpRequest(url: string, payload: string): Promise<AxiosResponse> {
    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        return response;
      } else {
        throw new Error(`HTTP request failed with status code: ${response.status}`);
      }
    } catch (error) {
      this.logger.error('Error making HTTP request:', error);
      throw error;
    }
  }

  async authentifiedGetHttpRequest(url: string, token: string): Promise<AxiosResponse> {
    try {
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'token': token,
        },
      });

      if (response.status === 200) {
        return response;
      } else {
        throw new Error(`HTTP request failed with status code: ${response.status}`);
      }
    } catch (error) {
      this.logger.error('Error making HTTP request:', error);
      throw error;
    }
  }

  async authentifiedPostHttpRequest(url: string, token: string, payload): Promise<AxiosResponse> {
    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'token': token,
        },
      });

      if (response.status === 200) {
        return response;
      } else {
        throw new Error(`HTTP request failed with status code: ${response.status}`);
      }
    } catch (error) {
      this.logger.error('Error making HTTP request:', error);
      throw error;
    }
  }

  async loginUser() {
    const payload = JSON.stringify({'login': this.username, 'password': this.password});
    await this.postHttpRequest(BASE_ENDPOINT+'login', payload)
      .then((response) => {
        this.userId = response.data.id;
        this.boxes.clear();
        for (const box of response.data.boxes) {
          this.boxes.set(box.boxId, new YokisBox(box.boxId));
        }
        this.token = response.data.token;
      })
      .catch((error) => {
        this.logger.error('Error making HTTP request:', error);
      });
  }

  async fetchInstallation() {
    for (const box of this.boxes.values()) {
      const url = BASE_ENDPOINT + this.userId + '/box/' + box.boxId;

      await this.authentifiedGetHttpRequest(url, this.token!)
        .then((response) => {
          for (const module of response.data.modules) {
            if (module.function === 4) {
              box.modules.set(
                module.uid,
                new YokisModule(
                  module.name,
                  module.uid,
                  box.boxId,
                ),
              );
            }
          }
        })
        .catch((error) => {
          this.logger.error('Error making HTTP request:', error);
        });
    }
  }

  async fetchStatus() {
    for (const box of this.boxes.values()) {
      const url = BASE_ENDPOINT + this.userId + '/box/' + box.boxId + '/modulestable';

      await this.authentifiedGetHttpRequest(url, this.token!)
        .then((response) => {
          for (const module of response.data.data.table) {

            const currentModule = box.modules.get(module.uid);

            if (!currentModule) {
              continue;
            }

            const isOn = module.var !== 0;

            this.logger.debug(
              `Result of fetch status: module ${currentModule.name} is on: ${isOn}, var value: ${module.var}`,
            );

            currentModule.isOn = isOn;
          }
        })
        .catch((error) => {
          this.logger.error('Error making HTTP request:', error);
        });
    }
  }

  async toggleModule(module: YokisModule, on: boolean) {
    const url = BASE_ENDPOINT + this.userId + '/box/' + module.boxId + '/commands';
    const payload = JSON.stringify({
      cmd: `command.xml?action=order&id=${module.uid}&order=${on ? 'on' : 'off'}`,
    });

    await this.authentifiedPostHttpRequest(url, this.token!, payload)
      .then((response) => {
        this.logger.debug('Toggle Result:', response.data);
      })
      .catch((error) => {
        this.logger.error('Error making HTTP request:', error);
      });
  }
}