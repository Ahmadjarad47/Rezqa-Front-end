import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Category } from '../../models/category';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-category-form',
  standalone: false,
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.css',
})
export class CategoryFormComponent implements OnInit {
  @Input() category: Category | null = null;
  @Output() formSubmit = new EventEmitter<void>();
  @Output() formCancel = new EventEmitter<void>();

  categoryForm: FormGroup;
  loading = false;
  error = '';
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService
  ) {
    this.categoryForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      image: [''], // This will be used for preview only
      isActive: [true],
    });
  }

  ngOnInit(): void {
    if (this.category) {
      this.categoryForm.patchValue({
        title: this.category.title,
        description: this.category.description,
        image: this.category.image || '',
        isActive: this.category.isActive,
      });
    }
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.createImagePreview(file);
    }
  }

  createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreviewUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  getImagePreview(): string {
    return this.imagePreviewUrl || '';
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    // Reset the file input
    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSubmit(): void {
    if (this.categoryForm.valid) {
      this.loading = true;
      this.error = '';
      const formData = new FormData();
      formData.append('Title', this.categoryForm.value.title.trim());
      formData.append('Description', this.categoryForm.value.description.trim());
      formData.append('IsActive', this.categoryForm.value.isActive);
      if (this.selectedFile) {
        formData.append('Image', this.selectedFile);
      }
      let request;
      if (this.category) {
        // For update, use FormData and include Id if required
        formData.append('Id', this.category.id.toString());
        request = this.categoryService.updateCategory(this.category.id, formData);
      } else {
        request = this.categoryService.createCategory(formData);
      }
      request.subscribe({
        next: () => {
          this.loading = false;
          this.formSubmit.emit();
        },
        error: (error) => {
          this.loading = false;
          this.error = 'Failed to save category. Please try again.';
          console.error('Error saving category:', error);
        },
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.formCancel.emit();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.categoryForm.controls).forEach((key) => {
      const control = this.categoryForm.get(key);
      control?.markAsTouched();
    });
  }

  get isEditMode(): boolean {
    return !!this.category;
  }

  get titleError(): string {
    const control = this.categoryForm.get('title');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Title is required';
      if (control.errors['minlength'])
        return 'Title must be at least 2 characters';
    }
    return '';
  }

  get descriptionError(): string {
    const control = this.categoryForm.get('description');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Description is required';
      if (control.errors['minlength'])
        return 'Description must be at least 10 characters';
    }
    return '';
  }
}
