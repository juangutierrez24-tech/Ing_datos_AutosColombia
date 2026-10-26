import { Component } from "@angular/core";
import { LucideCalendarDays, LucideChevronLeft, LucideChevronRight } from "@lucide/angular";
import { StatusBadgeComponent } from "../../shared/status-badge.component";

@Component({
  selector: "app-history",
  standalone: true,
  imports: [StatusBadgeComponent, LucideCalendarDays, LucideChevronLeft, LucideChevronRight],
  templateUrl: "./history.component.html",
})
export class HistoryComponent {
  readonly stays = [
    ["KLM482","A-12","12 may · 08:42","—","C. Ramírez","—","Abierta"],
    ["TQP103","B-07","12 may · 08:16","—","L. Hernández","—","Abierta"],
    ["ABC123","A-05","12 may · 07:31","12 may · 09:12","C. Ramírez","L. Hernández","Cerrada"],
    ["NVS638","B-11","12 may · 06:48","12 may · 08:54","L. Hernández","C. Ramírez","Cerrada"],
  ];
}
