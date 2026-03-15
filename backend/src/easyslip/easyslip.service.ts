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
  provider: 'easyslip';
  message: string;
  verifiedAmount: number | null;
  verifiedTransRef: string | null;
  verifiedAt: Date | null;
  raw: Record<string, unknown> | null;
}

interface EasySlipSuccessPayload {
  status?: number;
  data?: {
    transRef?: string;
    amount?: {
      amount?: number;
      local?: {
        amount?: number;
        currency?: string;
      };
    };
  };
  message?: string;
}

@Injectable()
export class EasySlipService {
  private readonly logger = new Logger(EasySlipService.name);

  constructor(private readonly configService: ConfigService) {}

  async verifySlip(file: Express.Multer.File): Promise<EasySlipVerificationResult> {
    const apiKey = this.configService.get<string>('EASYSLIP_API_KEY')?.trim();
    const baseUrl = (this.configService.get<string>('EASYSLIP_BASE_URL') ?? 'https://developer.easyslip.com/api/v1')
      .replace(/\/+$/, '');

    if (!apiKey) {
      return {
        status: 'unavailable',
        provider: 'easyslip',
        message: 'EasySlip API key is not configured',
        verifiedAmount: null,
        verifiedTransRef: null,
        verifiedAt: null,
        raw: null,
      };
    }

    try {
      const fileBuffer = await readFile(file.path);
      const formData = new FormData();
      formData.append('file', new Blob([fileBuffer], { type: file.mimetype || 'application/octet-stream' }), file.filename);
      formData.append('checkDuplicate', 'true');

      const response = await fetch(`${baseUrl}/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      const responseText = await response.text();
      const payload = this.parseJson(responseText);
      const responsePayload = (payload ?? {}) as EasySlipSuccessPayload & Record<string, unknown>;

      if (response.ok && responsePayload.data) {
        return {
          status: 'verified',
          provider: 'easyslip',
          message: 'EasySlip verified this slip successfully',
          verifiedAmount: this.extractAmount(responsePayload.data),
          verifiedTransRef: responsePayload.data.transRef ?? null,
          verifiedAt: new Date(),
          raw: responsePayload,
        };
      }

      const mappedStatus = this.mapErrorStatus(response.status, responsePayload.message);
      const mappedMessage = this.mapErrorMessage(response.status, responsePayload.message);
      this.logger.warn(`EasySlip verification returned ${response.status}: ${mappedMessage}`);

      return {
        status: mappedStatus,
        provider: 'easyslip',
        message: mappedMessage,
        verifiedAmount: this.extractAmount(responsePayload.data),
        verifiedTransRef: responsePayload.data?.transRef ?? null,
        verifiedAt: null,
        raw: responsePayload,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`EasySlip verification failed: ${message}`);
      return {
        status: 'unavailable',
        provider: 'easyslip',
        message: 'EasySlip verification is currently unavailable',
        verifiedAmount: null,
        verifiedTransRef: null,
        verifiedAt: null,
        raw: { error: message },
      };
    }
  }

  private extractAmount(data?: EasySlipSuccessPayload['data']) {
    if (!data?.amount) {
      return null;
    }

    const directAmount = Number(data.amount.amount);
    if (!Number.isNaN(directAmount) && directAmount > 0) {
      return directAmount;
    }

    const localAmount = Number(data.amount.local?.amount);
    if (!Number.isNaN(localAmount) && localAmount > 0) {
      return localAmount;
    }

    return null;
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

  private mapErrorStatus(statusCode: number, message?: string): PaymentVerificationStatus {
    const normalized = (message ?? '').toLowerCase();

    if (normalized.includes('duplicate')) {
      return 'duplicate';
    }

    if (
      normalized.includes('unreadable')
      || normalized.includes('invalid_image')
      || normalized.includes('invalid image')
      || normalized.includes('unsupported')
      || normalized.includes('cannot read')
    ) {
      return 'unreadable';
    }

    if (statusCode === 401 || statusCode === 403 || statusCode === 429 || statusCode >= 500) {
      return 'unavailable';
    }

    return 'failed';
  }

  private mapErrorMessage(statusCode: number, message?: string) {
    const normalized = (message ?? '').toLowerCase();

    if (normalized.includes('duplicate')) {
      return 'EasySlip detected this slip as a duplicate';
    }

    if (
      normalized.includes('unreadable')
      || normalized.includes('invalid_image')
      || normalized.includes('invalid image')
      || normalized.includes('unsupported')
      || normalized.includes('cannot read')
    ) {
      return 'EasySlip could not read this slip clearly';
    }

    if (statusCode === 401 || statusCode === 403) {
      return 'EasySlip credentials are invalid or access was denied';
    }

    if (statusCode === 429) {
      return 'EasySlip quota was exceeded';
    }

    if (statusCode >= 500) {
      return 'EasySlip is temporarily unavailable';
    }

    return message?.trim() || 'EasySlip verification failed';
  }
}
