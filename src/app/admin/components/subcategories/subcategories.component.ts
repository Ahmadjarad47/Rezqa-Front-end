import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SubCategoryDto, GetAllSubCategoriesRequest, PaginatedResult } from '../../models/subcategory';
import { SubCategoryService } from '../../services/subcategory.service';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category';

@Component({
  selector: 'app-subcategories',
  standalone: false,
  templateUrl: './subcategories.component.html',
  styleUrl: './subcategories.component.css'
})
export class SubCategoriesComponent implements OnInit {
  subcategories: SubCategoryDto[] = [];
  categories: Category[] = [];
  loading = false;
  error = '';
  showForm = false;
  editingSubCategory: SubCategoryDto | null = null;

  // Delete modal properties
  showDeleteModal = false;
  deletingSubCategory: SubCategoryDto | null = null;
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
  categoryIdFilter: number | null = null;

  // Math property for template
  Math = Math;

  constructor(
    private subCategoryService: SubCategoryService,
    private categoryService: CategoryService,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      searchTerm: [''],
      categoryId: ['']
    });
  }

  ngOnInit(): void {
    this.loadSubCategories();
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

  setupSearchListener(): void {
    this.searchForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(values => {
        this.searchTerm = values.searchTerm;
        this.categoryIdFilter = values.categoryId || null;
        this.currentPage = 1; // Reset to first page when searching
        this.loadSubCategories();
      });
  }

  loadSubCategories(): void {
    this.loading = true;
    this.error = '';
    
    const request: GetAllSubCategoriesRequest = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm || undefined,
      categoryId: this.categoryIdFilter || undefined
    };

    this.subCategoryService.getSubCategories(request).subscribe({
      next: (result: PaginatedResult<SubCategoryDto>) => {
        this.subcategories = result.items;
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages;
        this.hasPreviousPage = result.hasPreviousPage;
        this.hasNextPage = result.hasNextPage;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load subcategories. Please try again.';
        this.loading = false;
        console.error('Error loading subcategories:', error);
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadSubCategories();
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.pageSize = +target.value;
      this.currentPage = 1; // Reset to first page when changing page size
      this.loadSubCategories();
    }
  }

  clearFilters(): void {
    this.searchForm.patchValue({
      searchTerm: '',
      categoryId: ''
    });
  }

  addSubCategory(): void {
    this.editingSubCategory = null;
    this.showForm = true;
  }

  editSubCategory(subcategory: SubCategoryDto): void {
    this.editingSubCategory = { ...subcategory };
    this.showForm = true;
  }

  toggleActive(subcategory: SubCategoryDto): void {
    // This would typically call an API to toggle the active status
    // For now, we'll just log it
    console.log('Toggle active for subcategory:', subcategory.id);
    // You would implement the actual API call here
  }

  openDeleteModal(subcategory: SubCategoryDto): void {
    this.deletingSubCategory = subcategory;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingSubCategory = null;
    this.deleteLoading = false;
  }

  confirmDelete(): void {
    if (!this.deletingSubCategory) return;

    this.deleteLoading = true;
    this.subCategoryService.deleteSubCategory(this.deletingSubCategory.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.loadSubCategories(); // Reload to refresh pagination
      },
      error: (error) => {
        this.error = 'Failed to delete subcategory. Please try again.';
        this.deleteLoading = false;
        console.error('Error deleting subcategory:', error);
      }
    });
  }

  onFormSubmit(): void {
    this.showForm = false;
    this.editingSubCategory = null;
    this.loadSubCategories(); // Reload to refresh pagination
  }

  onFormCancel(): void {
    this.showForm = false;
    this.editingSubCategory = null;
  }

  get activeSubCategoriesCount(): number {
    return this.subcategories.filter(subcategory => subcategory.category?.isActive).length;
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
}
