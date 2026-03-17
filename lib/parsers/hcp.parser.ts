import { ParsedQuote } from "../schemas/quote.schema";

export function parseHCPQuote(payload: any): ParsedQuote {
  // Housecall Pro estimate format
  return {
    externalId: payload.id.toString(),
    externalSource: "housecall_pro",
    title: payload.name || payload.work_summary || "Untitled Estimate",
    amount: payload.total / 100, // HCP often uses cents
    currency: "USD",
    sentAt: new Date(payload.sent_at || Date.now()),
    customer: {
      firstName: payload.customer.first_name,
      lastName: payload.customer.last_name,
      email: payload.customer.email,
      phone: payload.customer.mobile_number || payload.customer.home_number,
      companyName: payload.customer.company_name,
      externalId: payload.customer.id.toString(),
    },
  };
}
