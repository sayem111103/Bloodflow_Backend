import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });

export const config = {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  DB: process.env.DATABASE_URL,
  origin: process.env.ORIGIN,
  salt_rounds: process.env.SALT_ROUNDS,
  access_secret: process.env.ACCESS_TOKEN_SECRET,
  access_expires: process.env.ACCESS_TOKEN_EXPIRES_IN,
  refresh_secret: process.env.REFRESH_TOKEN_SECRET,
  refresh_expires: process.env.REFRESH_TOKEN_EXPIRES_IN,
  n8n_contact_webhook_url: process.env.N8N_CONTACT_WEBHOOK_URL,
  
};
