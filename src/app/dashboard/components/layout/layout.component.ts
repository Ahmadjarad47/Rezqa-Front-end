import { Component, inject, OnInit } from '@angular/core';
import { FlowbiteService } from '../../../core/services/flowbite.service';
import { AuthService } from '@app/identity/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent implements OnInit {
  authService = inject(AuthService);
  constructor(private flowbiteService: FlowbiteService) {}

  ngOnInit(): void {
    
    // Initialize Flowbite for sidebar functionality
    this.flowbiteService.loadFlowbite((flowbite) => {
      // Flowbite is loaded and ready to use
      console.log('Flowbite loaded for layout component');
    });
  }
}
