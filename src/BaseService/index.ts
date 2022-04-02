/*
 * adonisjs-sms
 *
 * (c) Ikrom Alizoda <ikrom.develop@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../adonis-typings/sms.ts" />

import {
  BaseServiceContract,
  MessageContract,
  ServiceContract,
  ServicesList,
  SmsManagerContract,
} from '@ioc:Adonis/Addons/Sms'

export abstract class BaseService implements BaseServiceContract<keyof ServicesList> {
  /**
   * Reference to the service. Assigned inside the service provider
   */
  public static sms: SmsManagerContract
  public sms = (this.constructor as typeof BaseService).sms

  /**
   * An optional method to use a custom service and its options
   */
  public service?: ServiceContract<any>

  /**
   * Prepare sms message
   */
  public abstract prepare(message: MessageContract): Promise<any> | any

  /**
   * Send sms
   */
  public async send() {
    return (this.service || this.sms.use()).send(async (message) => {
      await this.prepare(message)
    })
  }

  /**
   * Send sms by pushing it to the in-memory queue
   */
  public async sendLater() {
    return (this.service || this.sms.use()).sendLater(async (message) => {
      await this.prepare(message)
    })
  }
}
