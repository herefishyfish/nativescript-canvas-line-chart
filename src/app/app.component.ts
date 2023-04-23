import { Component } from '@angular/core'
import { transactions } from "@/data"
@Component({
  selector: 'ns-app',
  templateUrl: './app.component.html',
})
export class AppComponent {
   transactionsData = transactions;
}
