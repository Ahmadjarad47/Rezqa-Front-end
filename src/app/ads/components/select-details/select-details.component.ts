import { Component, inject, OnInit } from '@angular/core';
import { AdsService } from '../../service/ads.service';
import { IDynamicField, Option } from '../../models/Ads';
import { Router } from '@angular/router';
import { Governorate, Neighborhood, SYRIAN_GOVERNORATES } from '@app/models/governorates-data';

interface SelectedValue {
  value: string;
  option?: Option;
  dynamicFieldId: number;
}

@Component({
  selector: 'app-select-details',
  standalone: false,
  templateUrl: './select-details.component.html',
  styleUrl: './select-details.component.css',
})
export class SelectDetailsComponent implements OnInit {
  DynamicFields: IDynamicField[] = [];
  selectedValues: { [key: number]: SelectedValue | SelectedValue[] } = {};
  router = inject(Router);

  // Make Math available in template
  Math = Math;

  // Loading states
  isLoading = false;
  isInitialLoading = true;
  loadingError: string | null = null;
  adsService = inject(AdsService);

  ExisitadDetails = {
    title: '',
    description: '',
    price: 0,
    location: '',
  };

  // Validation states
  validationErrors: { [key: string]: string } = {};
  isFormValid = false;

  // Field types configuration
  fieldTypes = [
    { value: 'text', label: 'Text Input', icon: '📝' },
    { value: 'number', label: 'Number Input', icon: '🔢' },
    { value: 'select', label: 'Select Dropdown', icon: '📋' },
    { value: 'radio', label: 'Radio Buttons', icon: '🔘' },
    { value: 'checkbox', label: 'Checkbox', icon: '☑️' },
    { value: 'textarea', label: 'Text Area', icon: '📄' },
  ];

  selectedGovernorate: Governorate | null = null;
  selectedNeighborhood: Neighborhood | null = null;
  governorates = SYRIAN_GOVERNORATES;
  neighborhoods: Neighborhood[] = [];

  ngOnInit(): void {
    this.loadDynamicFields();
    // Initialize ExisitadDetails
    this.ExisitadDetails = {
      title: '',
      description: '',
      price: 0,
      location: '',
    };
    this.selectedGovernorate = null;
    this.selectedNeighborhood = null;
    this.neighborhoods = [];
  }

  loadDynamicFields() {
    this.isInitialLoading = true;
    this.loadingError = null;

    // Get dynamic fields from the service (already fetched when sub-category was selected)
    this.DynamicFields = this.adsService.getDynamicFields();
    const categoryId = this.adsService.getCurrentAds()?.categoryId;
    const subcategoryId = this.adsService.getCurrentAds()?.subCategoryId;
    // If no dynamic fields are stored, fetch them as fallback
    if (categoryId || subcategoryId) {
      this.getAllDF();
    } else {
      this.router.navigateByUrl('/ads');
    }
  }

  getAllDF() {
    const CategoryId: number | undefined =
      this.adsService.getCurrentAds()?.categoryId ?? 0;
    const SubcategoryId = this.adsService.getCurrentAds()?.subCategoryId ?? 0;

    if (CategoryId != 0 || SubcategoryId != 0) {
      this.isLoading = true;
      this.loadingError = null;

      this.adsService.getDynamicField(CategoryId, SubcategoryId)?.subscribe({
        next: (res) => {
          this.DynamicFields = res;
          this.isLoading = false;
          this.isInitialLoading = false;
          console.log(res);

          // this.adsService.setDynamicFields(res);
        },
        error: (error) => {
          console.error('Error fetching dynamic fields:', error);
          this.loadingError = 'حدث خطأ أثناء تحميل الحقول الديناميكية';
          this.isLoading = false;
          this.isInitialLoading = false;
        },
      });
    } else {
      // this.router.navigateByUrl('/ads')
    }
  }

  retryLoading() {
    this.loadDynamicFields();
  }

  onFieldValueChange(fieldId: number, value: SelectedValue | SelectedValue[]) {
    this.selectedValues[fieldId] = value;
    // Update the ads observable immediately
    this.adsService.setDynamicFieldValues(this.selectedValues);
    let ads = this.adsService.getCurrentAds();
    if (ads) {
      ads.price = this.ExisitadDetails.price;
      ads.description = this.ExisitadDetails.description;
      ads.title = this.ExisitadDetails.title;
      ads.location = this.ExisitadDetails.location;
    }
    // Update form validation
    this.validateForm();
  }

