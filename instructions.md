The package has been configured successfully. The sms configuration stored inside `config/sms.ts` file relies on the following environment variables and hence we recommend validating them.

Open the `env.ts` file and paste the following code inside the `Env.rules` object.

## Variables for the PLIVO driver

```ts
PLIVO_AUTH_ID: Env.schema.string(),
PLIVO_AUTH_TOKEN: Env.schema.string(),
PLIVO_FROM: Env.schema.string(),
```
