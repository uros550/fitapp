import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';

export interface HealthStatus {
  status: string;
  database: string;
}

@Service()
export class Health {
  private readonly http = inject(HttpClient);

  check() {
    return this.http.get<HealthStatus>('/api/health');
  }
}