  onTextInput(fieldId: number, event: Event) {
    const target = event.target as HTMLInputElement;
    this.onFieldValueChange(fieldId, {
      value: target.value,
      option: undefined,
      dynamicFieldId: fieldId,
    });
    // Clear validation error when user starts typing
    this.clearValidationError(`dynamic_${fieldId}`);
  }

  onTextareaInput(fieldId: number, event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.onFieldValueChange(fieldId, {
      value: target.value,
      option: undefined,
      dynamicFieldId: fieldId,
    });
    // Clear validation error when user starts typing
    this.clearValidationError(`dynamic_${fieldId}`);
  }

  onSelectChange(fieldId: number, event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedOption = this.DynamicFields.find(
      (f) => f.id === fieldId
    )?.options.find((o) => o.value === target.value);
    if (selectedOption) {
      this.onFieldValueChange(fieldId, {
        value: target.value,
        option: selectedOption,
        dynamicFieldId: fieldId,
      });
    }
  }

  onRadioChange(fieldId: number, value: string) {
    const selectedOption = this.DynamicFields.find(
      (f) => f.id === fieldId
    )?.options.find((o) => o.value === value);
    if (selectedOption) {
      this.onFieldValueChange(fieldId, {
        value: value,
        option: selectedOption,
        dynamicFieldId: fieldId,
      });
    }
  }

  onCheckboxChange(fieldId: number, value: string, checked: boolean) {
    const currentValues =
      (this.selectedValues[fieldId] as SelectedValue[]) || [];
    const selectedOption = this.DynamicFields.find(
      (f) => f.id === fieldId
    )?.options.find((o) => o.value === value);

    if (checked) {
      if (!currentValues.some((v) => v.value === value)) {
        currentValues.push({
          value: value,
          option: selectedOption,
          dynamicFieldId: fieldId,
        });
      }
    } else {
      const index = currentValues.findIndex((v) => v.value === value);
      if (index > -1) {
        currentValues.splice(index, 1);
      }
    }

    this.onFieldValueChange(fieldId, currentValues);
  }

  onCheckboxInput(fieldId: number, value: string, event: Event) {
    const target = event.target as HTMLInputElement;
    this.onCheckboxChange(fieldId, value, target.checked);
  }

  isCheckboxChecked(fieldId: number, value: string): boolean {
    const currentValues =
      (this.selectedValues[fieldId] as SelectedValue[]) || [];
    return currentValues.some((v) => v.value === value);
  }

  getSelectedValuesCount(): number {
    return Object.keys(this.selectedValues).length;
  }

  getFieldTypeIcon(fieldType: string): string {
    const fieldTypeConfig = this.fieldTypes.find(
      (type) => type.value === fieldType
    );
    return fieldTypeConfig?.icon || '📝';
  }

  shouldShowField(field: IDynamicField): boolean {
    // If field doesn't have parent filtering, always show it
    if (!field.shouldFilterbyParent) {
      return true;
    }

    // Find the parent field (assuming it's the previous field in the array)
    const parentField = this.DynamicFields.find((f) => f.id === field.id - 1);

    if (parentField) {
      // Only show this field if parent field has a selected value
      const parentValue = this.selectedValues[parentField.id];
      if (Array.isArray(parentValue)) {
        return parentValue.length > 0;
      }
      return parentValue && parentValue.value.trim() !== '';
    }

    return true;
  }

  getFilteredOptions(field: IDynamicField): any[] {
    if (!field.shouldFilterbyParent) {
      return field.options;
    }

    // Find the parent field (assuming it's the previous field in the array)
    const parentField = this.DynamicFields.find((f) => f.id === field.id - 1);

    if (parentField) {
      const parentValue = this.selectedValues[parentField.id];
      let parentValueStr: string | undefined;

      if (Array.isArray(parentValue)) {
        parentValueStr = parentValue[0]?.value;
      } else if (parentValue) {
        parentValueStr = parentValue.value;
      }

      // Filter options based on parent value
      return field.options.filter(
        (option) => !option.parentValue || option.parentValue === parentValueStr
      );
    }

    return field.options;
  }

  getFieldDisplayOrder(): IDynamicField[] {
    // Return fields in order, but only include child fields if parent is selected
    const orderedFields: IDynamicField[] = [];

    for (const field of this.DynamicFields) {
      if (this.shouldShowField(field)) {
        orderedFields.push(field);
      }
    }

    return orderedFields;
  }

