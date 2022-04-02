/*
 * adonisjs-sms
 *
 * (c) Ikrom Alizoda <ikrom.develop@gsms.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApplicationContract } from '@ioc:Adonis/Core/Application'

/**
 * Sms provider to register service specific bindings
 */
export default class SmsProvider {
  constructor(protected app: ApplicationContract) {}
  public static needsApplication = true

  /**
   * Register bindings with the container
   */
  public register() {
    this.app.container.singleton('Adonis/Addons/Sms', () => {
      const config = this.app.container.resolveBinding('Adonis/Core/Config').get('sms', {})
      const { SmsManager } = require('../src/Sms/SmsManager')
      return new SmsManager(this.app, config)
    })
  }

  /**
   * Close all drivers when shutting down the app
   */
  public async shutdown() {
    await this.app.container.resolveBinding('Adonis/Addons/Sms').closeAll()
  }
}
