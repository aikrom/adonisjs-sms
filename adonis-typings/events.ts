/*
 * adonisjs-sms
 *
 * (c) Ikrom Alizoda <ikrom.develop@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { SmsEventData } from '@ioc:Adonis/Addons/Sms'

declare module '@ioc:Adonis/Core/Event' {
  export interface EventsList {
    'sms:sent': SmsEventData
  }
}
