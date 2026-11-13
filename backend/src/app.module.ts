import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createObserveModule } from '@nestjs/observe';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ComprobantesModule } from './comprobantes/comprobantes.module';

export const { ObserveModule, ObserveInstrument } = createObserveModule();
const configModule = ConfigModule.forRoot({ isGlobal: true });
const databaseModules =
  process.env.DATABASE_ENABLED === 'false'
    ? []
    : [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres' as const,
            host: configService.getOrThrow<string>('DATABASE_HOST'),
            port: Number(configService.getOrThrow<string>('DATABASE_PORT')),
            username: configService.getOrThrow<string>('DATABASE_USER'),
            password: configService.getOrThrow<string>('DATABASE_PASSWORD'),
            database: configService.getOrThrow<string>('DATABASE_NAME'),
            autoLoadEntities: true,
            synchronize: false,
          }),
        }),
      ];

@Module({
  imports: [
    configModule,
    ...databaseModules,
    ComprobantesModule,
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'backend',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
