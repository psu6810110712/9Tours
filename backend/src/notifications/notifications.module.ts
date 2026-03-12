import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';

@Module({
    imports: [
        MailerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                transport: {
                    host: config.get('SMTP_HOST', 'sandbox.smtp.mailtrap.io'),
                    port: config.get('SMTP_PORT', 2525),
                    auth: {
                        user: config.get('SMTP_USER'),
                        pass: config.get('SMTP_PASS'),
                    },
                },
                defaults: {
                    from: config.get('SMTP_FROM', '"9Tours Booking" <noreply@9tours.com>'),
                },
            }),
        }),
    ],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule { }
