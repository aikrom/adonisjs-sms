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
  MessageNode,
  PlivoConfig,
  PlivoDriverContract,
  PlivoResponse,
} from '@ioc:Adonis/Addons/Sms'
import { LoggerContract } from '@ioc:Adonis/Core/Logger'
import { Client } from 'plivo'

/**
 * Plivo driver to send sms using ses
 */
export class PlivoPostDriver implements PlivoDriverContract {
  constructor(private config: PlivoConfig, private logger: LoggerContract) {}

  /**
   * Send message
   */
  public async send(message: MessageNode): Promise<PlivoResponse> {
    const client = new Client(this.config.authId, this.config.authToken)
    const dst = message.to?.map((to) => to.phone).join('<')
    const src = message.from?.phone ?? this.config.from

    if (!src) {
      return Promise.reject('Sender not provided')
    }
    if (!dst) {
      return Promise.reject('Receiver(s) not provided')
    }
    if (!message.text) {
      return Promise.reject('Message not provided')
    }

    this.logger.trace(message, 'plivo')

    return await client.messages.create(src, dst, message.text)
  }

  public async close() {}
}
