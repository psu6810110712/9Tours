import { BadRequestException } from '@nestjs/common';
import { readFile, unlink } from 'node:fs/promises';

const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

export async function ensureValidSlipImage(file: Express.Multer.File) {
  const fileBuffer = await readFile(file.path);
  const isJpeg = JPEG_MAGIC.every((byte, index) => fileBuffer[index] === byte);
  const isPng = PNG_MAGIC.every((byte, index) => fileBuffer[index] === byte);

  if (!isJpeg && !isPng) {
    await safeDeleteFile(file.path);
    throw new BadRequestException('Uploaded slip is not a valid JPG or PNG image');
  }
}

export async function safeDeleteFile(filePath?: string | null) {
  if (!filePath) {
    return;
  }

  try {
    await unlink(filePath);
  } catch {
    // Ignore cleanup failures.
  }
}
