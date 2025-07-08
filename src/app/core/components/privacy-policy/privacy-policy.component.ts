import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-privacy-policy',
  standalone: false,
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.css'
})
export class PrivacyPolicyComponent {
  
  constructor(private router: Router) {}

  /**
   * معالجة النقر على زر الموافقة
   */
  onAgreeToTerms(): void {
    // يمكن إضافة منطق لحفظ موافقة المستخدم هنا
    console.log('تمت الموافقة على الشروط والأحكام');
    
    // إعادة التوجيه إلى الصفحة الرئيسية أو الصفحة السابقة
    this.router.navigate(['/']);
  }

  /**
   * الحصول على تاريخ آخر تحديث
   */
  getLastUpdateDate(): string {
    return new Date().toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
