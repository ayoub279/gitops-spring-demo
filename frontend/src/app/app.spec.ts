import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

describe('FlowOps', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('renders the login screen', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sign in to FlowOps');
  });
  it('authenticates and displays backend tasks', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const username = el.querySelector<HTMLInputElement>('#username')!;
    const password = el.querySelector<HTMLInputElement>('#password')!;
    username.value = 'demo'; username.dispatchEvent(new Event('input'));
    password.value = 'test'; password.dispatchEvent(new Event('input'));
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    const http = TestBed.inject(HttpTestingController);
    const info = http.expectOne('/backend/');
    expect(info.request.headers.get('Authorization')).toBe('Basic ZGVtbzp0ZXN0');
    info.flush({ application: 'demo', message: 'Version 1' });
    http.expectOne('/backend/api/tasks').flush([{ id: '1', title: 'Ship it', completed: false }]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el.textContent).toContain('Ship it');
    expect(el.textContent).toContain('Version 1');
  });
});
