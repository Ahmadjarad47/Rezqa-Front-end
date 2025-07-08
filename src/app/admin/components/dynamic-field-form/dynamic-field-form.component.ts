import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DynamicFieldDto, CreateDynamicFieldRequest, UpdateDynamicFieldRequest, FieldOptionRequest } from '../../models/dynamic-field';
import { DynamicFieldService } from '../../services/dynamic-field.service';
import { CategoryService } from '../../services/category.service';
import { SubCategoryService } from '../../services/subcategory.service';
import { Category } from '../../models/category';
import { SubCategoryDto } from '../../models/subcategory';

@Component({
  selector: 'app-dynamic-field-form',
  standalone: false,
  templateUrl: './dynamic-field-form.component.html',
  styleUrl: './dynamic-field-form.component.css'
})
export class DynamicFieldFormComponent implements OnInit {
  @Input() dynamicField: DynamicFieldDto | null = null;
  @Output() formSubmit = new EventEmitter<void>();
  @Output() formCancel = new EventEmitter<void>();

  dynamicFieldsForm: FormGroup;
  categories: Category[] = [];
  subcategories: SubCategoryDto[] = [];
  loading = false;
  error = '';
  isEditMode = false;

  fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'number', label: 'Number Input' },
    { value: 'select', label: 'Select Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'textarea', label: 'Text Area' },

  ];

  constructor(
    private fb: FormBuilder,
    private dynamicFieldService: DynamicFieldService,
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService
  ) {
    this.dynamicFieldsForm = this.fb.group({
      dynamicFields: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.setupFormListeners();
    
    if (this.dynamicField) {
      this.isEditMode = true;
      this.loadSubCategories(this.dynamicField.categoryId);
      this.populateForm();
    } else {
      // Add at least one field for creation
      this.addDynamicField();
    }
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
        this.error = 'Failed to load categories. Please try again.';
      }
    });
  }

  loadSubCategories(categoryId: number): void {
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

  setupFormListeners(): void {
    // Listen for category changes in any field to load subcategories
    this.dynamicFields.valueChanges.subscribe(() => {
      // This will be handled individually for each field
    });
  }

  populateForm(): void {
    if (!this.dynamicField) return;

    this.dynamicFields.clear();
    const fieldGroup = this.createDynamicFieldGroup();
    
    fieldGroup.patchValue({
      title: this.dynamicField.title,
      name: this.dynamicField.name,
      type: this.dynamicField.type,
      categoryId: this.dynamicField.categoryId,
      subCategoryId: this.dynamicField.subCategoryId || '',
      shouldFilterByParent: this.dynamicField.shouldFilterByParent || false
    });

    // Populate options if they exist
    if (this.dynamicField.options && this.dynamicField.options.length > 0) {
      const optionsArray = fieldGroup.get('options') as FormArray;
      optionsArray.clear();
      this.dynamicField.options.forEach(option => {
        optionsArray.push(this.fb.group({
          label: [option.label, Validators.required],
          value: [option.value, Validators.required],
          parentValue: [option.parentValue || '']
        }));
      });
    }

    this.dynamicFields.push(fieldGroup);
  }

  get dynamicFields(): FormArray {
    return this.dynamicFieldsForm.get('dynamicFields') as FormArray;
  }

  createDynamicFieldGroup(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z][a-zA-Z0-9_]*$/)]],
      type: ['', Validators.required],
      categoryId: ['', Validators.required],
      subCategoryId: [''],
      shouldFilterByParent: [false],
      options: this.fb.array([])
    });
  }

  addDynamicField(): void {
    const fieldGroup = this.createDynamicFieldGroup();
    
    // Set up listeners for this specific field
    this.setupFieldListeners(fieldGroup);
    
    this.dynamicFields.push(fieldGroup);
  }

  removeDynamicField(index: number): void {
    this.dynamicFields.removeAt(index);
  }

  setupFieldListeners(fieldGroup: FormGroup): void {
    // Listen for category changes to load subcategories
    fieldGroup.get('categoryId')?.valueChanges.subscribe(categoryId => {
      if (categoryId) {
        this.loadSubCategories(categoryId);
        fieldGroup.patchValue({ subCategoryId: '' });
      }
    });

    // Listen for type changes to show/hide options
    fieldGroup.get('type')?.valueChanges.subscribe(type => {
      if (this.requiresOptions(type)) {
        this.ensureOptionsArray(fieldGroup);
      }
    });
  }

  getOptionsArray(fieldIndex: number): FormArray {
    return this.dynamicFields.at(fieldIndex).get('options') as FormArray;
  }

  getFieldGroup(fieldIndex: number): FormGroup {
    return this.dynamicFields.at(fieldIndex) as FormGroup;
  }

  addOptionToFieldByIndex(fieldIndex: number): void {
    const fieldGroup = this.getFieldGroup(fieldIndex);
    this.addOptionToField(fieldGroup);
  }

  removeOptionFromFieldByIndex(fieldIndex: number, optionIndex: number): void {
    const fieldGroup = this.getFieldGroup(fieldIndex);
    this.removeOptionFromField(fieldGroup, optionIndex);
  }

  requiresOptions(type: string): boolean {
    return ['select', 'radio', 'checkbox'].includes(type);
  }

  isSelectType(type: string): boolean {
    return type === 'select';
  }

  ensureOptionsArray(fieldGroup: FormGroup): void {
    const optionsArray = fieldGroup.get('options') as FormArray;
    if (optionsArray.length === 0) {
      this.addOptionToField(fieldGroup);
    }
  }

  addOptionToField(fieldGroup: FormGroup): void {
    const optionsArray = fieldGroup.get('options') as FormArray;
    const optionGroup = this.fb.group({
      label: ['', Validators.required],
      value: ['', Validators.required],
      parentValue: ['']
    });
    optionsArray.push(optionGroup);
  }

  removeOptionFromField(fieldGroup: FormGroup, optionIndex: number): void {
    const optionsArray = fieldGroup.get('options') as FormArray;
    optionsArray.removeAt(optionIndex);
  }

  onSubmit(): void {
    if (this.dynamicFieldsForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const formValue = this.dynamicFieldsForm.value;
    const dynamicFields: CreateDynamicFieldRequest[] = formValue.dynamicFields.map((field: any) => {
      const options: FieldOptionRequest[] = this.requiresOptions(field.type) 
        ? field.options 
        : [];

      return {
        title: field.title,
        name: field.name,
        type: field.type,
        categoryId: field.categoryId,
        subCategoryId: field.subCategoryId || undefined,
        shouldFilterByParent: field.shouldFilterByParent || false,
        options: options
      };
    });

    if (this.isEditMode && this.dynamicField) {
      // Edit mode - update single field
      const updateRequest: UpdateDynamicFieldRequest = {
        id: this.dynamicField.id,
        ...dynamicFields[0]
      };

      this.dynamicFieldService.updateDynamicField(this.dynamicField.id, updateRequest).subscribe({
        next: () => {
          this.loading = false;
          this.formSubmit.emit();
        },
        error: (error) => {
          this.loading = false;
          this.error = 'Failed to update dynamic field. Please try again.';
          console.error('Error updating dynamic field:', error);
        }
      });
    } else {
      // Create mode - create multiple fields
      const createRequest = {
        dynamicFields: dynamicFields
      };

      this.dynamicFieldService.createDynamicFields(createRequest).subscribe({
        next: () => {
          this.loading = false;
          this.formSubmit.emit();
        },
        error: (error) => {
          this.loading = false;
          this.error = 'Failed to create dynamic fields. Please try again.';
          console.error('Error creating dynamic fields:', error);
        }
      });
    }
  }

  onCancel(): void {
    this.formCancel.emit();
  }

  markFormGroupTouched(): void {
    Object.keys(this.dynamicFieldsForm.controls).forEach(key => {
      const control = this.dynamicFieldsForm.get(key);
      control?.markAsTouched();
    });

    // Mark all dynamic fields as touched
    this.dynamicFields.controls.forEach((fieldGroup: any) => {
      Object.keys(fieldGroup.controls).forEach(key => {
        const control = fieldGroup.get(key);
        control?.markAsTouched();
      });
    });
  }

  getFieldTypeLabel(value: string): string {
    const type = this.fieldTypes.find(t => t.value === value);
    return type ? type.label : value;
  }

  isFieldInvalid(fieldIndex: number, fieldName: string): boolean {
    const field = this.dynamicFields.at(fieldIndex).get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  getFieldErrorMessage(fieldIndex: number, fieldName: string): string {
    const field = this.dynamicFields.at(fieldIndex).get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'This field is required.';
    if (field.errors['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength} characters.`;
    if (field.errors['maxlength']) return `Maximum length is ${field.errors['maxlength'].requiredLength} characters.`;
    if (field.errors['pattern']) return 'Invalid format. Use only letters, numbers, and underscores, starting with a letter.';

    return 'Invalid input.';
  }

  isOptionInvalid(fieldIndex: number, optionIndex: number, fieldName: string): boolean {
    const optionsArray = this.getOptionsArray(fieldIndex);
    const option = optionsArray.at(optionIndex).get(fieldName);
    return option ? option.invalid && option.touched : false;
  }

  getOptionErrorMessage(fieldIndex: number, optionIndex: number, fieldName: string): string {
    const optionsArray = this.getOptionsArray(fieldIndex);
    const option = optionsArray.at(optionIndex).get(fieldName);
    if (!option || !option.errors) return '';

    if (option.errors['required']) return 'This field is required.';
    return 'Invalid input.';
  }
}
