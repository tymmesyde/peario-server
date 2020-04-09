import { config } from 'dotenv';

config();

export const PORT = process.env.PORT as unknown as number;
export const PEM_CERT = process.env.PEM_CERT as unknown as string;
export const PEM_KEY = process.env.PEM_KEY as unknown as string;