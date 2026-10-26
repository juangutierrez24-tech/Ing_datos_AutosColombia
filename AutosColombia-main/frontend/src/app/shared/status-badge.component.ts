import { Component, input } from "@angular/core";

@Component({
  selector: "app-status-badge",
  standalone: true,
  template: '<span class="badge" [class]="tone()"><i></i><ng-content /></span>',
})
export class StatusBadgeComponent {
  tone = input<"green" | "blue" | "gray" | "red">("green");
}
