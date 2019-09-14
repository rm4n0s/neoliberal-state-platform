import { Controller, Get } from '@nestjs/common';
import { OutputConfigurationI } from '../interfaces/config.interface';
import { ConfigService } from './config.service';
import { OutputState } from '../interfaces/state.interface';

@Controller('api/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}
  @Get()
  getConfig(): OutputConfigurationI {
    const conf = this.configService.getConf();
    return {
      publicKey: conf.publicKey,
      limitLumens: conf.limitLumens,
      listAdmins: conf.listAdmins,
      isTest: conf.isTest,
      currencyUnits: conf.currencyUnits,
      horizonUrl: conf.horizonUrl,
      baseFeeMultiplier: conf.baseFeeMultiplier,
      enoughLumenForAssetAccount: conf.enoughLumenForAssetAccount,
      stellarTimeout: conf.stellarTimeout,
    };
  }

  @Get('/state')
  async getState(): Promise<OutputState> {
    return await this.configService.getState();
  }
}