  isChildField(field: IDynamicField): boolean {
    return field.shouldFilterbyParent;
  }

  getParentField(field: IDynamicField): IDynamicField | undefined {
    if (!field.shouldFilterbyParent) {
      return undefined;
    }

    // Find the parent field (assuming it's the previous field in the array)
    return this.DynamicFields.find((f) => f.id === field.id - 1);
  }

  getNextChildField(): IDynamicField | undefined {
    // Find the next child field that should appear
    for (const field of this.DynamicFields) {
      if (
        field.shouldFilterbyParent &&
        this.shouldShowField(field) &&
        !this.selectedValues[field.id]
      ) {
        return field;
      }
    }
    return undefined;
  }

  // New method to navigate to upload photo step
  continueToUploadPhoto(): void {
    // Validate all fields
    if (!this.validateForm()) {
      console.error('Form validation failed');
      return;
    }

    // Save the dynamic field values to the service
    this.adsService.setDynamicFieldValues(this.selectedValues);

    // Get current ad data and update it with form details
    const currentAd = this.adsService.getCurrentAds();
    if (currentAd) {
      currentAd.title = this.ExisitadDetails.title.trim();
      currentAd.description = this.ExisitadDetails.description.trim();
      currentAd.price = this.ExisitadDetails.price;
      currentAd.location = this.ExisitadDetails.location.trim();
      
      // Update the service with the complete ad data
      this.adsService.setCurrentAds(currentAd);
      
      console.log('Ad data saved to service:', currentAd);
    }

    // Navigate to upload photo step
    this.router.navigate(['/ads/upload-photo']);
  }

  // Check if all required fields are filled
  areAllFieldsFilled(): boolean {
    return this.validateForm();
  }

  // Get progress percentage for fields completion
  getFieldsProgressPercentage(): number {
    const displayFields = this.getFieldDisplayOrder();
    const totalFields = displayFields.length + 4; // +4 for static fields (title, description, price, location)
    
    if (totalFields === 0) return 100;

    let filledFields = 0;

    // Check static fields
    if (this.ExisitadDetails.title && this.ExisitadDetails.title.trim().length >= 3) filledFields++;
    if (this.ExisitadDetails.description && this.ExisitadDetails.description.trim().length >= 10) filledFields++;
    if (this.ExisitadDetails.price && this.ExisitadDetails.price > 0) filledFields++;
    if (this.ExisitadDetails.location && this.selectedGovernorate && this.selectedNeighborhood) filledFields++;

    // Check dynamic fields
    for (const field of displayFields) {
      const value = this.selectedValues[field.id];
      if (Array.isArray(value)) {
        if (value.length > 0) filledFields++;
      } else {
        if (value && value.value.trim() !== '') filledFields++;
      }
    }

    return Math.round((filledFields / totalFields) * 100);
  }

