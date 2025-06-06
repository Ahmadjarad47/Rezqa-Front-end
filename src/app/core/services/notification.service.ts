import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private toastr: ToastrService) {}

  success(message: string, title: string = 'نجاح'): void {
    this.toastr.success(message, title);
  }

  error(message: string, title: string = 'خطأ'): void {
    this.toastr.error(message, title);
  }

  warning(message: string, title: string = 'تنبيه'): void {
    this.toastr.warning(message, title);
  }

  info(message: string, title: string = 'معلومات'): void {
    this.toastr.info(message, title);
  }

} 