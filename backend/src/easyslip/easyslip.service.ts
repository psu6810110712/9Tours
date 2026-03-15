import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';

export type PaymentVerificationStatus =
  | 'pending'
  | 'verified'
  | 'duplicate'
  | 'amount_mismatch'
  | 'unreadable'
  | 'failed'
  | 'unavailable';

export interface EasySlipVerificationResult {
  status: PaymentVerificationStatus;
  provider: 'slip2go';
  message: string;
  verifiedAmount: number | null;
  verifiedTransRef: string | null;
  verifiedAt: Date | null;
  raw: Record<string, unknown> | null;
}

interface Slip2GoResponsePayload {
  code?: string;
  message?: string;
  data?: {
    referenceId?: string;
    decode?: string;
    transRef?: string;
    dateTime?: string;
    amount?: number | string;
  };
}

@Injectable()
export class EasySlipService {
  private readonly logger = new Logger(EasySlipService.name);

  constructor(private readonly configService: ConfigService) {}

  async verifySlip(file: Express.Multer.File): Promise<EasySlipVerificationResult> {
    const apiSecret = this.configService.get<string>('SLIP2GO_API_SECRET')?.trim();
    const baseUrl = (this.configService.get<string>('SLIP2GO_BASE_URL') ?? 'https://connect.slip2go.com/api')
      .replace(/\/+$/, '');

    if (!apiSecret) {
      return {
        status: 'unavailable',
        provider: 'slip2go',
        message: 'Slip2Go API secret is not configured',
        verifiedAmount: null,
        verifiedTransRef: null,
        verifiedAt: null,
        raw: null,
      };
    }

    try {
      const fileBuffer = await readFile(file.path);
      const formData = new FormData();
      formData.append(
        'file',
        new Blob([fileBuffer], { type: file.mimetype || 'application/octet-stream' }),
        file.filename,
      );
      formData.append(
        'payload',
        JSON.stringify({
          checkDuplicate: true,
        }),
      );

      const response = await fetch(`${baseUrl}/verify-slip/qr-image/info`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiSecret}`,
        },
        body: formData,
      });

      const responseText = await response.text();
      const payload = this.parseJson(responseText);
      const responsePayload = (payload ?? {}) as Slip2GoResponsePayload & Record<string, unknown>;
      const responseCode = String(responsePayload.code ?? '');
      const responseMessage = responsePayload.message?.trim() ?? '';
      const inferredVerified = this.isVerifiedSlipResponse(
        response.ok,
        responseCode,
        responseMessage,
        responsePayload.data,
      );

      if (inferredVerified && responsePayload.data) {
        return {
          status: 'verified',
          provider: 'slip2go',
          message: responseMessage || 'Slip verified successfully',
          verifiedAmount: this.extractAmount(responsePayload.data.amount),
          verifiedTransRef:
            responsePayload.data.transRef
            ?? responsePayload.data.referenceId
            ?? null,
          verifiedAt: this.extractVerifiedAt(responsePayload.data.dateTime),
          raw: responsePayload,
        };
      }

      const mappedStatus = this.mapErrorStatus(response.status, responseCode, responseMessage);
      const mappedMessage = this.mapErrorMessage(response.status, responseCode, responseMessage);
      this.logger.warn(`Slip2Go verification returned ${response.status} (${responseCode}): ${mappedMessage}`);

      return {
        status: mappedStatus,
        provider: 'slip2go',
        message: mappedMessage,
        verifiedAmount: this.extractAmount(responsePayload.data?.amount),
        verifiedTransRef:
          responsePayload.data?.transRef
          ?? responsePayload.data?.referenceId
          ?? null,
        verifiedAt: null,
        raw: responsePayload,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Slip2Go verification failed: ${message}`);
      return {
        status: 'unavailable',
        provider: 'slip2go',
        message: 'Slip2Go verification is currently unavailable',
        verifiedAmount: null,
        verifiedTransRef: null,
        verifiedAt: null,
        raw: { error: message },
      };
    }
  }

  private extractAmount(value?: number | string | null) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }

  private extractVerifiedAt(value?: string | null) {
    if (!value) {
      return new Date();
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private parseJson(value: string) {
    if (!value.trim()) {
      return null;
    }

    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private isVerifiedSlipResponse(
    isOk: boolean,
    responseCode: string,
    message: string,
    data?: Slip2GoResponsePayload['data'],
  ) {
    if (!data) {
      return false;
    }

    const normalizedMessage = message.trim().toLowerCase();
    const normalizedCode = responseCode.trim().toLowerCase();
    const hasReadableTransactionData = (
      this.extractAmount(data.amount) !== null
      && Boolean(data.transRef ?? data.referenceId)
    );

    if (
      normalizedCode.includes('duplicate')
      || normalizedMessage.includes('duplicate')
      || normalizedMessage.includes('already used')
      || normalizedCode.includes('invalid')
      || normalizedCode.includes('unreadable')
      || normalizedMessage.includes('invalid')
      || normalizedMessage.includes('unreadable')
      || normalizedMessage.includes('cannot read')
      || normalizedMessage.includes('qr not found')
      || normalizedMessage.includes('slip not found')
    ) {
      return false;
    }

    if (isOk && normalizedCode === '200000') {
      return true;
    }

    return (
      hasReadableTransactionData
      && (
        normalizedMessage.includes('slip is valid')
        || normalizedMessage.includes('valid slip')
        || normalizedMessage.includes('verified')
        || normalizedMessage.includes('success')
      )
    );
  }

  private mapErrorStatus(statusCode: number, responseCode: string, message?: string): PaymentVerificationStatus {
    const normalizedMessage = (message ?? '').toLowerCase();
    const normalizedCode = responseCode.toLowerCase();

    if (
      normalizedCode.includes('duplicate')
      || normalizedMessage.includes('duplicate')
      || normalizedMessage.includes('already used')
    ) {
      return 'duplicate';
    }

    if (
      normalizedCode.includes('invalid')
      || normalizedCode.includes('unreadable')
      || normalizedMessage.includes('invalid')
      || normalizedMessage.includes('unreadable')
      || normalizedMessage.includes('cannot read')
      || normalizedMessage.includes('qr not found')
      || normalizedMessage.includes('slip not found')
    ) {
      return 'unreadable';
    }

    if (statusCode === 401 || statusCode === 403 || statusCode === 429 || statusCode >= 500) {
      return 'unavailable';
    }

    return 'failed';
  }

  private mapErrorMessage(statusCode: number, responseCode: string, message?: string) {
    const normalizedMessage = (message ?? '').toLowerCase();
    const normalizedCode = responseCode.toLowerCase();

    if (
      normalizedCode.includes('duplicate')
      || normalizedMessage.includes('duplicate')
      || normalizedMessage.includes('already used')
    ) {
      return 'Slip2Go detected this slip as a duplicate';
    }

    if (
      normalizedCode.includes('invalid')
      || normalizedCode.includes('unreadable')
      || normalizedMessage.includes('invalid')
      || normalizedMessage.includes('unreadable')
      || normalizedMessage.includes('cannot read')
      || normalizedMessage.includes('qr not found')
      || normalizedMessage.includes('slip not found')
    ) {
      return 'Slip2Go could not read this slip clearly';
    }

    if (statusCode === 401 || statusCode === 403) {
      return 'Slip2Go credentials are invalid or access was denied';
    }

    if (statusCode === 429) {
      return 'Slip2Go quota was exceeded';
    }

    if (statusCode >= 500) {
      return 'Slip2Go is temporarily unavailable';
    }

    return message?.trim() || 'Slip2Go verification failed';
  }
}
