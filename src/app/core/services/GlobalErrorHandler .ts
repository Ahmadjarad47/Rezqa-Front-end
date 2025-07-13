import { ErrorHandler, Injectable } from '@angular/core';
import { environment } from '@environments/environment.development';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    // لا تطبع أي شيء في الإنتاج
    if (!environment.production) {
      console.error('Caught error:', error);
    }

    // يمكنك إرسال الخطأ لسيرفر مثلاً
    // this.loggingService.sendErrorToServer(error);
  }
}
