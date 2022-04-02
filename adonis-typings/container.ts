/*
 * adonisjs-sms
 *
 * (c) Ikrom Alizoda <ikrom.develop@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Core/Application' {
  import { SmsManagerContract } from '@ioc:Adonis/Addons/Sms'

  export interface ContainerBindings {
    'Adonis/Addons/Sms': SmsManagerContract
  }
}
