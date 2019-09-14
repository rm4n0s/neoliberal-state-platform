import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OutputConfigurationI } from '../interfaces/configuration.interface';
import { OutputState } from '../interfaces/state.interface';

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  constructor(private http: HttpClient) {}

  getConfig() {
    return this.http.get<OutputConfigurationI>('/api/config');
  }

  getState() {
    return this.http.get<OutputState>('/api/config/state');
  }
}
