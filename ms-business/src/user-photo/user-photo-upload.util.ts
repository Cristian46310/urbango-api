import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';
import type { UserPhotoStorageFile } from './user-photo-storage.service';

export const USER_PHOTO_ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const USER_PHOTO_MAX_SIZE = 5 * 1024 * 1024;

export const userPhotoUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: USER_PHOTO_MAX_SIZE },
};

export function toUserPhotoStorageFile(
  file: Express.Multer.File | undefined,
): UserPhotoStorageFile {
  if (!file) {
    throw new BadRequestException('No file was uploaded (field name: photo)');
  }

  if (
    !USER_PHOTO_ALLOWED_MIMES.includes(
      file.mimetype as (typeof USER_PHOTO_ALLOWED_MIMES)[number],
    )
  ) {
    throw new BadRequestException(
      `Only JPEG, PNG, and WebP images are allowed. Received: ${file.mimetype}`,
    );
  }

  if (file.size > USER_PHOTO_MAX_SIZE) {
    throw new BadRequestException(
      `File size must not exceed 5 MB. Received: ${file.size} bytes`,
    );
  }

  return {
    buffer: file.buffer,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  };
}
