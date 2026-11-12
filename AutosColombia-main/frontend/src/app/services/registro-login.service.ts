
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { timeout } from "rxjs";

import { API_BASE_URL } from "./api.service";
import { RegistroLogin } from "../models/registro-login";

@Injectable({
  providedIn: "root",
})
export class RegistroLoginService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  listar(offset = 0, limit = 100) {
    return this.http.get<RegistroLogin[]>(
      `${this.base}/registro-login`,
      {
        params: { offset, limit },
      },
    ).pipe(
      timeout(15000),
    );
  }
}
