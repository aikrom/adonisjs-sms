/*
 * adonisjs-sms
 *
 * (c) Ikrom Alizoda <ikrom.develop@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export class ObjectBuilder {
  private result: { [key: string]: any } = {}

  public add(key: string, value: any): this {
    if (value === undefined) {
      return this
    }
    this.result[key] = value
    return this
  }

  public toObject() {
    return this.result
  }
}
