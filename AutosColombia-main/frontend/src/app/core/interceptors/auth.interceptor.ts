
import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";

import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
} from "../services/auth.service";

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);

  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);

  // Solo adjuntamos el token a peticiones relativas de nuestra API.
  const isApiRequest =
    request.url.startsWith("/") && !request.url.startsWith("//");

  const isLoginRequest = request.url === "/auth/login";

  const shouldAttachToken =
    isApiRequest && !isLoginRequest && Boolean(token);

  const authenticatedRequest = shouldAttachToken
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        shouldAttachToken
      ) {
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        sessionStorage.removeItem(AUTH_USER_KEY);

        void router.navigateByUrl("/login");
      }

      return throwError(() => error);
    }),
  );
};
