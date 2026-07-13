<p align="center">
<img src="https://raw.githubusercontent.com/homebridge/branding/latest/logos/homebridge-color-round-stylized.png" height="140">
<img src="https://www.yokis.com/wp-content/themes/yokis/images/yokis.svg" height="100">
</p>

<span align="center">

# Homebridge Yokis API Client Plugin

</span>

Control your Yokis MTR2000ER radio switches (and more) through Homebridge using this plugin. 
This plugin allows you to integrate your Yokis devices with Apple's HomeKit ecosystem, providing you with convenient and seamless control over your smart home devices.

### Prerequisites

Before you begin, ensure you have the following:

- A Yokis Hub: This plugin relies on the Yokis Hub platform to communicate with your Yokis devices. Ensure that your Yokis Hub is properly set up (through the Yokis Pro app, only available on Android tablets) and connected to the internet.
- A Yokis account: You can either use your main Yokis account configured through the Yno app, or create a sub account dedicated to the use of this plugin.

### Installation

You can install this plugin from the web interface. Alternatively you can install it with:

```shell
npm install -g homebridge-yokis-api-client
```

### Configuration

The following need to be added to your configuration before the plugin can start and work.

Please enter the username and password you use in your Yokis YnO app.

Example configuration:

```json
{
    "platform": "YokisAPIClient",
    "name": "YokisAPIClient",
    "username": "foo@bar.xyz",
    "password": "P@ssw0rd"
}
```