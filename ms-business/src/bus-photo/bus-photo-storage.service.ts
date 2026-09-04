import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

export type BusPhotoStorageFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

export type StoredBusPhoto = {
  path: string;
  publicUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
};

@Injectable()
export class BusPhotoStorageService {
  private readonly supabaseUrl: string | undefined;
  private readonly supabaseKey: string | undefined;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.supabaseUrl = this.configService
      .get<string>('SUPABASE_URL')
      ?.replace(/\/$/, '');
    this.supabaseKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ??
      this.configService.get<string>('SUPABASE_ANON_KEY');
    this.bucket =
      this.configService.get<string>('SUPABASE_BUS_BUCKET') ?? 'bus-photo';
  }

  async upload(file: BusPhotoStorageFile): Promise<StoredBusPhoto> {
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new BadRequestException(
        'Supabase Storage is not configured for bus photos',
      );
    }

    if (!file || file.size === 0) {
      throw new BadRequestException('File is empty or invalid');
    }

    const extension =
      extname(file.originalname) || this.extensionFromMime(file);
    const path = `buses/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${randomUUID()}${extension}`;
    const uploadUrl = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${path}`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        apikey: this.supabaseKey,
        Authorization: `Bearer ${this.supabaseKey}`,
        'Content-Type': file.mimetype,
        'x-upsert': 'false',
      },
      body: file.buffer as unknown as BodyInit,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new BadRequestException(
        `Could not upload bus photo to Supabase Storage: ${detail}`,
      );
    }

    return {
      path,
      publicUrl: `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${path}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async delete(path: string): Promise<void> {
    if (!this.supabaseUrl || !this.supabaseKey || !path) {
      return;
    }

    const deleteUrl = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${path}`;
    try {
      await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          apikey: this.supabaseKey,
          Authorization: `Bearer ${this.supabaseKey}`,
        },
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      // Best-effort cleanup.
    }
  }

  pathFromPublicUrl(publicUrl: string): string | undefined {
    if (!this.supabaseUrl || !publicUrl) {
      return undefined;
    }
    const prefix = `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/`;
    return publicUrl.startsWith(prefix)
      ? publicUrl.slice(prefix.length)
      : undefined;
  }

  private extensionFromMime(file: BusPhotoStorageFile) {
    const subtype = file.mimetype.split('/')[1];
    return subtype ? `.${subtype}` : '';
  }
}
