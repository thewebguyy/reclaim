import { parsePhoneNumberWithError } from "libphonenumber-js";
import { Contact, ContactSource } from "@prisma/client";
import prisma from "../prisma";
import { encrypt, hashForLookup } from "../crypto";

export class ContactService {
  static async upsertFromParsed(
    organisationId: string,
    customer: {
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      companyName?: string;
      externalId?: string;
    },
    source: ContactSource
  ): Promise<Contact> {
    const emailHash = customer.email ? hashForLookup(customer.email) : null;
    const phoneHash = customer.phone ? hashForLookup(this.normalizePhone(customer.phone)) : null;

    // Try to find existing contact by externalId first
    if (customer.externalId) {
      const existing = await prisma.contact.findUnique({
        where: {
          organisationId_externalId_externalSource: {
            organisationId,
            externalId: customer.externalId,
            externalSource: source,
          },
        },
      });
      if (existing) return existing;
    }

    // Try to find by email hash
    if (emailHash) {
      const existing = await prisma.contact.findUnique({
        where: {
          organisationId_emailHash: {
            organisationId,
            emailHash,
          },
        },
      });
      if (existing) return existing;
    }

    // Try to find by phone hash
    if (phoneHash) {
      const existing = await prisma.contact.findUnique({
        where: {
          organisationId_phoneHash: {
            organisationId,
            phoneHash,
          },
        },
      });
      if (existing) return existing;
    }

    // Create new contact
    return await prisma.contact.create({
      data: {
        organisationId,
        firstName: customer.firstName,
        lastName: customer.lastName,
        companyName: customer.companyName,
        emailEnc: customer.email ? encrypt(customer.email) : null,
        emailHash,
        phoneEnc: customer.phone ? encrypt(this.normalizePhone(customer.phone)) : null,
        phoneHash,
        externalId: customer.externalId,
        externalSource: source,
      },
    });
  }

  private static normalizePhone(phone: string): string {
    try {
      // Default to US for local service businesses if no country code
      const phoneNumber = parsePhoneNumberWithError(phone, "US");
      return phoneNumber.format("E.164");
    } catch {
      return phone.replace(/\D/g, ""); // Fallback to digits only
    }
  }
}
