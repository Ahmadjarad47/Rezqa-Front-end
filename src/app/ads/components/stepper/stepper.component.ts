import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ComponentCanDeactivate } from '../../guards/ads-leave.guard';

// Declare Flowbite as a global object
declare const Modal: any;

interface Step {
  id: string;
  title: string;
  path: string;
  icon: string;
  completed: boolean;
  current: boolean;
}

@Component({
  selector: 'app-stepper',
  standalone: false,
  templateUrl: './stepper.component.html',
  styleUrl: './stepper.component.css',
})
export class StepperComponent
  implements OnInit, OnDestroy, ComponentCanDeactivate
{
  steps: Step[] = [
    {
      id: 'select-category',
      title: 'اختيار الفئة',
      path: '/ads/select-category',
      icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
      completed: false,
      current: false,
    },
    {
      id: 'select-sub-category',
      title: 'اختيار الفئة الفرعية',
      path: '/ads/select-sub-category',
      icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
      completed: false,
      current: false,
    },
    {
      id: 'select-details',
      title: 'تحديد التفاصيل',
      path: '/ads/select-details',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      completed: false,
      current: false,
    },
    {
      id: 'upload-photo',
      title: 'رفع الصور',
      path: '/ads/upload-photo',
      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
      completed: false,
      current: false,
    },
  ];

  currentStepIndex = 0;
  progressPercentage = 0;
  isNavigating = false;
  leaveModal: any = null;

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event instanceof NavigationEnd) {
          this.updateStepProgress();
        }
      });

    // Initial update
    this.updateStepProgress();

    // Initialize modal after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.initializeModal();
    }, 100);

    // Add beforeunload event listener
    if (typeof window != 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    }
  }

  ngOnDestroy() {
    // Remove beforeunload event listener
    if (typeof window != 'undefined') {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
    }
  }

  private handleBeforeUnload = (event: BeforeUnloadEvent) => {
    // Show the leave confirmation modal
    this.showLeaveConfirmation();
  };

  initializeModal() {
    if (typeof document != 'undefined') {
      const modalElement = document.getElementById('leave-confirmation-modal');
      if (modalElement && typeof Modal !== 'undefined') {
        this.leaveModal = new Modal(modalElement, {
          placement: 'center',
          backdrop: 'dynamic',
          backdropClasses:
            'bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40',
          closable: true,
          onHide: () => {
            console.log('Leave modal is hidden');
          },
          onShow: () => {
            console.log('Leave modal is shown');
          },
          onToggle: () => {
            console.log('Leave modal has been toggled');
          },
        });
      }
    }
  }

  updateStepProgress() {
    const currentPath = this.router.url;

    // Find current step index
    this.currentStepIndex = this.steps.findIndex((step) =>
      currentPath.includes(step.id)
    );

    if (this.currentStepIndex === -1) {
      this.currentStepIndex = 0; // Default to first step
    }

    // Update step states
    this.steps.forEach((step, index) => {
      step.current = index === this.currentStepIndex;
      step.completed = index < this.currentStepIndex;
    });

    // Calculate progress percentage
    this.progressPercentage =
      ((this.currentStepIndex + 1) / this.steps.length) * 100;
  }

  getCurrentStepTitle(): string {
    return this.steps[this.currentStepIndex]?.title || 'تحديد التفاصيل';
  }

  getCompletedStepsCount(): number {
    return this.steps.filter((step) => step.completed).length;
  }

  getTotalStepsCount(): number {
    return this.steps.length;
  }

  isStepCompleted(stepIndex: number): boolean {
    return stepIndex < this.currentStepIndex;
  }

  isStepCurrent(stepIndex: number): boolean {
    return stepIndex === this.currentStepIndex;
  }

  isStepUpcoming(stepIndex: number): boolean {
    return stepIndex > this.currentStepIndex;
  }

  // Enhanced method to handle step navigation
  navigateToStep(stepIndex: number): void {
    // Only allow navigation to completed steps or current step
    if (stepIndex <= this.currentStepIndex && !this.isNavigating) {
      const targetStep = this.steps[stepIndex];
      if (targetStep) {
        this.isNavigating = true;
        this.router
          .navigate([targetStep.path])
          .then(() => {
            // Navigation completed successfully
            this.isNavigating = false;
          })
          .catch(() => {
            // Navigation failed
            this.isNavigating = false;
          });
      }
    }
  }

  // Check if step is clickable
  isStepClickable(stepIndex: number): boolean {
    return stepIndex <= this.currentStepIndex && !this.isNavigating;
  }

  // Get cursor style for step
  getStepCursorStyle(stepIndex: number): string {
    return this.isStepClickable(stepIndex)
      ? 'cursor-pointer'
      : 'cursor-default';
  }

  // Check if step is currently navigating
  isStepNavigating(stepIndex: number): boolean {
    return this.isNavigating && stepIndex <= this.currentStepIndex;
  }

  // Show leave confirmation modal
  showLeaveConfirmation(): void {
    if (this.leaveModal) {
      this.leaveModal.show();
    } else {
      // Fallback: try to initialize modal again
      this.initializeModal();
      if (this.leaveModal) {
        this.leaveModal.show();
      }
    }
  }

  // Hide leave confirmation modal
  hideLeaveConfirmation(): void {
    if (this.leaveModal) {
      this.leaveModal.hide();
    }
  }

  // Confirm leaving the ads module
  confirmLeave(): void {
    this.hideLeaveConfirmation();
    // Navigate to home or previous page
    this.router.navigate(['/']);
  }

  // Cancel leaving and stay in ads module
  cancelLeave(): void {
    this.hideLeaveConfirmation();
  }

  canDeactivate(): boolean {
    // Show the modal and return false to prevent navigation
    this.showLeaveConfirmation();
    return false;
  }
}
