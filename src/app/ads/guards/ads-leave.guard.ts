import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap, of } from 'rxjs';

export interface ComponentCanDeactivate {
  canDeactivate: () => boolean | Observable<boolean>;
}

@Injectable({
  providedIn: 'root'
})
export class AdsLeaveGuard implements CanDeactivate<ComponentCanDeactivate> {
  canDeactivate(
    component: ComponentCanDeactivate
  ): boolean | Observable<boolean> {
    const canDeactivate = component.canDeactivate ? component.canDeactivate() : true;

    if (typeof canDeactivate === 'boolean' && canDeactivate) {
      return true;
    }
    
    if (typeof canDeactivate === 'boolean' && !canDeactivate) {
      return window.confirm('هل أنت متأكد أنك تريد المغادرة؟ سيتم فقدان أي تغييرات غير محفوظة.');
    }

    return (canDeactivate as Observable<boolean>).pipe(
      switchMap(shouldDeactivate => {
        if (shouldDeactivate) {
          return of(true);
        }
        return of(window.confirm('هل أنت متأكد أنك تريد المغادرة؟ سيتم فقدان أي تغييرات غير محفوظة.'));
      })
    );
  }
}
