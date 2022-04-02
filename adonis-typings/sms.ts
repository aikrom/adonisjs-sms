/*
 * adonisjs-sms
 *
 * (c) Ikrom Alizoda <ikrom.develop@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Addons/Sms' {
  import { ApplicationContract } from '@ioc:Adonis/Core/Application'
  import { ManagerContract } from '@poppinss/manager'
  import { MessageResponse } from 'plivo/dist/resources/messages'

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  /**
   * Unwraps value of a promise type
   */
  export type UnwrapPromise<T> = T extends PromiseLike<infer U> ? U : T

  /**
   * Infers the response type of a driver
   */
  export type DriverResponseType<Driver> = Driver extends SmsDriverContract
    ? UnwrapPromise<ReturnType<Driver['send']>>
    : never

  /**
   * Infers the response type of a service
   */
  export type ServiceResponseType<Name extends keyof ServicesList> = DriverResponseType<
    ServicesList[Name]['implementation']
  >

  /**
   * Infers the 2nd argument accepted by the driver send method
   */
  export type DriverOptionsType<Driver> = Driver extends SmsDriverContract
    ? Parameters<Driver['send']>[1]
    : never

  /*
  |--------------------------------------------------------------------------
  | Message
  |--------------------------------------------------------------------------
  */

  /**
   * Shape of envolpe
   */
  export type EnvolpeNode = { from?: string; to?: string }
  export type PostSentEnvolpeNode = { from: string; to: string[] }

  /**
   * Shape of the recipient
   */
  export type RecipientNode = { phone: string }

  /**
   * Shape of data view defined on the message
   */
  export type MessageContentViewsNode = {
    text?: {
      template: string
      data?: any
    }
  }

  /**
   * Message node is compatible with nodeservice `sendSms` method
   */
  export type MessageNode = {
    from?: RecipientNode
    to?: RecipientNode[]
    text?: string
  }

  /**
   * Shape of the message instance passed to `send` method callback
   */
  export interface MessageContract {
    /**
     * Common fields
     */
    to(phone: string): this
    from(phone: string): this

    /**
     * Content options
     */
    textView(template: string, data?: any): this
    text(content: string): this

    toJSON(): {
      message: MessageNode
      views: MessageContentViewsNode
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Drivers Interface
  |--------------------------------------------------------------------------
  */

  /**
   * Shape of the driver contract. Each driver must adhere to
   * this interface
   */
  export interface SmsDriverContract {
    send(message: MessageNode, config?: any): Promise<any>
    close(): void | Promise<void>
  }

  /*
  |--------------------------------------------------------------------------
  | Config Helpers
  |--------------------------------------------------------------------------
  */

  /**
   * A shortcut to define `config` and `implementation` keys on the
   * `ServicesList` interface. Using this type is not mandatory and
   * one can define the underlying keys by themselves.
   * For example:
   *
   * ```
   * ServicesList: {
   *   transactional: {
   *     config: SmtpConfig,
   *     implementation: SmtpDriverContract,
   *   }
   * }
   * ```
   *
   * The shortcut is
   *
   * ```
   * ServicesList: {
   *   transactional: SmsDrivers['smtp']
   * }
   * ```
   */
  export type SmsDrivers = {
    plivo: {
      config: PlivoConfig
      implementation: PlivoDriverContract
    }
  }

  /**
   * Using declaration merging, one must extend this interface.
   * --------------------------------------------------------
   * MUST BE SET IN THE USER LAND.
   * --------------------------------------------------------
   */
  export interface ServicesList {}

  /*
  |--------------------------------------------------------------------------
  | Service Config
  |--------------------------------------------------------------------------
  */

  /**
   * Shape of the service config computed from the `ServicesList` interface.
   * The `ServicesList` is extended in the user codebase.
   */
  export type SmsConfig = {
    service: keyof ServicesList
    services: { [P in keyof ServicesList]: ServicesList[P]['config'] }
  }

  /*
  |--------------------------------------------------------------------------
  | Plivo driver
  |--------------------------------------------------------------------------
  */

  /**
   * Plivo driver config
   */
  export type PlivoConfig = {
    driver: 'ses'
    authId: string
    authToken: string
    from: string
  }

  /**
   * Shape of sms response for the ses driver
   */
  export type PlivoResponse = MessageResponse

  /**
   * Shape of the ses driver
   */
  export interface PlivoDriverContract extends SmsDriverContract {
    send(message: MessageNode): Promise<PlivoResponse>
  }

  /*
  |--------------------------------------------------------------------------
  | Service & Manager
  |--------------------------------------------------------------------------
  */

  /**
   * Shape of the callback passed to the `send` method to compose the
   * message
   */
  export type MessageComposeCallback = (message: MessageContract) => void | Promise<void>

  /**
   * Callback to wrap sms
   */
  export type TrapCallback = (message: MessageNode) => any

  /**
   * Callback to monitor queues response
   */
  export type QueueMonitorCallback = (
    error?: Error & { sms: CompiledSmsNode },
    response?: {
      sms: CompiledSmsNode
      response: ServiceResponseType<keyof ServicesList>
    }
  ) => void

  /**
   * Shape of the compiled sms.
   */
  export type CompiledSmsNode = {
    message: MessageNode
    views: MessageContentViewsNode
    service: keyof ServicesList
    config?: any
  }

  /**
   * Packet emitted by the `adonis:sms:sent` event
   */
  export type SmsEventData = {
    message: MessageNode
    views: string[]
    service: keyof ServicesList
    response: ServiceResponseType<keyof ServicesList>
  }

  /**
   * Service exposes the unified API to send sms by using a given
   * driver
   */
  export interface ServiceContract<Name extends keyof ServicesList> {
    /**
     * Service name
     */
    readonly name: Name

    /**
     * The driver in use
     */
    readonly driver: ServicesList[Name]['implementation']

    /**
     * Sends sms using a pre-compiled message. You should use [[ServiceContract.send]]
     * or [[ServiceContract.sendLater]], unless you are pre-compiling messages
     * yourself.
     */
    sendCompiled(sms: CompiledSmsNode): Promise<ServiceResponseType<Name>>

    /**
     * Define options to the passed to the sms driver send method
     */
    options(options: DriverOptionsType<ServicesList[Name]['implementation']>): this

    /**
     * Send sms
     */
    send(
      callback: MessageComposeCallback,
      config?: DriverOptionsType<ServicesList[Name]['implementation']>
    ): Promise<ServiceResponseType<Name>>

    /**
     * Send sms by pushing it to the in-memory queue
     */
    sendLater(
      callback: MessageComposeCallback,
      config?: DriverOptionsType<ServicesList[Name]['implementation']>
    ): Promise<void>

    /**
     * Close service
     */
    close(): Promise<void>
  }

  /**
   * Shape of the service
   */
  export interface SmsManagerContract
    extends ManagerContract<
      ApplicationContract,
      SmsDriverContract,
      ServiceContract<keyof ServicesList>,
      { [P in keyof ServicesList]: ServiceContract<P> }
    > {
    /**
     * Trap sms
     */
    trap(callback: TrapCallback): void

    /**
     * Define a callback to monitor queued sms
     */
    monitorQueue(callback: QueueMonitorCallback): void

    /**
     * Restore trap
     */
    restore(): void

    /**
     * Send sms using the default service
     */
    send(callback: MessageComposeCallback): ReturnType<SmsDriverContract['send']>

    /**
     * Send sms by pushing it to the in-memory queue
     */
    sendLater(callback: MessageComposeCallback): Promise<void>

    /**
     * Close service
     */
    close(name?: string): Promise<void>

    /**
     * Close all services
     */
    closeAll(): Promise<void>
  }

  /**
   * Base service
   */
  export interface BaseServiceContract<Service extends keyof ServicesList> {
    /**
     * Reference to the service. Assigned inside the service provider
     */
    sms: SmsManagerContract

    /**
     * An optional method to use a custom service and its options
     */
    service?: ServiceContract<Service>

    /**
     * Prepare sms message
     */
    prepare(message: MessageContract): Promise<any> | any

    /**
     * Send sms
     */
    send(): Promise<ServiceResponseType<Service>>

    /**
     * Send sms by pushing it to the in-memory queue
     */
    sendLater(): Promise<void>
  }

  export const BaseService: {
    sms: SmsManagerContract
    new <Service extends keyof ServicesList = keyof ServicesList>(
      ...args: any[]
    ): BaseServiceContract<Service>
  }
  const Sms: SmsManagerContract
  export default Sms
}
