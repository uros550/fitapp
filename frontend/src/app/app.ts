import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Health } from './core/health';

type ServerState = 'checking' | 'ok' | 'unavailable';
type DatabaseState = 'ok' | 'unavailable';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly health = inject(Health);

  protected readonly serverState = signal<ServerState>('checking');
  protected readonly databaseState = signal<DatabaseState>('unavailable');

  constructor() {
    this.checkServer();
  }

  protected checkServer(): void {
    this.serverState.set('checking');
    this.health.check().subscribe({
      next: (result) => {
        this.databaseState.set(result.database === 'ok' ? 'ok' : 'unavailable');
        this.serverState.set(result.status === 'ok' ? 'ok' : 'unavailable');
      },
      error: () => this.serverState.set('unavailable'),
    });
  }
}