import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { QuoteService } from "@/lib/services/quote.service";
import { auth } from "@clerk/nextjs/server";
import { ContactSource } from "@prisma/client";

export async function POST(req: NextRequest) {
  const { orgId } = await auth();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find organization in our DB
  const organisation = await prisma?.organisation.findUnique({
    where: { clerkOrgId: orgId },
  });

  if (!organisation) {
    return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const csvText = await file.text();
    const results = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = results.data as any[];
    let imported = 0;
    let skipped = 0;
    const errors: any[] = [];

    for (const [index, row] of rows.entries()) {
      try {
        const name = fuzzyMatch(row, ["customer_name", "client_name", "name", "customer"]);
        const email = fuzzyMatch(row, ["email", "e-mail", "customer_email"]);
        const phone = fuzzyMatch(row, ["phone", "mobile", "cell", "customer_phone"]);
        const title = fuzzyMatch(row, ["job_title", "title", "job", "description"]);
        const amount = fuzzyMatch(row, ["amount", "total", "price", "value"]);
        const dateSent = fuzzyMatch(row, ["date_sent", "sent_at", "date", "created_at"]);

        if (!name || (!email && !phone)) {
          skipped++;
          errors.push({ row: index + 1, reason: "Missing name or contact info" });
          continue;
        }

        const names = name.split(" ");
        const firstName = names[0] || "Customer";
        const lastName = names.slice(1).join(" ") || "";

        await QuoteService.ingest(organisation.id, {
          externalId: `csv_${Date.now()}_${index}`,
          externalSource: "csv",
          title: title || "Imported Quote",
          amount: parseFloat(amount?.replace(/[^0-9.]/g, "") || "0"),
          currency: "USD",
          sentAt: dateSent ? new Date(dateSent) : new Date(),
          customer: {
            firstName,
            lastName,
            email,
            phone,
          },
        });

        imported++;
      } catch (err: any) {
        skipped++;
        errors.push({ row: index + 1, reason: err.message });
      }
    }

    return NextResponse.json({
      data: { imported, skipped, errors },
    });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json({ error: "Failed to process CSV" }, { status: 500 });
  }
}

function fuzzyMatch(row: any, keys: string[]): string | undefined {
  const rowKeys = Object.keys(row);
  for (const key of keys) {
    const foundKey = rowKeys.find(
      (k) => k.toLowerCase().replace(/[\s_-]/g, "") === key.toLowerCase().replace(/[\s_-]/g, "")
    );
    if (foundKey) return row[foundKey];
  }
  return undefined;
}
