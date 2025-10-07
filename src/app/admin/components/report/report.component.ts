import { Component, OnInit } from '@angular/core';
import { ReportService } from '../../services/report.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-report',
  standalone: false,
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export class ReportComponent implements OnInit {
  status: any = null;
  health: any = null;
  metrics: any = null;
  adExpirationSettings: any = null;
  adExpirationStatus: any = null;
  loading = false;
  error = '';
  
  // Forms
  updateSettingsForm!: FormGroup;
  manualCheckForm!: FormGroup;
  
  // UI states
  isUpdatingSettings = false;
  isTriggeringCheck = false;
  isClearingCache = false;

  constructor(
    private reportService: ReportService,
    private formBuilder: FormBuilder
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.loadAll();
  }

  private initForms(): void {
    this.updateSettingsForm = this.formBuilder.group({
      expirationDays: ['', [Validators.required, Validators.min(1)]],
      checkIntervalHours: ['', [Validators.required, Validators.min(1), Validators.max(168)]]
    });

    this.manualCheckForm = this.formBuilder.group({
      expirationDays: ['', [Validators.required, Validators.min(1)]]
    });
  }

  loadAll(): void {
    this.loading = true;
    this.error = '';
    
    // Load basic status
    this.reportService.getStatus().subscribe({
      next: (data) => this.status = data,
      error: (err) => this.error = 'Failed to load status.'
    });
    
    // Load health information
    this.reportService.getHealth().subscribe({
      next: (data) => this.health = data,
      error: (err) => this.error = 'Failed to load health.'
    });
    
    // Load metrics
    this.reportService.getMetrics().subscribe({
      next: (data) => { this.metrics = data; this.loading = false; },
      error: (err) => { this.error = 'Failed to load metrics.'; this.loading = false; }
    });

    // Load ad expiration settings
    this.reportService.getAdExpirationSettings().subscribe({
      next: (data) => {
        if (data.success) {
          this.adExpirationSettings = data.data;
          this.updateSettingsForm.patchValue({
            expirationDays: data.data.expirationDays,
            checkIntervalHours: data.data.checkIntervalHours
          });
        }
      },
      error: (err) => console.error('Failed to load ad expiration settings:', err)
    });

    // Load ad expiration status
    this.reportService.getAdExpirationStatus().subscribe({
      next: (data) => {
        if (data.success) {
          this.adExpirationStatus = data.data;
        }
      },
      error: (err) => console.error('Failed to load ad expiration status:', err)
    });
  }

  onUpdateSettings(): void {
    if (this.updateSettingsForm.invalid) return;

    this.isUpdatingSettings = true;
    const settings = this.updateSettingsForm.value;

    this.reportService.updateAdExpirationSettings(settings).subscribe({
      next: (response) => {
        if (response.success) {
          this.adExpirationSettings = response.data;
          this.loadAll(); // Reload all data
        }
        this.isUpdatingSettings = false;
      },
      error: (err) => {
        console.error('Failed to update settings:', err);
        this.isUpdatingSettings = false;
      }
    });
  }

  onManualExpirationCheck(): void {
    if (this.manualCheckForm.invalid) return;

    this.isTriggeringCheck = true;
    const request = this.manualCheckForm.value;

    this.reportService.triggerAdExpirationCheck(request).subscribe({
      next: (response) => {
        if (response.success) {
          console.log(`Deactivated ${response.data.deactivatedCount} expired ads`);
          this.loadAll(); // Reload all data
        }
        this.isTriggeringCheck = false;
      },
      error: (err) => {
        console.error('Failed to trigger expiration check:', err);
        this.isTriggeringCheck = false;
      }
    });
  }

  onClearCache(): void {
    this.isClearingCache = true;
    
    this.reportService.clearAllCache().subscribe({
      next: (response) => {
        console.log('Cache cleared:', response);
        this.loadAll(); // Reload all data
        this.isClearingCache = false;
      },
      error: (err) => {
        console.error('Failed to clear cache:', err);
        this.isClearingCache = false;
      }
    });
  }

  refreshData(): void {
    this.loadAll();
  }

  formatUptime(uptime: string): string {
    if (!uptime) return 'N/A';
    
    // Parse the uptime string and format it nicely
    try {
      const parts = uptime.split('.');
      if (parts.length >= 2) {
        const days = parseInt(parts[0]);
        const timePart = parts[1];
        
        if (days > 0) {
          return `${days} days, ${timePart}`;
        }
        return timePart;
      }
      return uptime;
    } catch {
      return uptime;
    }
  }

  formatMemory(mb: number): string {
    if (!mb) return 'N/A';
    return `${Math.round(mb)} MB`;
  }
}
