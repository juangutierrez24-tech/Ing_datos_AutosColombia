export type VehicleType = "Moto" | "Automóvil" | "Camioneta";
export type StayStatus = "Abierta" | "Cerrada";

export interface Vehicle {
  plate: string;
  brand: string;
  model: string;
  color: string;
  type: VehicleType;
}

export interface ParkingCell {
  code: string;
  type: VehicleType;
  status: "Disponible" | "Ocupada";
  vehiclePlate?: string;
}

export interface Operator {
  id: string;
  name: string;
  phone: string;
  status: "Activo" | "Inactivo";
}

export interface Stay {
  plate: string;
  cell: string;
  entryAt: string;
  exitAt?: string;
  entryOperator: string;
  exitOperator?: string;
  status: StayStatus;
}
