import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '@environments/environment.development';
import { AdCategory, AdPosts, Pagnation, SubCategory } from './models/category';
import { AdFilter } from './models/ad-filter.model';
import { EMPTY } from 'rxjs';
import { AdDto } from '@app/models/ad.dto';

@Injectable({
  providedIn: 'root',
})
export class HomeAdsService {
  private url = environment.apiUrl + 'AdHome/';

  constructor(
    private httpClient: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  getCategory() {
    if (isPlatformBrowser(this.platformId)) {
      return this.httpClient.get<AdCategory[]>(this.url + 'category');
    }
    return EMPTY;
  }

  getSubCategory(categoryId: number) {
    if (isPlatformBrowser(this.platformId)) {
      return this.httpClient.get<SubCategory[]>(
        this.url + 'SubCategory?categoryId=' + categoryId
      );
    }
    return EMPTY;
  }

  getPosts(pageNumber: number, pageSize: number) {
    if (isPlatformBrowser(this.platformId)) {
      let params = new HttpParams();
      params = params.append('PageNumber', pageNumber.toString());
      params = params.append('PageSize', pageSize.toString());

      return this.httpClient.get<Pagnation>(this.url + 'ads', { params });
    }
    return EMPTY;
  }
  getPostsId(id: number) {
    if (isPlatformBrowser(this.platformId)) {
      return this.httpClient.get<AdPosts>(this.url + 'ads-id?id=' + id);
    }
    return EMPTY;
  }

  getSearch(pageNumber: number, pageSize: number, filter?: AdFilter) {
    if (isPlatformBrowser(this.platformId)) {
      let params = new HttpParams();
      params = params.append('PageNumber', pageNumber.toString());
      params = params.append('PageSize', pageSize.toString());
      if (filter) {
        if (filter.searchTerm) {
          params = params.append('searchTerm', filter.searchTerm);
        }

        if (filter.categoryId) {
          params = params.append('CategoryId', filter.categoryId.toString());
        }
        if (filter.subCategoryId) {
          params = params.append(
            'SubCategoryId',
            filter.subCategoryId.toString()
          );
        }
        if (filter.minPrice) {
          params = params.append('minPrice', filter.minPrice.toString());
        }
        if (filter.maxPrice) {
          params = params.append('maxPrice', filter.maxPrice.toString());
        }
        if (filter.location) {
          params = params.append('location', filter.location);
        }
      }
      return this.httpClient.get<Pagnation>(this.url + 'search', { params });
    }
    return EMPTY;
  }
}
