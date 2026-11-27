import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

interface Task { id: string; title: string; completed: boolean; }
interface Info { application: string; message: string; }
type Filter = 'all' | 'open' | 'done';

@Component({ selector: 'app-root', imports: [FormsModule], templateUrl: './app.html', styleUrl: './app.css' })
export class App {
  private readonly http = inject(HttpClient);
  private auth = '';
  protected username = '';
  protected password = '';
  protected draft = '';
  protected editId = '';
  protected editTitle = '';
  protected readonly authenticated = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly tasks = signal<Task[]>([]);
  protected readonly info = signal<Info | null>(null);
  protected readonly filter = signal<Filter>('all');
  protected readonly completed = computed(() => this.tasks().filter(t => t.completed).length);
  protected readonly pending = computed(() => this.tasks().length - this.completed());
  protected readonly filtered = computed(() => this.tasks().filter(t => this.filter() === 'all' || (this.filter() === 'done' ? t.completed : !t.completed)));
  private headers(): HttpHeaders { return new HttpHeaders({ Authorization: 'Basic ' + this.auth }); }
  private fail(e: unknown): void {
    if (e instanceof HttpErrorResponse && e.status === 401) {
      this.logout();
      this.error.set('Your credentials were not accepted. Check them and try again.');
    } else this.error.set('Could not reach the API. Check that the backend and proxy are running.');
  }
  protected async login(): Promise<void> {
    if (!this.username.trim() || !this.password) { this.error.set('Enter your username and password.'); return; }
    this.busy.set(true); this.error.set('');
    try {
      const bytes = new TextEncoder().encode(this.username + ':' + this.password);
      this.auth = btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''));
      const [info, tasks] = await Promise.all([
        firstValueFrom(this.http.get<Info>('/backend/', { headers: this.headers() })),
        firstValueFrom(this.http.get<Task[]>('/backend/api/tasks', { headers: this.headers() }))
      ]);
      this.info.set(info); this.tasks.set(tasks); this.authenticated.set(true); this.password = '';
    } catch (e) { this.auth = ''; this.fail(e); } finally { this.busy.set(false); }
  }
  protected logout(): void {
    this.auth = ''; this.password = ''; this.authenticated.set(false); this.info.set(null);
    this.tasks.set([]); this.editId = ''; this.draft = ''; this.notice.set('');
  }
  protected async refresh(): Promise<void> {
    this.error.set('');
    try {
      const [info, tasks] = await Promise.all([
        firstValueFrom(this.http.get<Info>('/backend/', { headers: this.headers() })),
        firstValueFrom(this.http.get<Task[]>('/backend/api/tasks', { headers: this.headers() }))
      ]);
      this.info.set(info); this.tasks.set(tasks); this.notice.set('Workspace refreshed.');
    } catch (e) { this.fail(e); }
  }
  protected async add(): Promise<void> {
    const title = this.draft.trim();
    if (!title || title.length > 120) { this.error.set('Enter a task title between 1 and 120 characters.'); return; }
    this.error.set(''); this.busy.set(true);
    try {
      const task = await firstValueFrom(this.http.post<Task>('/backend/api/tasks', { title, completed: false }, { headers: this.headers() }));
      this.tasks.update(items => [...items, task]); this.draft = ''; this.notice.set('Task added.');
    } catch (e) { this.fail(e); } finally { this.busy.set(false); }
  }
  protected startEdit(task: Task): void { this.editId = task.id; this.editTitle = task.title; this.error.set(''); }
  protected async save(task: Task, title: string, completed: boolean): Promise<void> {
    title = title.trim();
    if (!title || title.length > 120) { this.error.set('Enter a task title between 1 and 120 characters.'); return; }
    this.error.set(''); this.busy.set(true);
    try {
      const updated = await firstValueFrom(this.http.put<Task>('/backend/api/tasks/' + task.id, { title, completed }, { headers: this.headers() }));
      this.tasks.update(items => items.map(item => item.id === task.id ? updated : item));
      this.editId = ''; this.notice.set('Task updated.');
    } catch (e) { this.fail(e); } finally { this.busy.set(false); }
  }
  protected async remove(task: Task): Promise<void> {
    this.error.set(''); this.busy.set(true);
    try {
      await firstValueFrom(this.http.delete<void>('/backend/api/tasks/' + task.id, { headers: this.headers() }));
      this.tasks.update(items => items.filter(item => item.id !== task.id)); this.notice.set('Task deleted.');
    } catch (e) { this.fail(e); } finally { this.busy.set(false); }
  }
}
