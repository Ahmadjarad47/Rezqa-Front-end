import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';
import { IPage, PaginatedRequest } from '../models/Category';
import { BehaviorSubject } from 'rxjs';
import {
  AdFieldValue,
  CreateAdDto,
  IDynamicField,
  Option,
  SelectedValue,
} from '../models/Ads';
import { ISubCategoryPage } from '../models/subCategory';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class AdsService {
  private adsSource = new BehaviorSubject<CreateAdDto | null>(null);
  private ads$ = this.adsSource.asObservable();

  private url = environment.apiUrl;

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
  submitAd(ad: CreateAdDto) {
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

    return this.http.post(this.url + 'Ad/create-ad', formData);
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
}
