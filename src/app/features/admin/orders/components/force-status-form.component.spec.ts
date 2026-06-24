import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForceStatusFormComponent } from './force-status-form.component';

describe('ForceStatusFormComponent', () => {
  let fixture: ComponentFixture<ForceStatusFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ForceStatusFormComponent] }).compileComponents();
    fixture = TestBed.createComponent(ForceStatusFormComponent);
    fixture.componentRef.setInput('currentStatus', 'Pending');
    fixture.detectChanges();
  });

  it('AC-FE-ADMINORDERS-U-03: forcing status requires confirmation before emitting the change', () => {
    const emitSpy = vi.fn();
    fixture.componentInstance.statusChange.subscribe(emitSpy);

    const el: HTMLElement = fixture.nativeElement;
    el.querySelector('button')?.dispatchEvent(new Event('click', { bubbles: true }));
    fixture.detectChanges();

    expect(el.textContent).toContain('Manually change this order');
    expect(emitSpy).not.toHaveBeenCalled();

    const confirmButton = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.trim() === 'Confirm',
    );
    confirmButton?.dispatchEvent(new Event('click', { bubbles: true }));
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalledWith('Pending');
  });
});
