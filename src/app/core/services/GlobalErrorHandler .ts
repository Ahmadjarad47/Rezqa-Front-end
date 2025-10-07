import { ErrorHandler, Injectable } from '@angular/core';
import { environment } from '@environments/environment.development';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    // في وضع الإنتاج، لا نعرض الأخطاء في console
    if (!environment.production && environment.enableErrorLogs) {
      console.error('Caught error:', error);
    }

    // في وضع الإنتاج، يمكن إرسال الأخطاء إلى خدمة مراقبة الأخطاء
    if (environment.production) {
      // إرسال الخطأ إلى خدمة مراقبة الأخطاء (مثل Sentry)
      // this.loggingService.sendErrorToServer(error);
      
      // لا نعرض أي شيء في console في الإنتاج
      return;
    }

    // في وضع التطوير، نعرض الأخطاء للمساعدة في التطوير
    if (environment.enableDebugMode) {
      console.group('🔴 Global Error Handler');
      console.error('Error:', error);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      console.groupEnd();
    }
  }
}
