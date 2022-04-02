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
  MessageComposeCallback,
  QueueMonitorCallback,
  ServiceContract,
  ServicesList,
  SmsConfig,
  SmsDriverContract,
  SmsManagerContract,
  TrapCallback,
} from '@ioc:Adonis/Addons/Sms'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { Manager } from '@poppinss/manager'
import { ManagerConfigValidator } from '@poppinss/utils'
import fastq from 'fastq'
import { BaseService } from '../BaseService'
import { Service } from './Service'

/**
 * The manager exposes the API to pull instance of [[Service]] class for pre-defined mappings
 * in the config file. The manager internally manages the state of mappings and cache
 * them for re-use.
 */
export class SmsManager
  extends Manager<
    ApplicationContract,
    SmsDriverContract,
    ServiceContract<keyof ServicesList>,
    {
      [P in keyof ServicesList]: ServiceContract<keyof ServicesList>
    }
  >
  implements SmsManagerContract
{
  /**
   * Caching driver instances. One must call `close` to clean it up
   */
  protected singleton = true

  /**
   * Reference to the fake driver
   */
  private fakeService?: ServiceContract<any>

  /**
   * Sms queue to scheduling sms to be delivered later
   */
  private smsQueue = fastq(this, this.sendQueuedSms, 10)

  /**
   * Method to monitor in-memory sms queue
   */
  private queueMonitor: QueueMonitorCallback = (error) => {
    if (error) {
      this.logger.error(
        {
          to: error.sms.message.to,
          message: error.message,
        },
        'Unable to deliver sms'
      )
    }
  }

  /**
   * Reference to the base service since Ioc container doesn't allow
   * multiple exports
   */
  public BaseService = BaseService

  /**
   * Dependencies from the "@adonisjs/core" and "@adonisjs/view". The manager classes
   * in AdonisJS codebase heavily relies on the container and hence we can pull
   * container bindings directly here.
   */
  public view = this.app.container.hasBinding('Adonis/Core/View')
    ? this.app.container.use('Adonis/Core/View')
    : undefined

  public emitter = this.app.container.use('Adonis/Core/Event')
  public logger = this.app.container.use('Adonis/Core/Logger')
  public profiler = this.app.container.use('Adonis/Core/Profiler')

  constructor(private app: ApplicationContract, private config: SmsConfig) {
    super(app)
    this.BaseService.sms = this
    this.validateConfig()
  }

  /**
   * Validate config at runtime
   */
  private validateConfig() {
    const validator = new ManagerConfigValidator(this.config, 'sms', 'config/sms')
    validator.validateDefault('service')
    validator.validateList('services', 'service')
  }

  /**
   * Sends the sms by pulling it from the queue. This method is invoked
   * automatically by fastq.
   */
  private async sendQueuedSms(
    sms: CompiledSmsNode,
    cb: (error: null | any, response?: any) => void
  ) {
    try {
      const response = await this.use(sms.service).sendCompiled(sms)
      cb(null, { sms, response })
    } catch (error) {
      error.sms = sms
      cb(error)
    }
  }

  /**
   * Since we don't expose the drivers instances directly, we wrap them
   * inside the service instance.
   */
  protected wrapDriverResponse<Name extends keyof ServicesList>(
    mappingName: Name,
    driver: SmsDriverContract
  ): ServiceContract<Name> {
    return new Service(mappingName, this, true, driver)
  }

  /**
   * Returns the driver name for a given mapping
   */
  protected getMappingDriver(name: string) {
    const config = this.getMappingConfig(name)
    return config && config.driver
  }

  /**
   * Returns the config for a given mapping
   */
  protected getMappingConfig(name: string) {
    return this.config.services[name]
  }

  /**
   * Returns the name of the default mapping
   */
  protected getDefaultMappingName() {
    return this.config.service
  }

  /**
   * Creates an instance of `plivo` driver by lazy loading. This method
   * is invoked internally when a new driver instance is required
   */
  protected createPlivo(_: string, config: any) {
    const { PlivoDriver } = require('../Drivers/Plivo')
    return new PlivoDriver(config, this.logger)
  }

  /**
   * Method to schedule sms for sending. This method is invoked by
   * the service when `sendLater` method is called
   */
  public scheduleSms(sms: CompiledSmsNode) {
    this.smsQueue.push(sms, this.queueMonitor as any)
  }

  /**
   * Fake sms calls. The "sendLater" sms will be invoked right
   * away as well
   */
  public trap(callback: TrapCallback) {
    const { FakeDriver } = require('../Drivers/Fake')
    this.fakeService = new Service('fake' as any, this, false, new FakeDriver(callback))
  }

  /**
   * Define a callback to monitor sms queue
   */
  public monitorQueue(callback: QueueMonitorCallback): void {
    this.queueMonitor = callback
  }

  /**
   * Restore previously created trap.
   */
  public restore() {
    this.fakeService = undefined
  }

  /**
   * Sends sms using the default `service`
   */
  public async send(callback: MessageComposeCallback) {
    if (this.fakeService) {
      return this.fakeService.send(callback)
    }
    return this.use().send(callback)
  }

  /**
   * Send sms by pushing it to the in-memory queue
   */
  public async sendLater(callback: MessageComposeCallback) {
    if (this.fakeService) {
      return this.fakeService.sendLater(callback)
    }
    return this.use().sendLater(callback)
  }

  /**
   * Use a named or the default service
   */
  public use(name?: keyof ServicesList) {
    if (this.fakeService) {
      return this.fakeService
    }

    return name ? super.use(name) : super.use()
  }

  /**
   * Closes the mapping instance and removes it from the cache
   */
  public async close(name?: keyof ServicesList): Promise<void> {
    const service = name ? this.use(name) : this.use()
    await service.close()
  }

  /**
   * Closes the mapping instance and removes it from the cache
   */
  public async closeAll(): Promise<void> {
    await Promise.all(
      Array.from(this['mappingsCache'].keys()).map((name: string) => this.close(name as any))
    )
  }
}
