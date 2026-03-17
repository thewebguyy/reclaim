import { ParsedQuote } from "../schemas/quote.schema";

export function parseJobberQuote(payload: any): ParsedQuote {
  // Example Jobber payload structure (simplified)
  // {
  //   "id": "123",
  //   "title": "HVAC Install",
  //   "total": "1200.00",
  //   "sent_at": "2024-03-20T10:00:00Z",
  //   "client": {
  //     "id": "c1",
  //     "first_name": "John",
  //     "last_name": "Doe",
  //     "email": "john@example.com",
  //     "phone": "555-0199"
  //   }
  // }
  
  return {
    externalId: payload.id.toString(),
    externalSource: "jobber",
    title: payload.title || "Untitled Quote",
    amount: parseFloat(payload.total || "0"),
    currency: "USD", // Jobber usually provides this but defaulting for MVP
    sentAt: new Date(payload.sent_at || Date.now()),
    customer: {
      firstName: payload.client.first_name,
      lastName: payload.client.last_name,
      email: payload.client.email,
      phone: payload.client.phone,
      companyName: payload.client.company_name,
      externalId: payload.client.id.toString(),
    },
  };
}
