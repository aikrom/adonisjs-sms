declare module '@ioc:Adonis/Addons/Sms' {
  interface ServicesList {
    promotional: SmsDrivers['plivo']
    transactional: SmsDrivers['plivo']
    receipts: SmsDrivers['plivo']
  }
}
