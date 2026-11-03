import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  LucideCar,
  LucideCheck,
  LucideSearch,
  LucideX,
} from '@lucide/angular';

import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { EstanciasService } from '../../services/estancias.service';
import { Vehiculo } from '../../models/vehiculo';
import { Celda } from '../../models/celda';
import { Operador } from '../../models/operador';

@Component({
  selector: 'app-entry',
  standalone: true,
  imports: [
    FormsModule,
    StatusBadgeComponent,
    LucideCar,
    LucideCheck,
    LucideSearch,
    LucideX,
  ],
  templateUrl: './entry.component.html',
})
export class EntryComponent {
  private readonly estanciasService = inject(EstanciasService);

  plate = '';
  selectedCellId: number | null = null;
  selectedOperatorId: number | null = null;

  readonly vehicle = signal<Vehiculo | null>(null);
  readonly cells = signal<Celda[]>([]);
  readonly operators = signal<Operador[]>([]);

  readonly searched = signal(false);
  readonly searching = signal(false);
  readonly saving = signal(false);
  readonly confirmed = signal(false);

  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly catalogError = signal('');

  constructor() {
    this.loadCatalogs();
  }

  private loadCatalogs(): void {
    this.estanciasService.celdas().subscribe({
      next: (data) => this.cells.set(data),
      error: () => {
        this.catalogError.set('No se pudieron cargar las celdas.');
      },
    });

    this.estanciasService.operadores().subscribe({
      next: (data) => this.operators.set(data),
      error: () => {
        this.catalogError.set('No se pudieron cargar los operadores.');
      },
    });
  }

  search(): void {
    this.plate = this.plate.trim().toUpperCase();

    this.vehicle.set(null);
    this.searched.set(false);
    this.confirmed.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.selectedCellId = null;
    this.selectedOperatorId = null;

    if (!/^[A-Z]{3}[0-9]{3}$/.test(this.plate)) {
      this.errorMessage.set(
        'La placa debe tener tres letras seguidas de tres números. Ejemplo: ABC123.'
      );
      return;
    }

    this.searching.set(true);

    this.estanciasService.consultar(this.plate).subscribe({
      next: (result) => {
        this.searching.set(false);

        if (result.esta_dentro) {
          this.errorMessage.set(
            'Este vehículo ya se encuentra dentro del parqueadero.'
          );
          return;
        }

        this.vehicle.set(result.vehiculo);
        this.searched.set(true);
      },
      error: (error: HttpErrorResponse) => {
        this.searching.set(false);

        if (error.status === 404) {
          this.errorMessage.set(
            'No encontramos un vehículo con esta placa. Primero debes registrarlo en el módulo de vehículos.'
          );
        } else {
          this.errorMessage.set(
            error.error?.detail || 'No fue posible consultar el vehículo. Intenta nuevamente.'
          );
        }
      },
    });
  }

  confirm(): void {
    const vehicle = this.vehicle();

    if (!vehicle || this.selectedCellId === null ||
        this.selectedOperatorId === null) {
      this.errorMessage.set(
        'Selecciona una celda y un operador antes de confirmar.'
      );
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.saving.set(true);

    this.estanciasService.entrada({
      placa: vehicle.placa,
      celda_id: this.selectedCellId,
      operador_id: this.selectedOperatorId,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.confirmed.set(true);
        this.successMessage.set(
          `La entrada del vehículo ${vehicle.placa} fue registrada correctamente.`
        );
        this.searched.set(false);
        this.vehicle.set(null);
        this.plate = '';
        this.selectedCellId = null;
        this.selectedOperatorId = null;
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.errorMessage.set(
          error.error?.detail || 'No se pudo registrar la entrada. Intenta nuevamente.'
        );
      },
    });
  }
}