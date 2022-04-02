import Sms from '@ioc:Adonis/Addons/Sms'

Sms.use('receipts')
  .send((message) => {
    message.textView('welcome.txt')
  })
  .then((reponse) => {
    console.log(reponse)
  })
