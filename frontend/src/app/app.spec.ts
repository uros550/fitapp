import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function render() {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    return { fixture, element };
  }

  it('shows the title and a checking message while waiting for the server', () => {
    const { element } = render();

    expect(element.textContent).toContain('FitApp');
    expect(element.textContent).toContain('Checking server...');

    http.expectOne('/api/health').flush({ status: 'ok' });
  });

  it('shows the server status when the health check succeeds', () => {
    const { fixture, element } = render();

    http.expectOne('/api/health').flush({ status: 'ok' });
    fixture.detectChanges();

    expect(element.textContent).toContain('Server status: ok');
  });

  it('shows an unavailable message when the health check fails', () => {
    const { fixture, element } = render();

    http.expectOne('/api/health').flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(element.textContent).toContain('Server is unavailable.');
    expect(element.querySelector('button')).not.toBeNull();
  });

  it('treats an unexpected status value as unavailable', () => {
    const { fixture, element } = render();

    http.expectOne('/api/health').flush({ status: 'degraded' });
    fixture.detectChanges();

    expect(element.textContent).toContain('Server is unavailable.');
  });

  it('checks again when Try again is clicked', () => {
    const { fixture, element } = render();

    http.expectOne('/api/health').flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    element.querySelector('button')?.click();
    fixture.detectChanges();
    expect(element.textContent).toContain('Checking server...');

    http.expectOne('/api/health').flush({ status: 'ok' });
    fixture.detectChanges();

    expect(element.textContent).toContain('Server status: ok');
  });
});