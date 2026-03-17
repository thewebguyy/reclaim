import { Quote, ContactSource } from "@prisma/client";
import prisma from "../prisma";
import { ContactService } from "./contact.service";
import { ParsedQuote } from "../schemas/quote.schema";

export class QuoteService {
  static async ingest(organisationId: string, parsed: ParsedQuote): Promise<Quote> {
    const contact = await ContactService.upsertFromParsed(
      organisationId,
      parsed.customer,
      parsed.externalSource
    );

    const quote = await prisma.quote.upsert({
      where: {
        organisationId_externalId_externalSource: {
          organisationId,
          externalId: parsed.externalId,
          externalSource: parsed.externalSource,
        },
      },
      update: {
        title: parsed.title,
        amount: parsed.amount,
        currency: parsed.currency,
        sentAt: parsed.sentAt,
      },
      create: {
        organisationId,
        contactId: contact.id,
        externalId: parsed.externalId,
        externalSource: parsed.externalSource,
        title: parsed.title,
        amount: parsed.amount,
        currency: parsed.currency,
        sentAt: parsed.sentAt,
        status: "pending",
      },
    });

    // Enrol into sequence if it's new (handled in Phase 3)
    // await SequenceService.enrol(quote.id, organisationId);

    return quote;
  }
}
