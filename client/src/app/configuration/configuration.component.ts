import { Component, OnInit } from '@angular/core';
import { OutputConfigurationI } from '../interfaces/configuration.interface';
import { ConfigurationService } from '../services/configuration.service';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.css'],
})
export class ConfigurationComponent implements OnInit {
  config: OutputConfigurationI;
  constructor(private configSrv: ConfigurationService) {}

  ngOnInit() {
    this.configSrv.getConfig().subscribe(conf => (this.config = conf));
  }
}
