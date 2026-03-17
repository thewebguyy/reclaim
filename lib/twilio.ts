import { env } from "./env";
import twilio from "twilio";

export const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
