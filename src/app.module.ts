import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { TransfersController } from './transfers/transfers.controller';
import { TransfersService } from './transfers/transfers.service';
import { ConfigService } from './config/config.service';
import { ConfigController } from './config/config.controller';
import { AccountsController } from './accounts/accounts.controller';
import { AccountsService } from './accounts/accounts.service';
import { DepositsController } from './deposits/deposits.controller';
import { DepositsService } from './deposits/deposits.service';
import { PaymentListenerService } from './payment-listener/payment-listener.service';
import { PaymentsController } from './payments/payments.controller';
import { PaymentsService } from './payments/payments.service';
import { TaxesController } from './taxes/taxes.controller';
import { TaxesService } from './taxes/taxes.service';
import { WithdrawsController } from './withdraws/withdraws.controller';
import { WithdrawsService } from './withdraws/withdraws.service';
import { LoggerService } from './logger/logger.service';
import { TaxRevenueGateway } from './config/tax-revenue.gateway';

@Module({
  controllers: [
    AppController,
    TransfersController,
    ConfigController,
    AccountsController,
    DepositsController,
    PaymentsController,
    TaxesController,
    WithdrawsController,
  ],
  providers: [
    TaxRevenueGateway,
    {
      provide: ConfigService,
      useFactory: async (taxRevenueGateway: TaxRevenueGateway) => {
        const cs = new ConfigService(taxRevenueGateway);
        await cs.init(process.env.APP_PATH + '/app.config.json');
        return cs;
      },
      inject: [TaxRevenueGateway],
    },
    {
      provide: LoggerService,
      useFactory: async () => {
        return new LoggerService();
      },
    },
    {
      provide: TransfersService,
      useFactory: async (
        loggerService: LoggerService,
        configService: ConfigService,
      ) => {
        return new TransfersService(loggerService, configService);
      },
      inject: [LoggerService, ConfigService],
    },
    {
      provide: DepositsService,
      useFactory: async (
        loggerService: LoggerService,
        configService: ConfigService,
      ) => {
        return new DepositsService(loggerService, configService);
      },
      inject: [LoggerService, ConfigService],
    },
    {
      provide: AccountsService,
      useFactory: async (
        loggerService: LoggerService,
        configService: ConfigService,
      ) => {
        return new AccountsService(loggerService, configService);
      },
      inject: [LoggerService, ConfigService],
    },
    {
      provide: PaymentListenerService,
      useFactory: async (
        configService: ConfigService,
        depositService: DepositsService,
        paymentService: PaymentsService,
        taxService: TaxesService,
        accountService: AccountsService,
      ) => {
        return new PaymentListenerService(
          configService,
          depositService,
          paymentService,
          taxService,
          accountService,
        );
      },
      inject: [
        ConfigService,
        DepositsService,
        PaymentsService,
        TaxesService,
        AccountsService,
      ],
    },
    {
      provide: PaymentsService,
      useFactory: async (
        loggerService: LoggerService,
        configService: ConfigService,
      ) => {
        return new PaymentsService(loggerService, configService);
      },
      inject: [LoggerService, ConfigService],
    },
    {
      provide: TaxesService,
      useFactory: async (
        loggerService: LoggerService,
        configService: ConfigService,
      ) => {
        return new TaxesService(loggerService, configService);
      },
      inject: [LoggerService, ConfigService],
    },
    {
      provide: WithdrawsService,
      useFactory: async (
        loggerService: LoggerService,
        configService: ConfigService,
      ) => {
        return new WithdrawsService(loggerService, configService);
      },
      inject: [LoggerService, ConfigService],
    },
  ],
})
export class AppModule {}
