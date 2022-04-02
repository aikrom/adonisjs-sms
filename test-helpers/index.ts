/*
 * adonisjs-sms
 *
 * (c) Ikrom Alizoda <ikrom.develop@gsms.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Application } from '@adonisjs/core/build/standalone'
import { Filesystem } from '@poppinss/dev-utils'
import { join } from 'path'

export const fs = new Filesystem(join(__dirname, 'app'))

export async function setup(environment: 'web' | 'repl' = 'web', smsConfig?: any) {
  await fs.add('.env', '')
  await fs.add(
    'config/app.ts',
    `
		export const appKey = 'averylong32charsrandomsecretkey',
		export const http = {
			cookie: {},
			trustProxy: () => true,
		}
	`
  )

  await fs.add(
    'config/sms.ts',
    `
		const smsConfig = ${JSON.stringify(smsConfig || {}, null, 2)}
		export default smsConfig
	`
  )

  const app = new Application(fs.basePath, environment, {
    providers: [
      '@adonisjs/core',
      '@adonisjs/repl',
      '@adonisjs/view',
      '../../providers/SmsProvider',
    ],
  })

  await app.setup()
  await app.registerProviders()
  await app.bootProviders()

  return app
}
