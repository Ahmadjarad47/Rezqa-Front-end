import { Component, OnInit } from '@angular/core';
import { ReportService } from '../../services/report.service';

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
  loading = false;
  error = '';
  cacheCleared: any = null;

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.error = '';
    this.reportService.getStatus().subscribe({
      next: (data) => this.status = data,
      error: (err) => this.error = 'Failed to load status.'
    });
    this.reportService.getHealth().subscribe({
      next: (data) => this.health = data,
      error: (err) => this.error = 'Failed to load health.'
    });
    this.reportService.getMetrics().subscribe({
      next: (data) => { this.metrics = data; this.loading = false; },
      error: (err) => { this.error = 'Failed to load metrics.'; this.loading = false; }
    });
  }

  onClearCache(): void {
    this.loading = true;
    this.reportService.clearCache().subscribe({
      next: (data) => {
        this.cacheCleared = data;
        this.loadAll();
      },
      error: (err) => {
        this.error = 'Failed to clear cache.';
        this.loading = false;
      }
    });
  }
}
