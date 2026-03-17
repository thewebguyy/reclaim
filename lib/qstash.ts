import { Client, Receiver } from "@upstash/qstash";
import { env } from "./env";

export const qstash = new Client({
  token: env.QSTASH_TOKEN,
});

export const qstashReceiver = new Receiver({
  currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
});

export interface QStashStepPayload {
  quoteId: string;
  organisationId: string;
  stepNumber: number;
  sequenceId: string;
}
