import prisma from "../prisma";
import { qstash, QStashStepPayload } from "../qstash";
import { env } from "../env";
import { QuoteStatus } from "@prisma/client";

export class QuoteStateError extends Error {
  constructor(from: string, to: string) {
    super(`Illegal state transition from ${from} to ${to}`);
    this.name = "QuoteStateError";
  }
}

export class SequenceService {
  /**
   * Enrols a quote into the default sequence for the organisation.
   */
  static async enrol(quoteId: string, organisationId: string) {
    const sequence = await prisma.sequence.findFirst({
      where: { organisationId, isDefault: true },
    });

    if (!sequence) {
      console.warn(`No default sequence found for organisation ${organisationId}`);
      return;
    }

    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        sequenceId: sequence.id,
        sequenceEnrolledAt: new Date(),
        status: "sequence_running",
      },
    });

    // Schedule first step after triggerAfterHours
    await qstash.publishJSON({
      url: `${env.NEXT_PUBLIC_APP_URL}/api/qstash/sequence-step`,
      body: {
        quoteId,
        organisationId,
        stepNumber: 1,
        sequenceId: sequence.id,
      } as QStashStepPayload,
      delay: sequence.triggerAfterHours * 3600,
    });
  }

  /**
   * Pauses the sequence when a reply is received.
   */
  static async pauseOnReply(quoteId: string) {
    const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote || quote.status !== "sequence_running") return;

    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: "engaged",
        sequencePausedAt: new Date(),
      },
    });
  }

  /**
   * Resumes a paused sequence.
   */
  static async resume(quoteId: string) {
    const quote = await prisma.quote.findUnique({ 
      where: { id: quoteId },
      include: { sequence: true }
    });
    
    if (!quote || quote.status !== "engaged" || !quote.sequenceId) return;

    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: "sequence_running",
        sequencePausedAt: null,
      },
    });

    // Send next step immediately or schedule based on last send?
    // Directive 06 says: "Publishes the next step immediately."
    await qstash.publishJSON({
      url: `${env.NEXT_PUBLIC_APP_URL}/api/qstash/sequence-step`,
      body: {
        quoteId,
        organisationId: quote.organisationId,
        stepNumber: quote.sequenceStepCursor + 1,
        sequenceId: quote.sequenceId,
      } as QStashStepPayload,
    });
  }

  /**
   * Transitions quote status with validation.
   */
  static async transition(quoteId: string, to: QuoteStatus) {
    const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) return;

    const from = quote.status;
    const legalTransitions: Record<QuoteStatus, QuoteStatus[]> = {
      pending: ["sequence_running", "engaged", "dnc"],
      sequence_running: ["engaged", "converted", "expired", "excluded", "dnc"],
      engaged: ["converted", "sequence_running", "expired", "dnc"],
      converted: ["dnc"],
      expired: ["sequence_running", "dnc"],
      excluded: ["sequence_running", "dnc"],
      dnc: [],
    };

    if (from !== to && !legalTransitions[from].includes(to)) {
      throw new QuoteStateError(from, to);
    }

    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: to },
    });
  }
}
