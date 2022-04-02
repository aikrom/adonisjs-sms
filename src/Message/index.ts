/*
 * adonisjs-sms
 *
 * (c) Ikrom Alizoda <ikrom.develop@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../adonis-typings/sms.ts" />

import { MessageContentViewsNode, MessageContract, MessageNode } from '@ioc:Adonis/Addons/Sms'

/**
 * Fluent API to construct node service message object
 */
export class Message implements MessageContract {
  private message: MessageNode = {}

  constructor() {}

  /**
   * Path to the views used to generate content for the
   * message
   */
  private contentViews: {
    text?: {
      template: string
      data?: any
    }
  } = {}

  /**
   * Add receipent as `to`
   */
  public to(phone: string): this {
    this.message.to = this.message.to || []
    this.message.to.push({ phone })
    return this
  }

  /**
   * Add `from` name and sms
   */
  public from(from: string): this {
    this.message.from = { phone: from }
    return this
  }

  /**
   * Compute sms text from defined view
   */
  public textView(template: string, data?: any): this {
    this.contentViews.text = { template, data }
    return this
  }

  /**
   * Compute sms text from raw text
   */
  public text(content: string): this {
    this.message.text = content
    return this
  }

  /**
   * Get message JSON
   */
  public toJSON(): { message: MessageNode; views: MessageContentViewsNode } {
    return {
      message: this.message,
      views: this.contentViews,
    }
  }
}
