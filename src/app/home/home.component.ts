import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../identity/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  isAuthenticated = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
  }

  onGetStarted(): void {
    if (this.isAuthenticated) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/identity/login']);
    }
  }

  onLearnMore(): void {
    // Implement learn more functionality
    console.log('Learn more clicked');
  }
}
