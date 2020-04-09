import { config } from 'dotenv';

const env = process.argv[process.argv.length - 1];
config({ path: `.env.${env}` });

export const WS_PORT = process.env.WS_PORT as unknown as number;