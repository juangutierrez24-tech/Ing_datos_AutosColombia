import { Component } from "@angular/core";
import { LucideFilter, LucideRotateCcw } from "@lucide/angular";

@Component({
  selector: "app-login-history",
  standalone: true,
  imports: [LucideFilter, LucideRotateCcw],
  templateUrl: "./login-history.component.html",
})
export class LoginHistoryComponent {
  readonly rows = [
    ["Juan Pérez","jperez","04/11/2026","08:32"],
    ["Ana Gómez","agomez","04/11/2026","07:54"],
    ["Carolina Ramírez","cramirez","03/11/2026","16:18"],
    ["Luis Hernández","lhernandez","03/11/2026","13:41"],
    ["Laura Gómez","lgomez","03/11/2026","07:47"],
  ];
}
