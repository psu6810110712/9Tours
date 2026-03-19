import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.interface';
import { LocalStorageService } from './local-storage.service';
import { S3StorageService } from './s3-storage.service';

@Global()
@Module({
  providers: [
    {
      provide: StorageService,
      useFactory: (configService: ConfigService) => {
        const storageType = configService.get<string>('STORAGE_TYPE')?.toLowerCase();

        if (storageType === 's3') {
          return new S3StorageService(configService);
        }

        // Default to local storage
        return new LocalStorageService(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
