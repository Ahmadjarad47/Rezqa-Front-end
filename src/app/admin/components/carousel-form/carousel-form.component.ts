import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Carousel } from '../../models/carousel';

@Component({
  selector: 'app-carousel-form',
  standalone: false,
  templateUrl: './carousel-form.component.html',
  styleUrl: './carousel-form.component.css'
})
export class CarouselFormComponent implements OnInit {
  @Input() carousel: Carousel | null = null;
  @Output() formSubmit = new EventEmitter<void>();
  @Output() formCancel = new EventEmitter<void>();

  carouselForm: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isSubmitting = false;

  constructor(private fb: FormBuilder) {
    this.carouselForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      image: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.carousel) {
      this.carouselForm.patchValue({
        title: this.carousel.title || ''
      });
      this.imagePreview = this.carousel.imageUrl;
      // Remove required validator for image when editing
      this.carouselForm.get('image')?.clearValidators();
      this.carouselForm.get('image')?.updateValueAndValidity();
    } else {
      // Ensure image is required for new carousels
      this.carouselForm.get('image')?.setValidators([Validators.required]);
      this.carouselForm.get('image')?.updateValueAndValidity();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.createImagePreview();
      // Set the form control value to the selected file
      this.carouselForm.get('image')?.setValue(this.selectedFile);
    }
  }

  createImagePreview(): void {
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.carouselForm.get('image')?.setValue(null);
    // Clear the file input
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSubmit(): void {
    if (this.isFormValidForSubmission()) {
      this.isSubmitting = true;
      this.formSubmit.emit();
    } else {
      this.markFormGroupTouched();
    }
  }

  isFormValidForSubmission(): boolean {
    const titleValid = this.carouselForm.get('title')?.valid || false;
    const imageValid = this.carousel ? true : (this.carouselForm.get('image')?.valid || false);
    
    return titleValid && imageValid;
  }

  onCancel(): void {
    this.formCancel.emit();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.carouselForm.controls).forEach(key => {
      const control = this.carouselForm.get(key);
      control?.markAsTouched();
    });
  }

  getFormData(): FormData {
    const formData = new FormData();
    formData.append('Title', this.carouselForm.get('title')?.value || '');
    
    if (this.selectedFile) {
      formData.append('Image', this.selectedFile);
    }

    if (this.carousel) {
      formData.append('Id', this.carousel.id.toString());
    }

    return formData;
  }
}
