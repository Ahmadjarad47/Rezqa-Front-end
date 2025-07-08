import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DynamicFieldDto, GetAllDynamicFieldsRequest, PaginatedResult } from '../../models/dynamic-field';
import { DynamicFieldService } from '../../services/dynamic-field.service';
import { CategoryService } from '../../services/category.service';
import { SubCategoryService } from '../../services/subcategory.service';
import { Category } from '../../models/category';
import { SubCategoryDto } from '../../models/subcategory';

@Component({
  selector: 'app-dynamic-fields',
  standalone: false,
  templateUrl: './dynamic-fields.component.html',
  styleUrl: './dynamic-fields.component.css'
})
export class DynamicFieldsComponent implements OnInit {
  dynamicFields: DynamicFieldDto[] = [];
  categories: Category[] = [];
  subcategories: SubCategoryDto[] = [];
  loading = false;
  error = '';
  showForm = false;
  editingDynamicField: DynamicFieldDto | null = null;

  // Delete modal properties
  showDeleteModal = false;
  deletingDynamicField: DynamicFieldDto | null = null;
  deleteLoading = false;

  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  hasPreviousPage = false;
  hasNextPage = false;

  // Search and filter properties
  searchForm: FormGroup;
  searchTerm = '';
  typeFilter: string | null = null;
  categoryIdFilter: number | null = null;
  subCategoryIdFilter: number | null = null;

  // Field types for filter
  fieldTypes = [
    'text', 'number', 
    'select', 'radio', 'checkbox', 'textarea'
  ];

  // Math property for template
  Math = Math;

  constructor(
    private dynamicFieldService: DynamicFieldService,
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      searchTerm: [''],
      type: [''],
      categoryId: [''],
      subCategoryId: ['']
    });
  }

  ngOnInit(): void {
    this.loadDynamicFields();
    this.loadCategories();
    this.setupSearchListener();
  }

  loadCategories(): void {
    this.categoryService.getCategories({
      pageNumber: 1,
      pageSize: 1000,
      isActive: true
    }).subscribe({
      next: (result) => {
        this.categories = result.items;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadSubCategories(categoryId?: number): void {
    if (!categoryId) {
      this.subcategories = [];
      return;
    }

    this.subCategoryService.getSubCategoriesByCategory(categoryId, {
      pageNumber: 1,
      pageSize: 1000
    }).subscribe({
      next: (result) => {
        this.subcategories = result.items;
      },
      error: (error) => {
        console.error('Error loading subcategories:', error);
      }
    });
  }

  setupSearchListener(): void {
    this.searchForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(values => {
        this.searchTerm = values.searchTerm;
        this.typeFilter = values.type || null;
        this.categoryIdFilter = values.categoryId || null;
        this.subCategoryIdFilter = values.subCategoryId || null;
        this.currentPage = 1; // Reset to first page when searching
        this.loadDynamicFields();
      });

    // Listen for category changes to load subcategories
    this.searchForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      this.loadSubCategories(categoryId);
      this.searchForm.patchValue({ subCategoryId: '' }, { emitEvent: false });
    });
  }

  loadDynamicFields(): void {
    this.loading = true;
    this.error = '';
    
    const request: GetAllDynamicFieldsRequest = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm || undefined,
      type: this.typeFilter || undefined,
      categoryId: this.categoryIdFilter || undefined,
      subCategoryId: this.subCategoryIdFilter || undefined
    };

    this.dynamicFieldService.getDynamicFields(request).subscribe({
      next: (result: PaginatedResult<DynamicFieldDto>) => {
        this.dynamicFields = result.items;
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages;
        this.hasPreviousPage = result.hasPreviousPage;
        this.hasNextPage = result.hasNextPage;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load dynamic fields. Please try again.';
        this.loading = false;
        console.error('Error loading dynamic fields:', error);
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadDynamicFields();
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.pageSize = +target.value;
      this.currentPage = 1; // Reset to first page when changing page size
      this.loadDynamicFields();
    }
  }

  clearFilters(): void {
    this.searchForm.patchValue({
      searchTerm: '',
      type: '',
      categoryId: '',
      subCategoryId: ''
    });
  }

  addDynamicField(): void {
    this.editingDynamicField = null;
    this.showForm = true;
  }

  editDynamicField(dynamicField: DynamicFieldDto): void {
    this.editingDynamicField = { ...dynamicField };
    this.showForm = true;
  }

  openDeleteModal(dynamicField: DynamicFieldDto): void {
    this.deletingDynamicField = dynamicField;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingDynamicField = null;
    this.deleteLoading = false;
  }

  confirmDelete(): void {
    if (!this.deletingDynamicField) return;

    this.deleteLoading = true;
    this.dynamicFieldService.deleteDynamicField(this.deletingDynamicField.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.loadDynamicFields(); // Reload to refresh pagination
      },
      error: (error) => {
        this.error = 'Failed to delete dynamic field. Please try again.';
        this.deleteLoading = false;
        console.error('Error deleting dynamic field:', error);
      }
    });
  }

  onFormSubmit(): void {
    this.showForm = false;
    this.editingDynamicField = null;
    this.loadDynamicFields(); // Reload to refresh pagination
  }

  onFormCancel(): void {
    this.showForm = false;
    this.editingDynamicField = null;
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  getFieldTypeBadgeColor(type: string): string {
    const colorMap: { [key: string]: string } = {
      'text': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'number': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'email': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'tel': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'url': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'date': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'datetime-local': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'select': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'radio': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      'checkbox': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      'textarea': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'file': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
      'color': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
      'range': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
} 