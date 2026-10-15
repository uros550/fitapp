import { TestBed } from '@angular/core/testing';
import { Health, HealthStatus } from './health';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

describe('Health', () => {
  let health: Health;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    health = TestBed.inject(Health);
    http = TestBed.inject(HttpTestingController);
  });
  
  afterEach(() => http.verify());

  it('requests /api/health and returns the status', () => {
    let result: HealthStatus | undefined;
    health.check().subscribe((status) => (result = status));

    const request = http.expectOne('/api/health');
    expect(request.request.method).toBe('GET');
    request.flush({ status: 'ok' });

    expect(result).toEqual({ status: 'ok' });
  });

  it('reports an error when the server fails', () => {
    let failed = false;
    health.check().subscribe({ error: () => (failed = true) });

    http.expectOne('/api/health').flush(null, { status: 500, statusText: 'Server Error' });

    expect(failed).toBe(true);
  });
});
