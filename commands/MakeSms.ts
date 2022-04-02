/*
 * adonisjs-sms
 *
 * (c) Ikrom Alizoda <ikrom.develop@gsms.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { args, BaseCommand } from '@adonisjs/core/build/standalone'
import { join } from 'path'

/**
 * Command to make a new service
 */
export default class MakeSms extends BaseCommand {
  /**
   * Command meta data
   */
  public static commandName = 'make:sms'
  public static description = 'Make a new sms class'

  @args.string({ description: 'Name of the sms class' })
  public name: string

  /**
   * Create the sms template
   */
  public async run() {
    const stub = join(__dirname, '..', 'templates', 'sms.txt')
    const path = this.application.resolveNamespaceDirectory('sms')

    this.generator
      .addFile(this.name, { pattern: 'pascalcase' })
      .stub(stub)
      .destinationDir(path || 'app/Sms')
      .useMustache()
      .appRoot(this.application.cliCwd || this.application.appRoot)

    await this.generator.run()
  }
}
