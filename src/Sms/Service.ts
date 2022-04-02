/*
 * adonisjs-sms
 *
 * (c) Ikrom Alizoda <ikrom.develop@gsms.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../adonis-typings/sms.ts" />

import {
  CompiledSmsNode,
  DriverOptionsType,
  MessageComposeCallback,
  ServiceContract,
  ServiceResponseType,
  ServicesList,
} from '@ioc:Adonis/Addons/Sms'
import { Message } from '../Message'
import { SmsManager } from './SmsManager'

/**
 * Service exposes the unified API to send sms using one of the pre-configure
 * driver
 */
export class Service<Name extends keyof ServicesList> implements ServiceContract<Name> {
  private driverOptions?: DriverOptionsType<ServicesList[Name]['implementation']>

  constructor(
    public name: Name,
    private manager: SmsManager,
    private useQueue: boolean,
    public driver: ServicesList[Name]['implementation']
  ) {}

  /**
   * Ensure "@adonisjs/view" is installed
   */
  private ensureView(methodName: string) {
    if (!this.manager.view) {
      throw new Error(`"@adonisjs/view" must be installed before using "message.${methodName}"`)
    }
  }

  /**
   * Set the sms contents by rendering the views. Views are only
   * rendered when inline values are not defined.
   */
  private async setSmsContent({ message, views }: CompiledSmsNode) {
    if (!message.text && views.text) {
      this.ensureView('textView')
      message.text = await this.manager.view!.render(views.text.template, views.text.data)
    }
  }

  /**
   * Define options to be forwarded to the underlying driver
   */
  public options(options: DriverOptionsType<ServicesList[Name]['implementation']>): this {
    this.driverOptions = options
    return this
  }

  /**
   * Sends sms using a pre-compiled message. You should use [[ServiceContract.send]], unless
   * you are pre-compiling messages yourself
   */
  public async sendCompiled(sms: CompiledSmsNode) {
    /**
     * Set content by rendering views
     */
    await this.setSmsContent(sms)

    /**
     * Send sms for real
     */
    const response = await this.driver.send(sms.message)

    /**
     * Emit event
     */
    this.manager.emitter.emit('sms:sent', {
      message: sms.message,
      views: Object.keys(sms.views).map((view) => sms.views[view].template),
      service: sms.service,
      response: response,
    })

    return response as unknown as Promise<ServiceResponseType<Name>>
  }

  /**
   * Sends sms
   */
  public async send(
    callback: MessageComposeCallback,
    config?: DriverOptionsType<ServicesList[Name]>
  ) {
    const message = new Message()
    await callback(message)

    const compiledMessage = message.toJSON()
    return this.sendCompiled({
      message: compiledMessage.message,
      views: compiledMessage.views,
      service: this.name,
      config: config || this.driverOptions,
    })
  }

  /**
   * Send sms later by queuing it inside an in-memory queue
   */
  public async sendLater(
    callback: MessageComposeCallback,
    config?: DriverOptionsType<ServicesList[Name]>
  ) {
    if (!this.useQueue) {
      await this.send(callback, config)
      return
    }

    const message = new Message()
    await callback(message)

    const compiledMessage = message.toJSON()
    return this.manager.scheduleSms({
      message: compiledMessage.message,
      views: compiledMessage.views,
      service: this.name,
      config: config || this.driverOptions,
    })
  }

  /**
   * Invokes `close` method on the driver
   */
  public async close() {
    await this.driver.close()
    this.manager.release(this.name)
  }
}
