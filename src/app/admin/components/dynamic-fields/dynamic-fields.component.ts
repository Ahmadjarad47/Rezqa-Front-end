import { Component, OnInit } from '@angular/core';
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
      'text': 'bg-accent-light text-text',
      'number': 'bg-accent text-text',
      'email': 'bg-accent-light text-text',
      'tel': 'bg-accent-light text-text',
      'url': 'bg-accent-light text-text',
      'date': 'bg-accent-light text-text',
      'datetime-local': 'bg-accent-light text-text',
      'select': 'bg-accent-light text-text',
      'radio': 'bg-accent-light text-text',
      'checkbox': 'bg-accent-light text-text',
      'textarea': 'bg-accent-light text-text',
      'file': 'bg-accent-light text-text',
      'color': 'bg-accent-light text-text',
      'range': 'bg-accent-light text-text'
    };
    return colorMap[type] || 'bg-accent-light text-text';
  }
} 