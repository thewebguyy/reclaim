import prisma from "../prisma";
import { qstash } from "../qstash";
import { env } from "../env";

export class PostJobService {
  /**
   * Triggers post-job automations: review request and rebooking reminder.
   */
  static async triggerForJob(params: {
    organisationId: string;
    contactId: string;
    externalJobId: string;
  }) {
    const org = await prisma.organisation.findUnique({
      where: { id: params.organisationId },
    });

    if (!org) return;

    // 1. Schedule Review Request (e.g. 24 hours later)
    await qstash.publishJSON({
      url: `${env.NEXT_PUBLIC_APP_URL}/api/automation/review-request`,
      body: {
        organisationId: params.organisationId,
        contactId: params.contactId,
        externalJobId: params.externalJobId,
      },
      delay: 24 * 3600,
    });

    // 2. Schedule Rebooking Reminder (e.g. 6 months later)
    await qstash.publishJSON({
      url: `${env.NEXT_PUBLIC_APP_URL}/api/automation/rebooking-reminder`,
      body: {
        organisationId: params.organisationId,
        contactId: params.contactId,
        externalJobId: params.externalJobId,
      },
      delay: 180 * 24 * 3600,
    });
  }
}
