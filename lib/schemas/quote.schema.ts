import { ContactSource } from "@prisma/client";

export interface ParsedQuote {
  externalId: string;
  externalSource: ContactSource;
  title: string;
  amount: number;
  currency: string;
  sentAt: Date;
  customer: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    companyName?: string;
    externalId?: string;
  };
}
