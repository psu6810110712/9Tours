import { BadRequestException } from '@nestjs/common';

const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];
const MIN_SLIP_DIMENSION = 200;
const MAX_SLIP_DIMENSION = 8000;

/**
 * Validate slip image from buffer (works with both memory and disk storage)
 */
export function validateSlipImageBuffer(fileBuffer: Buffer): void {
  const isJpeg = JPEG_MAGIC.every((byte, index) => fileBuffer[index] === byte);
  const isPng = PNG_MAGIC.every((byte, index) => fileBuffer[index] === byte);

  if (!isJpeg && !isPng) {
    throw new BadRequestException('Uploaded slip is not a valid JPG or PNG image');
  }

  const dimensions = isPng ? readPngDimensions(fileBuffer) : readJpegDimensions(fileBuffer);

  if (!dimensions) {
    throw new BadRequestException('Uploaded slip image metadata could not be read');
  }

  const { width, height } = dimensions;
  const dimensionsAreOutOfRange = (
    width < MIN_SLIP_DIMENSION
    || height < MIN_SLIP_DIMENSION
    || width > MAX_SLIP_DIMENSION
    || height > MAX_SLIP_DIMENSION
  );

  if (dimensionsAreOutOfRange) {
    throw new BadRequestException('Uploaded slip image dimensions are outside the allowed range');
  }
}

function readPngDimensions(buffer: Buffer) {
  if (buffer.length < 24) {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readJpegDimensions(buffer: Buffer) {
  let offset = 2;

  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const segmentLength = buffer.readUInt16BE(offset + 2);
    const isStartOfFrame = (
      marker >= 0xc0
      && marker <= 0xcf
      && marker !== 0xc4
      && marker !== 0xc8
      && marker !== 0xcc
    );

    if (isStartOfFrame) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    if (segmentLength < 2) {
      return null;
    }

    offset += 2 + segmentLength;
  }

  return null;
}
