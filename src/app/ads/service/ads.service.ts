import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';
import { IPage, PaginatedRequest } from '../models/Category';
import { BehaviorSubject } from 'rxjs';
import {
  AdFieldValue,
  CreateAdDto,
  CreateSpecificAdDto,
  IDynamicField,
  Option,
  SelectedValue,
} from '../models/Ads';
import { ISubCategoryPage } from '../models/subCategory';
import { isPlatformBrowser } from '@angular/common';
import { timeout, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdsService {
  private adsSource = new BehaviorSubject<CreateAdDto | null>(null);
  private ads$ = this.adsSource.asObservable();

  private url = environment.apiUrl;
  
  // إعدادات timeout للرفع
  private readonly UPLOAD_TIMEOUT = 5 * 60 * 1000; // 5 دقائق للرفع
  private readonly API_TIMEOUT = 30 * 1000; // 30 ثانية للطلبات العادية

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  getCategoey(request: PaginatedRequest) {
    if (isPlatformBrowser(this.platformId)) {
      let params = new HttpParams()
        .set('PageNumber', request.pageNumber.toString())
        .set('PageSize', request.pageSize.toString());

      if (request.search) {
        params = params.set('SearchTerm', request.search);
      }

      return this.http.get<IPage>(this.url + 'GetAdLists/get-categories', {
        params: params,
      });
    }
    return null;
  }

  getSubCategoey(request: PaginatedRequest, categoryId: number) {
    if (isPlatformBrowser(this.platformId)) {
      let params = new HttpParams()
        .set('PageNumber', request.pageNumber.toString())
        .set('PageSize', request.pageSize.toString());

      if (request.search) {
        params = params.set('SearchTerm', request.search);
      }

      params = params.set('CategoryId', categoryId);

      return this.http.get<ISubCategoryPage>(
        this.url + 'GetAdLists/get-subcategories',
        {
          params: params,
        }
      );
    }
    return null;
  }

  getDynamicField(categoryId: number, subCategoryId: number) {
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get<IDynamicField[]>(
        this.url +
          `GetAdLists/get-dynamic-field?CategoryId=${categoryId}&SubCategoryId=${subCategoryId}`
      );
    }
    return null;
  }
  submitAd(ad: CreateAdDto): Observable<any> {
    let formData = new FormData();
    formData.append('Title', ad.title);
    formData.append('Description', ad.description);
    formData.append('Location', ad.location);
    formData.append('Price', ad.price.toString());
    formData.append('CategoryId', ad.categoryId.toString());
    formData.append('SubCategoryId', ad.subCategoryId.toString());

    // Convert DynamicFieldValues to fieldValues
    if (ad.DynamicFieldValues) {
      console.log(
        'DynamicFieldValues before conversion:',
        ad.DynamicFieldValues
      );
      const fieldValues: AdFieldValue[] = Object.entries(
        ad.DynamicFieldValues
      ).map(([fieldId, value]) => {
        const fieldValue: AdFieldValue = {
          dynamicFieldId: parseInt(fieldId),
          value: Array.isArray(value)
            ? value.map((v) => v.value).join(',')
            : value.value,
        };
        return fieldValue;
      });

      // Send each field value as a separate form field
      fieldValues.forEach((field, index) => {
        formData.append(
          `fieldValues[${index}].dynamicFieldId`,
          field.dynamicFieldId.toString()
        );
        formData.append(`fieldValues[${index}].value`, field.value || '');
      });
    } else {
      console.log('No DynamicFieldValues found, sending empty array');
      // Send an empty field value to ensure the array is initialized
      formData.append('fieldValues[0].dynamicFieldId', '0');
      formData.append('fieldValues[0].value', '');
    }

    if (ad.imageUrl) {
      // Handle multiple files
      for (let i = 0; i < ad.imageUrl.length; i++) {
        formData.append('ImageUrl', ad.imageUrl[i]);
      }
    }

    // Log the final FormData contents
    console.log('FormData contents:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    // حساب حجم الملفات لتحديد timeout مناسب
    let totalFileSize = 0;
    if (ad.imageUrl) {
      for (let i = 0; i < ad.imageUrl.length; i++) {
        if (ad.imageUrl[i] instanceof File) {
          totalFileSize += (ad.imageUrl[i] as File).size;
        }
      }
    }

    // تحديد timeout بناءً على حجم الملفات
    const uploadTimeout = this.calculateUploadTimeout(totalFileSize);
    console.log(`Total file size: ${this.formatFileSize(totalFileSize)}, Timeout: ${uploadTimeout / 1000}s`);

    return this.http.post(this.url + 'Ad/create-ad', formData).pipe(
      timeout(uploadTimeout),
      catchError((error) => {
        console.error('Upload error:', error);
        
        // معالجة أخطاء CORS
        if (error.status === 0 || error.statusText === 'Unknown Error') {
          return throwError(() => ({
            status: 0,
            message: 'مشكلة في الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى',
            isCorsError: true
          }));
        }
        
        if (error.name === 'TimeoutError') {
          return throwError(() => ({
            status: 408,
            message: 'انتهت مهلة رفع الملفات. يرجى تقليل حجم الصور أو المحاولة مرة أخرى',
            isTimeout: true
          }));
        }
        
        if (error.status === 413) {
          return throwError(() => ({
            status: 413,
            message: 'حجم الملفات كبير جداً. يرجى تقليل حجم الصور',
            isFileSizeError: true
          }));
        }
        
        // معالجة أخطاء أخرى
        if (error.status >= 500) {
          return throwError(() => ({
            status: error.status,
            message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً',
            isServerError: true
          }));
        }
        
        return throwError(() => error);
      })
    );
  }

  // حساب timeout مناسب بناءً على حجم الملفات
  private calculateUploadTimeout(totalFileSize: number): number {
    const baseTimeout = this.UPLOAD_TIMEOUT; // 5 دقائق أساسية
    const sizePerSecond = 100 * 1024; // 100KB في الثانية (سرعة اتصال بطيئة)
    const estimatedTime = (totalFileSize / sizePerSecond) * 1000; // بالمللي ثانية
    
    // إضافة 30 ثانية إضافية كهامش أمان
    const safeTimeout = Math.max(baseTimeout, estimatedTime + 30000);
    
    // الحد الأقصى 15 دقيقة
    return Math.min(safeTimeout, 15 * 60 * 1000);
  }

  // تنسيق حجم الملف
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getCurrentAds() {
    return this.adsSource.value;
  }

  setCurrentAds(ad: CreateAdDto) {
    return this.adsSource.next(ad);
  }

  getDynamicFields() {
    return this.adsSource.value?.DynamicFields || [];
  }

  setDynamicFields(dynamicFields: IDynamicField[]) {
    const currentAd = this.adsSource.value;
    if (currentAd) {
      currentAd.DynamicFields = dynamicFields;
      this.adsSource.next(currentAd);
    }
  }

  setDynamicFieldValues(dynamicFieldValues: {
    [key: number]: SelectedValue | SelectedValue[];
  }) {
    const currentAd = this.adsSource.value;
    if (currentAd) {
      currentAd.DynamicFieldValues = dynamicFieldValues;
      this.adsSource.next(currentAd);
    }
  }

  getDynamicFieldValues() {
    return this.adsSource.value?.DynamicFieldValues || {};
  }

  updateDynamicFields(categoryId: number, subCategoryId: number) {
    if (isPlatformBrowser(this.platformId)) {
      return this.http
        .get<IDynamicField[]>(
          this.url +
            `GetAdLists/get-dynamic-field?CategoryId=${categoryId}&SubCategoryId=${subCategoryId}`
        )
        .subscribe({
          next: (dynamicFields) => {
            this.setDynamicFields(dynamicFields);
          },
          error: (error) => {
            console.error('Error fetching dynamic fields:', error);
          },
        });
    }
    return null;
  }

  // Create specific ad with payment
  createSpecificAd(ad: CreateSpecificAdDto): Observable<any> {
    let formData = new FormData();
    formData.append('Title', ad.title);
    formData.append('Description', ad.description);
    formData.append('Location', ad.location);
    formData.append('Price', ad.price.toString());
    formData.append('CategoryId', ad.categoryId.toString());
    formData.append('SubCategoryId', ad.subCategoryId.toString());
    formData.append('IsSpecific', ad.isSpecific.toString());
    formData.append('ActiveMonths', ad.activeMonths.toString());

    // Convert DynamicFieldValues to fieldValues
    if (ad.DynamicFieldValues) {
      console.log(
        'DynamicFieldValues before conversion:',
        ad.DynamicFieldValues
      );
      const fieldValues: AdFieldValue[] = Object.entries(
        ad.DynamicFieldValues
      ).map(([fieldId, value]) => {
        const fieldValue: AdFieldValue = {
          dynamicFieldId: parseInt(fieldId),
          value: Array.isArray(value)
            ? value.map((v) => v.value).join(',')
            : value.value,
        };
        return fieldValue;
      });

      // Send each field value as a separate form field
      fieldValues.forEach((field, index) => {
        formData.append(
          `fieldValues[${index}].dynamicFieldId`,
          field.dynamicFieldId.toString()
        );
        formData.append(`fieldValues[${index}].value`, field.value || '');
      });
    } else {
      console.log('No DynamicFieldValues found, sending empty array');
      // Send an empty field value to ensure the array is initialized
      formData.append('fieldValues[0].dynamicFieldId', '0');
      formData.append('fieldValues[0].value', '');
    }

    if (ad.imageUrl) {
      // Handle multiple files
      for (let i = 0; i < ad.imageUrl.length; i++) {
        formData.append('ImageUrl', ad.imageUrl[i]);
      }
    }

    // Log the final FormData contents
    console.log('FormData contents for specific ad:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    // حساب حجم الملفات لتحديد timeout مناسب
    let totalFileSize = 0;
    if (ad.imageUrl) {
      for (let i = 0; i < ad.imageUrl.length; i++) {
        if (ad.imageUrl[i] instanceof File) {
          totalFileSize += (ad.imageUrl[i] as File).size;
        }
      }
    }

    // تحديد timeout بناءً على حجم الملفات
    const uploadTimeout = this.calculateUploadTimeout(totalFileSize);
    console.log(`Total file size: ${this.formatFileSize(totalFileSize)}, Timeout: ${uploadTimeout / 1000}s`);

    return this.http.post(this.url + 'Ad/create-specific-ad', formData).pipe(
      timeout(uploadTimeout),
      catchError((error) => {
        console.error('Specific ad upload error:', error);
        
        // معالجة أخطاء CORS
        if (error.status === 0 || error.statusText === 'Unknown Error') {
          return throwError(() => ({
            status: 0,
            message: 'مشكلة في الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى',
            isCorsError: true
          }));
        }
        
        if (error.name === 'TimeoutError') {
          return throwError(() => ({
            status: 408,
            message: 'انتهت مهلة رفع الملفات. يرجى تقليل حجم الصور أو المحاولة مرة أخرى',
            isTimeout: true
          }));
        }
        
        if (error.status === 413) {
          return throwError(() => ({
            status: 413,
            message: 'حجم الملفات كبير جداً. يرجى تقليل حجم الصور',
            isFileSizeError: true
          }));
        }
        
        // معالجة أخطاء أخرى
        if (error.status >= 500) {
          return throwError(() => ({
            status: error.status,
            message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً',
            isServerError: true
          }));
        }
        
        return throwError(() => error);
      })
    );
  }
}
