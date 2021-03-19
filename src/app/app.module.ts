import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { HtmlEditorComponent } from './html-editor/html-editor.component';

@NgModule({
  declarations: [
    AppComponent,
    HtmlEditorComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