  formatPrice(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^\d.]/g, '');

  

    // Ensure the value is a valid number
    if (value === '' || value === '.') {
      this.ExisitadDetails.price = 0;
      input.value = '';
    } else {
      const numValue = parseFloat(value);
      this.ExisitadDetails.price = numValue;
      // Format the display with 2 decimal places
      input.value = numValue.toFixed(2);
    }
  }

  // Add this to handle the display when the field loses focus
  onBlur(event: Event) {
    const input = event.target as HTMLInputElement;
    if (this.ExisitadDetails.price) {
      input.value = this.ExisitadDetails.price.toFixed(2);
    }
  }

  onGovernorateChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedGovernorate = this.governorates.find(g => g.name === value) || null;
    this.neighborhoods = this.selectedGovernorate ? this.selectedGovernorate.neighborhoods : [];
    this.selectedNeighborhood = null;
    this.updateLocation();
    this.validateForm();
  }

  onNeighborhoodChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedNeighborhood = this.neighborhoods.find(n => n.name === value) || null;
    this.updateLocation();
    this.validateForm();
  }

  updateLocation() {
    if (this.selectedGovernorate && this.selectedNeighborhood) {
      this.ExisitadDetails.location = `${this.selectedGovernorate.name} - ${this.selectedNeighborhood.name}`;
    } else if (this.selectedGovernorate) {
      this.ExisitadDetails.location = this.selectedGovernorate.name;
    } else {
      this.ExisitadDetails.location = '';
    }
  }

  // Validation methods
  validateStaticFields(): boolean {
    this.validationErrors = {};
    let isValid = true;

    // Validate title
    if (!this.ExisitadDetails.title || this.ExisitadDetails.title.trim().length < 3) {
      this.validationErrors['title'] = 'يجب أن يكون العنوان 3 أحرف على الأقل';
      isValid = false;
    } else if (this.ExisitadDetails.title.trim().length > 100) {
      this.validationErrors['title'] = 'يجب أن لا يتجاوز العنوان 100 حرف';
      isValid = false;
    }

    // Validate description
    if (!this.ExisitadDetails.description || this.ExisitadDetails.description.trim().length < 10) {
      this.validationErrors['description'] = 'يجب أن يكون الوصف 10 أحرف على الأقل';
      isValid = false;
    } else if (this.ExisitadDetails.description.trim().length > 1000) {
      this.validationErrors['description'] = 'يجب أن لا يتجاوز الوصف 1000 حرف';
      isValid = false;
    }

    // Validate price
    if (!this.ExisitadDetails.price || this.ExisitadDetails.price <= 0) {
      this.validationErrors['price'] = 'يجب إدخال سعر صحيح أكبر من صفر';
      isValid = false;
    }

    // Validate location
    if (!this.ExisitadDetails.location || !this.selectedGovernorate || !this.selectedNeighborhood) {
      this.validationErrors['location'] = 'يجب اختيار المحافظة والحي';
      isValid = false;
    }

    return isValid;
  }

  validateDynamicFields(): boolean {
    let isValid = true;
    // Validate all visible dynamic fields
    const visibleFields = this.getFieldDisplayOrder();

    for (const field of visibleFields) {
      const fieldValue = this.selectedValues[field.id];
      
      // For now, consider all visible fields as required
      if (!fieldValue) {
        this.validationErrors[`dynamic_${field.id}`] = `حقل ${field.title} مطلوب`;
        isValid = false;
        continue;
      }

      // Check if it's an array (checkbox) or single value
      if (Array.isArray(fieldValue)) {
        if (fieldValue.length === 0) {
          this.validationErrors[`dynamic_${field.id}`] = `حقل ${field.title} مطلوب`;
          isValid = false;
        }
      } else {
        if (!fieldValue.value || fieldValue.value.trim() === '') {
          this.validationErrors[`dynamic_${field.id}`] = `حقل ${field.title} مطلوب`;
          isValid = false;
        }
      }

      // Additional validation for text fields
      if (field.type === 'text' && !Array.isArray(fieldValue) && fieldValue.value) {
        if (fieldValue.value.trim().length < 2) {
          this.validationErrors[`dynamic_${field.id}`] = `حقل ${field.title} يجب أن يكون حرفين على الأقل`;
          isValid = false;
        } else if (fieldValue.value.trim().length > 200) {
          this.validationErrors[`dynamic_${field.id}`] = `حقل ${field.title} يجب أن لا يتجاوز 200 حرف`;
          isValid = false;
        }
      }

      // Additional validation for textarea fields
      if (field.type === 'textarea' && !Array.isArray(fieldValue) && fieldValue.value) {
        if (fieldValue.value.trim().length < 5) {
          this.validationErrors[`dynamic_${field.id}`] = `حقل ${field.title} يجب أن يكون 5 أحرف على الأقل`;
          isValid = false;
        } else if (fieldValue.value.trim().length > 500) {
          this.validationErrors[`dynamic_${field.id}`] = `حقل ${field.title} يجب أن لا يتجاوز 500 حرف`;
          isValid = false;
        }
      }

      // Additional validation for number fields
      if (field.type === 'number' && !Array.isArray(fieldValue) && fieldValue.value) {
        const numValue = parseFloat(fieldValue.value);
        if (isNaN(numValue) || numValue < 0) {
          this.validationErrors[`dynamic_${field.id}`] = `حقل ${field.title} يجب أن يكون رقماً صحيحاً`;
          isValid = false;
        }
      }
    }

    return isValid;
  }

  validateForm(): boolean {
    const staticValid = this.validateStaticFields();
    const dynamicValid = this.validateDynamicFields();
    this.isFormValid = staticValid && dynamicValid;
    return this.isFormValid;
  }

  clearValidationError(fieldName: string): void {
    if (this.validationErrors[fieldName]) {
      delete this.validationErrors[fieldName];
    }
  }

  getFieldValidationClass(fieldName: string): string {
    return this.validationErrors[fieldName] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';
  }

  getDynamicFieldValidationClass(fieldId: number): string {
    return this.validationErrors[`dynamic_${fieldId}`] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';
  }
}
