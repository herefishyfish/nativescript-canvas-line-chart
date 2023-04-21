import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptModule } from '@nativescript/angular';
import { CanvasModule } from '@nativescript/canvas/angular';
import { registerElement } from '@nativescript/angular';
registerElement('Canvas', () => require('@nativescript/canvas').Canvas);

import { AppComponent } from './app.component';
import { LineGraphComponent } from './line-graph.component';

@NgModule({
  bootstrap: [AppComponent],
  imports: [NativeScriptModule, CanvasModule],
  declarations: [AppComponent, LineGraphComponent],
  providers: [],
  schemas: [NO_ERRORS_SCHEMA],
})
export class AppModule {}
