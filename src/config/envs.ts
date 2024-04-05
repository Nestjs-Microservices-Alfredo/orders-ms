import 'dotenv/config';
import * as joi from 'joi';


interface EnvVars { 
    // PORT: number;
    DATABASE_URL: string;
    NATS_SERVERS: string[];

}

const envVarsSchema = joi.object({
    // PORT: joi.number().required(),
    DATABASE_URL: joi.string().required(),
    NATS_SERVERS: joi.array().items(joi.string()).required(),
}).unknown(true);

const { error, value: envVars } = envVarsSchema.validate({
    ...process.env,
    NATS_SERVERS: process.env.NATS_SERVERS?.split(','),
});

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const envVarsConfig: EnvVars = envVars;

export const envs = {
    // port: envVarsConfig.PORT,
    databaseUrl: envVarsConfig.DATABASE_URL,
    natsServers: envVarsConfig.NATS_SERVERS,
}