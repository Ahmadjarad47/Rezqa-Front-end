import { Component, OnDestroy, OnInit } from '@angular/core';
import { FlowbiteService } from './core/services/flowbite.service';
import { initFlowbite } from 'flowbite';
import { AuthService } from './identity/services/auth.service';
import { SignalRService } from './core/services/signalr.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'syria-open-store';

  constructor(private flowbiteService: FlowbiteService,private auth:AuthService,private signalRService:SignalRService) {}
  ngOnDestroy(): void {
    this.signalRService.stopConnection();
  }

  ngOnInit(): void {
    this.flowbiteService.loadFlowbite((flowbite) => {
      initFlowbite();
    });
    this.auth.getData().subscribe();
  }
}
