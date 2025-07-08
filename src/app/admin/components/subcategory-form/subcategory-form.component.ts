import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubCategoryDto, CreateSubCategoryRequest, UpdateSubCategoryRequest } from '../../models/subcategory';
import { SubCategoryService } from '../../services/subcategory.service';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category';

@Component({
  selector: 'app-subcategory-form',
  standalone: false,
  templateUrl: './subcategory-form.component.html',
  styleUrl: './subcategory-form.component.css'
})
export class SubCategoryFormComponent implements OnInit {
  @Input() subCategory: SubCategoryDto | null = null;
  @Output() formSubmit = new EventEmitter<void>();
  @Output() formCancel = new EventEmitter<void>();

  subCategoryForm: FormGroup;
  loading = false;
  error = '';
  categories: Category[] = [];
  categoriesLoading = false;

  constructor(
    private fb: FormBuilder,
    private subCategoryService: SubCategoryService,
    private categoryService: CategoryService
  ) {
    this.subCategoryForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      categoryId: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    if (this.subCategory) {
      this.subCategoryForm.patchValue({
        title: this.subCategory.title,
        categoryId: this.subCategory.categoryId
      });
    }
  }

  loadCategories(): void {
    this.categoriesLoading = true;
    this.categoryService.getCategories({
      pageNumber: 1,
      pageSize: 1000,
      isActive: true
    }).subscribe({
      next: (result) => {
        this.categories = result.items;
        this.categoriesLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load categories. Please try again.';
        this.categoriesLoading = false;
        console.error('Error loading categories:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.subCategoryForm.valid) {
      this.loading = true;
      this.error = '';

      const formValue = this.subCategoryForm.value;
      let request;

      if (this.subCategory) {
        // Update
        const updateRequest: UpdateSubCategoryRequest = {
          id: this.subCategory.id,
          title: formValue.title,
          categoryId: formValue.categoryId
        };
        request = this.subCategoryService.updateSubCategory(this.subCategory.id, updateRequest);
      } else {
        // Create
        const createRequest: CreateSubCategoryRequest = {
          title: formValue.title,
          categoryId: formValue.categoryId
        };
        request = this.subCategoryService.createSubCategory(createRequest);
      }

      request.subscribe({
        next: (data) => {
          this.loading = false;
          this.formSubmit.emit();
        },
        error: (error) => {
          this.loading = false;
          this.error = 'Failed to save sub-category. Please try again.';
          console.error('Error saving sub-category:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.formCancel.emit();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.subCategoryForm.controls).forEach(key => {
      const control = this.subCategoryForm.get(key);
      control?.markAsTouched();
    });
  }

  get isEditMode(): boolean {
    return !!this.subCategory;
  }

  get titleError(): string {
    const control = this.subCategoryForm.get('title');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Title is required';
      if (control.errors['minlength']) return 'Title must be at least 2 characters';
    }
    return '';
  }

  get categoryIdError(): string {
    const control = this.subCategoryForm.get('categoryId');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Category is required';
    }
    return '';
  }

  get selectedCategory(): Category | undefined {
    const categoryId = this.subCategoryForm.get('categoryId')?.value;
    return this.categories.find(cat => cat.id === categoryId);
  }
}
