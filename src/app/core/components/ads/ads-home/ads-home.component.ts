import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HomeAdsService } from '../home-ads.service';
import {
  AdCategory,
  AdPosts,
  Pagnation,
  SubCategory,
} from '../models/category';
import { AdFilter } from '../models/ad-filter.model';
import {
  SYRIAN_GOVERNORATES,
  Governorate,
  Neighborhood,
} from '../../../../models/governorates-data';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  of,
  Subscription,
} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  tap,
  filter as rxFilter,
  map,
} from 'rxjs/operators';
import { HomeService } from '@app/core/services/home.service';
import { WishlistService } from '@app/dashboard/components/wishlist/wishlist.service';

@Component({
  selector: 'app-ads-home',
  standalone: false,
  templateUrl: './ads-home.component.html',
  styleUrl: './ads-home.component.css',
})
export class AdsHomeComponent implements OnInit, OnDestroy {
  // --- State Subjects ---
  private filter$ = new BehaviorSubject<AdFilter>({});
  private pageNumber$ = new BehaviorSubject<number>(1);
  private pageSize$ = new BehaviorSubject<number>(10);
  private categoryList$ = new BehaviorSubject<AdCategory[]>([]);
  private subcategoryList$ = new BehaviorSubject<SubCategory[]>([]);
  public wishlistService=inject(WishlistService)
  // --- Data ---
  posts: AdPosts[] = [];
  paginationInfo?: Pagnation;
  categories: AdCategory[] = [];
  subcategories: SubCategory[] = [];
  cityList: Governorate[] = SYRIAN_GOVERNORATES;
  neighborhoodList: Neighborhood[] = [];
  selectedCity?: string;
  selectedNeighborhood?: string;

  // --- UI State ---
  hoveredIndex: number | null = null;
  currentImageIndexes: { [key: number]: number } = {};
  mainImageFade: { [key: number]: boolean } = {};
  isCategoriesExpanded = true;
  isLocationExpanded = true;
  isPriceExpanded = true;
  isSubcategoriesExpanded = false;
  showMoreCategories = false;
  priceError: string | null = null;

  // --- Loading/Error State ---
  isLoadingCategories = false;
  isLoadingPosts = false;
  errorMsg: string | null = null;

  // --- RxJS Subscription ---
  private subs = new Subscription();

  // --- Angular Services ---
  adService = inject(HomeAdsService);
  router = inject(Router);
  homeService = inject(HomeService);
  route = inject(ActivatedRoute);

  @ViewChild('listingsSection') listingsSectionRef?: ElementRef;

  ngOnInit(): void {
    // Load categories once
    this.loadCategories();
    // React to route changes for category param
    this.handleRouteParams();
    // Reactively load posts when filter/page changes
    debugger
    this.filter$.next({ categoryId: this.homeService.getCategory()?.id });
    this.setupReactivePostsLoading();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // --- Category Loading ---
  private loadCategories() {
    this.isLoadingCategories = true;
    this.adService
      .getCategory()
      .pipe(
        tap(() => (this.isLoadingCategories = true)),
        catchError((error) => {
          this.errorMsg = 'Error loading categories';
          this.isLoadingCategories = false;
          this.categories = [];
          return of([]);
        })
      )
      .subscribe((categories: AdCategory[]) => {
        this.categories = categories;
        this.categoryList$.next(categories);
        this.isLoadingCategories = false;
      });
  }

  // --- Route Param Handling ---
  private handleRouteParams() {
    // Listen to route params and categories
    const sub = combineLatest([
      this.route.params,
      this.categoryList$,
    ]).subscribe(([params, categories]) => {
      const categoryParam = params['category'];
      if (categoryParam && categories.length > 0) {
        const category = categories.find((cat) => cat.title === categoryParam);
        if (category) {
          this.updateFilter({
            categoryId: category.id,
            subCategoryId: undefined,
          });
          this.loadSubcategories(category.id);
        }
      }
    });
    this.subs.add(sub);
  }

  // --- Reactive Posts Loading ---
  private setupReactivePostsLoading() {
    // Combine filter, page, and size, debounce filter changes

    const sub = combineLatest([
      this.filter$.pipe(
        debounceTime(200),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
      ),
      this.pageNumber$,
      this.pageSize$,
    ])
      .pipe(
        tap(() => {
          this.isLoadingPosts = true;
          this.errorMsg = null;
        }),
        switchMap(([filter, page, size]) =>
          this.adService.getSearch(page, size, filter).pipe(
            catchError((error) => {
              // this.errorMsg = 'Error loading posts';
              this.isLoadingPosts = false;
              return of({
                items: [],
                totalPages: 0,
                totalCount: 0,
                pageNumber: 1,
                pageSize: size,
              });
            })
          )
        )
      )
      .subscribe((value: any) => {
        this.posts = value.items;
        this.paginationInfo = value;
        this.isLoadingPosts = false;
      });
    this.subs.add(sub);
  }

  // --- Filter/State Updaters ---
  private updateFilter(partial: Partial<AdFilter>) {
    const newFilter = { ...this.filter$.value, ...partial };
    this.filter$.next(newFilter);
  }

  private resetPage() {
    this.pageNumber$.next(1);
  }

  // --- Public Methods for Template ---
  applyFilters() {
    if (this.validatePriceRange()) {
      this.resetPage();
      this.filter$.next({ ...this.filter$.value }); // Triggers reload
    }
  }

  selectCategory(category: AdCategory) {
    debugger;
    this.updateFilter({ categoryId: category.id, subCategoryId: undefined });
    this.subcategories = [];
    this.isSubcategoriesExpanded = false;
    this.resetPage();
    this.loadSubcategories(category.id);
    this.router.navigate(['/all', category.title]);
  }

  loadSubcategories(categoryId: number) {
    this.adService
      .getSubCategory(categoryId)
      .pipe(
        catchError((error) => {
          this.errorMsg = 'Error loading subcategories';
          this.subcategories = [];
          return of([]);
        })
      )
      .subscribe((subcategories: SubCategory[]) => {
        this.subcategories = subcategories;
        this.subcategoryList$.next(subcategories);
        if (subcategories.length > 0) {
          this.isSubcategoriesExpanded = true;
        }
      });
  }

  selectSubcategory(subcategory: SubCategory) {
    this.updateFilter({ subCategoryId: subcategory.id });
    this.resetPage();
  }

  clearSubcategoryFilter() {
    this.updateFilter({ subCategoryId: undefined });
    this.resetPage();
  }

  clearCategoryFilter() {
    this.updateFilter({ categoryId: undefined, subCategoryId: undefined });
    this.subcategories = [];
    this.isSubcategoriesExpanded = false;
    this.resetPage();
    this.router.navigate(['/all']);
  }

  clearLocationFilter() {
    this.selectedCity = undefined;
    this.selectedNeighborhood = undefined;
    this.neighborhoodList = [];
    this.updateFilter({ location: undefined });
    this.resetPage();
  }

  clearPriceFilter() {
    this.updateFilter({ minPrice: undefined, maxPrice: undefined });
    this.priceError = null;
    this.resetPage();
  }

  onPriceInputChange() {
    this.validatePriceRange();
  }

  validatePriceRange(): boolean {
    const minPrice = this.filterGetter.minPrice;
    const maxPrice = this.filterGetter.maxPrice;

    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      this.priceError = 'الحد الأدنى للسعر لا يمكن أن يكون أكبر من الحد الأعلى';
      return false;
    }

    this.priceError = null;
    return true;
  }

