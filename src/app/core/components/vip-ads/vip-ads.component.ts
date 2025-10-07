import { Component } from '@angular/core';
export interface VipAds {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string[];
  phonNumber: string;
  adsInfo: { [key: string]: string };
}
@Component({
  selector: 'app-vip-ads',
  standalone: false,
  templateUrl: './vip-ads.component.html',
  styleUrls: ['./vip-ads.component.css'],
})
export class VipAdsComponent {
  // Mock data; replace with data from API/service
  vipAds: VipAds[] = [
    {
      id: 1,
      title: 'iPhone 15 Pro Max 256GB',
      description: 'Mint condition, original accessories, warranty remaining.',
      price: 1250,
      image: ['/eUfb6M.png'],
      phonNumber: '+963-999-111-222',
      adsInfo: { brand: 'Apple', condition: 'Like New', city: 'Damascus' },
    },
    {
      id: 2,
      title: 'Gaming PC RTX 4070',
      description: 'High FPS, silent build, with invoice.',
      price: 1800,
      image: ['/eUfb6M.png'],
      phonNumber: '+963-888-222-333',
      adsInfo: { brand: 'Custom', condition: 'New', city: 'Aleppo' },
    },
    {
      id: 3,
      title: 'Toyota Corolla 2016',
      description: 'Single owner, full service history.',
      price: 10500,
      image: ['/eUfb6M.png'],
      phonNumber: '+963-777-333-444',
      adsInfo: { brand: 'Toyota', condition: 'Used', city: 'Homs' },
    },
  ];

  // Filters & sorting state
  query: string = '';
  city: string = '';
  condition: string = '';
  minPrice?: number;
  maxPrice?: number;
  sort: 'relevance' | 'priceAsc' | 'priceDesc' | 'titleAsc' | 'titleDesc' =
    'relevance';
  page: number = 1;
  pageSize: number = 12;

  get cities(): string[] {
    const vals = new Set<string>();
    this.vipAds.forEach((a) => {
      if (a.adsInfo && a.adsInfo['city']) {
        vals.add(a.adsInfo['city']);
      }
    });
    return Array.from(vals);
  }

  get conditions(): string[] {
    const vals = new Set<string>();
    this.vipAds.forEach((a) => {
      if (a.adsInfo && a.adsInfo['condition']) {
        vals.add(a.adsInfo['condition']);
      }
    });
    return Array.from(vals);
  }

  get filtered(): VipAds[] {
    let list = this.vipAds.slice();
    if (this.query) {
      const q = this.query.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          Object.values(a.adsInfo || {}).some((v) =>
            String(v).toLowerCase().includes(q)
          )
      );
    }
    if (this.city)
      list = list.filter(
        (a) => ((a.adsInfo && a.adsInfo['city']) || '') === this.city
      );
    if (this.condition)
      list = list.filter(
        (a) => ((a.adsInfo && a.adsInfo['condition']) || '') === this.condition
      );
    if (this.minPrice != null && this.minPrice !== undefined)
      list = list.filter((a) => a.price >= Number(this.minPrice));
    if (this.maxPrice != null && this.maxPrice !== undefined)
      list = list.filter((a) => a.price <= Number(this.maxPrice));

    switch (this.sort) {
      case 'priceAsc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'titleAsc':
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'titleDesc':
        list.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }
    return list;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get paged(): VipAds[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  setPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Dialog state
  showDialog: boolean = false;
  selectedAd: VipAds | null = null;

  openDetailsDialog(ad: VipAds) {
    this.selectedAd = ad;
    this.showDialog = true;
    // Prevent body scroll when dialog is open
    document.body.style.overflow = 'hidden';
  }

  closeDialog() {
    this.showDialog = false;
    this.selectedAd = null;
    // Restore body scroll
    document.body.style.overflow = 'auto';
  }

  resetFilters() {
    this.query = '';
    this.city = '';
    this.condition = '';
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.sort = 'relevance';
    this.page = 1;
  }
}
