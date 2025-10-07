import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@app/identity/services/auth.service';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
 
  req = req.clone({
    withCredentials: true,
  
  });

  return next(req);
};