  onPageChanged(page: number) {
    if (
      this.paginationInfo &&
      page > 0 &&
      page <= this.paginationInfo.totalPages
    ) {
      this.pageNumber$.next(page);
      // Scroll to top of listings section
      setTimeout(() => {
        if (this.listingsSectionRef && this.listingsSectionRef.nativeElement) {
          this.listingsSectionRef.nativeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 0);
    }
  }

  get totalPages(): number[] {
    let pages = [];
    if (this.paginationInfo) {
      for (let i = 1; i <= this.paginationInfo.totalPages; i++) {
        pages.push(i);
      }
    }
    return pages;
  }

  setHovered(index: number) {
    this.hoveredIndex = index;
    if (this.currentImageIndexes[index] === undefined) {
      this.currentImageIndexes[index] = 0;
    }
  }

  clearHovered() {
    this.hoveredIndex = null;
  }

  setCurrentImage(index: number, imgIdx: number) {
    if (this.currentImageIndexes[index] !== imgIdx) {
      this.mainImageFade[index] = true;
      setTimeout(() => {
        this.currentImageIndexes[index] = imgIdx;
        this.mainImageFade[index] = false;
      }, 200);
    }
  }

  getCurrentImage(item: AdPosts, index: number): string {
    const imgIdx = this.currentImageIndexes[index] ?? 0;
    return item.imageUrl[imgIdx] || item.imageUrl[0];
  }

  onCityChange(event: Event) {
    const cityName = (event.target as HTMLSelectElement).value;
    this.selectedCity = cityName;
    const found = this.cityList.find((c) => c.name === cityName);
    this.neighborhoodList = found ? found.neighborhoods : [];
    this.selectedNeighborhood = undefined;
    this.updateFilter({ location: cityName });
    this.resetPage();
  }

  onNeighborhoodChange(event: Event) {
    const neighborhood = (event.target as HTMLSelectElement).value;
    this.selectedNeighborhood = neighborhood;
    if (this.selectedCity && neighborhood) {
      this.updateFilter({ location: `${this.selectedCity} - ${neighborhood}` });
    } else if (this.selectedCity) {
      this.updateFilter({ location: this.selectedCity });
    } else {
      this.updateFilter({ location: undefined });
    }
    this.resetPage();
  }

  updateLocation() {
    if (this.selectedCity && this.selectedNeighborhood) {
      this.updateFilter({
        location: `${this.selectedCity} - ${this.selectedNeighborhood}`,
      });
    } else if (this.selectedCity) {
      this.updateFilter({ location: this.selectedCity });
    } else {
      this.updateFilter({ location: undefined });
    }
    this.resetPage();
  }

  // Collapsible toggle methods
  toggleCategories() {
    this.isCategoriesExpanded = !this.isCategoriesExpanded;
  }

  toggleLocation() {
    this.isLocationExpanded = !this.isLocationExpanded;
  }

  togglePrice() {
    this.isPriceExpanded = !this.isPriceExpanded;
  }

  toggleSubcategories() {
    this.isSubcategoriesExpanded = !this.isSubcategoriesExpanded;
  }

  toggleMoreCategories() {
    this.showMoreCategories = !this.showMoreCategories;
  }

  // --- Utility for *ngFor trackBy ---
  trackByAdId(index: number, item: AdPosts) {
    return item.id;
  }

  // --- Public getter for template access to filter fields ---
  get filterGetter() {
    return this.filter$.value;
  }
}
