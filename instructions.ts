/*
 * adonisjs-sms
 *
 * (c) Ikrom Alizoda <ikrom.develop@gsms.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as sinkStatic from '@adonisjs/sink'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { join } from 'path'

/**
 * Prompt choices for the sms driver selection
 */
const DRIVER_PROMPTS = [
  {
    name: 'plivo' as const,
    message: 'Plivo',
  },
]

/**
 * Environment variables for available drivers
 */
const DRIVER_ENV_VALUES = {
  plivo: {
    PLIVO_AUTH_ID: '<id>',
    PLIVO_AUTH_TOKEN: '<token>',
    PLIVO_FROM: '<from>',
  },
}

/**
 * Prompts user to select one or more sms drivers they are planning
 * to use.
 */
function getSmsDrivers(sink: typeof sinkStatic) {
  return sink
    .getPrompt()
    .multiple('Select the sms drivers you are planning to use', DRIVER_PROMPTS, {
      validate(choices) {
        return choices && choices.length
          ? true
          : 'Select atleast one sms driver. You can always change it later'
      },
    })
}

/**
 * Returns the environment variables for the select drivers
 */
function getEnvValues(drivers: (keyof typeof DRIVER_ENV_VALUES)[]) {
  return drivers.reduce((values, driver) => {
    Object.assign(values, DRIVER_ENV_VALUES[driver])
    return values
  }, {})
}

/**
 * Returns absolute path to the stub relative from the templates
 * directory
 */
function getStub(...relativePaths: string[]) {
  return join(__dirname, 'templates', ...relativePaths)
}

/**
 * Instructions to be executed when setting up the package.
 */
export default async function instructions(
  projectRoot: string,
  app: ApplicationContract,
  sink: typeof sinkStatic
) {
  /**
   * Get sms drivers
   */
  const smsDrivers = await getSmsDrivers(sink)

  /**
   * Create the sms config file
   */
  const configPath = app.configPath('sms.ts')
  const smsConfig = new sink.files.MustacheFile(projectRoot, configPath, getStub('config.txt'))
  smsConfig.overwrite = true

  smsConfig
    .apply({
      primaryDriver: smsDrivers[0],
      smtp: smsDrivers.includes('plivo'),
    })
    .commit()
  const configDir = app.directoriesMap.get('config') || 'config'
  sink.logger.action('create').succeeded(`${configDir}/sms.ts`)

  /**
   * Create the sms contracts file
   */
  const contractsPath = app.makePath('contracts/sms.ts')
  const smsContract = new sink.files.MustacheFile(
    projectRoot,
    contractsPath,
    getStub('contract.txt')
  )
  smsContract.overwrite = true
  smsContract
    .apply({
      smtp: smsDrivers.includes('plivo'),
    })
    .commit()
  sink.logger.action('create').succeeded('contracts/sms.ts')

  /**
   * Setup .env file
   */
  const env = new sink.files.EnvFile(projectRoot)

  /**
   * Unset all existing env values as should keep the .env file clean
   */
  Object.keys(getEnvValues(['plivo'])).forEach((key) => {
    env.unset(key)
  })

  /**
   * Then define the env values for the selected drivers
   */
  const envValues = getEnvValues(smsDrivers)
  Object.keys(envValues).forEach((key) => {
    env.set(key, envValues[key])
  })
  env.commit()
  sink.logger.action('update').succeeded('.env,.env.example')

  /**
   * Install required dependencies
   */
  if (smsDrivers.includes('plivo')) {
    const pkg = new sink.files.PackageJsonFile(projectRoot)
    pkg.install('plivo', undefined, false)

    const spinner = sink.logger.await(
      `Installing packages: ${pkg.getInstalls(false).list.join(', ')}`
    )

    try {
      await pkg.commitAsync()
      spinner.update('Packages installed')
    } catch (error) {
      spinner.update('Unable to install packages')
      sink.logger.fatal(error)
    }

    spinner.stop()
  }
}
