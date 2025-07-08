import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Category, GetAllCategoriesRequest, PaginatedResult } from '../../models/category';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-categories',
  standalone: false,
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = [];
  loading = false;
  error = '';
  showForm = false;
  editingCategory: Category | null = null;

  // Delete modal properties
  showDeleteModal = false;
  deletingCategory: Category | null = null;
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
  isActiveFilter: boolean | null = null;

  // Math property for template
  Math = Math;

  constructor(
    private categoryService: CategoryService,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      searchTerm: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.setupSearchListener();
  }

  get activeCategoriesCount(): number {
    return this.categories.filter(c => c.isActive).length;
  }

  setupSearchListener(): void {
    this.searchForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(values => {
        this.searchTerm = values.searchTerm;
        this.isActiveFilter = values.isActive;
        this.currentPage = 1; // Reset to first page when searching
        this.loadCategories();
      });
  }

  loadCategories(): void {
    this.loading = true;
    this.error = '';
    
    const request: GetAllCategoriesRequest = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm || undefined,
      isActive: this.isActiveFilter !== null ? this.isActiveFilter : undefined
    };

    this.categoryService.getCategories(request).subscribe({
      next: (result: PaginatedResult<Category>) => {
        this.categories = result.items;
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages;
        this.hasPreviousPage = result.hasPreviousPage;
        this.hasNextPage = result.hasNextPage;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load categories. Please try again.';
        this.loading = false;
        console.error('Error loading categories:', error);
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCategories();
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.pageSize = +target.value;
      this.currentPage = 1; // Reset to first page when changing page size
      this.loadCategories();
    }
  }

  clearFilters(): void {
    this.searchForm.patchValue({
      searchTerm: '',
      isActive: null
    });
  }

  addCategory(): void {
    this.editingCategory = null;
    this.showForm = true;
  }

  editCategory(category: Category): void {
    this.editingCategory = { ...category };
    this.showForm = true;
  }

  openDeleteModal(category: Category): void {
    this.deletingCategory = category;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingCategory = null;
    this.deleteLoading = false;
  }

  confirmDelete(): void {
    if (!this.deletingCategory) return;

    this.deleteLoading = true;
    this.categoryService.deleteCategory(this.deletingCategory.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.loadCategories(); // Reload to refresh pagination
      },
      error: (error) => {
        this.error = 'Failed to delete category. Please try again.';
        this.deleteLoading = false;
        console.error('Error deleting category:', error);
      }
    });
  }

  onFormSubmit(): void {
    this.showForm = false;
    this.editingCategory = null;
    this.loadCategories(); // Reload to refresh pagination
  }

  onFormCancel(): void {
    this.showForm = false;
    this.editingCategory = null;
  }

  toggleActive(category: Category): void {
    const updatedCategory = { ...category, isActive: !category.isActive };
    this.categoryService.updateCategory(category.id, updatedCategory).subscribe({
      next: (data) => {
        const index = this.categories.findIndex(cat => cat.id === category.id);
        if (index !== -1) {
          this.categories[index] = data;
        }
      },
      error: (error) => {
        this.error = 'Failed to update category status. Please try again.';
        console.error('Error updating category:', error);
      }
    });
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
