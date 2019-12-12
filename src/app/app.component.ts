import { Component, ViewChild, OnInit, ElementRef, AfterViewInit } from '@angular/core';

declare const WebViewer: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('viewer', { static: false }) viewer: ElementRef;
  wvInstance: any;

  ngAfterViewInit(): void {

    WebViewer({
      path: '../lib',
      initialDoc: '../files/cheetahs.pdf',
      fullAPI: true,
    }, this.viewer.nativeElement).then(instance => {
      this.wvInstance = instance;
      const { docViewer, PDFNet } = instance;

      const flipDoc = async() => {
        const currentDocument = docViewer.getDocument();
        await PDFNet.initialize();
        const pdfDoc = await currentDocument.getPDFDoc();

        const pageNumber = docViewer.getCurrentPage()

        const page = await pdfDoc.getPage(pageNumber);
        const { width, height } = currentDocument.getPageInfo(0);
        //create a temp page
        const pageRect =  await PDFNet.Rect.init(0, 0,width,height);
        let newPage = await pdfDoc.pageCreate(pageRect);
        const apWriter = await PDFNet.ElementWriter.create();
        const apBuilder = await PDFNet.ElementBuilder.create();
        //this  matrix will flip content on the x axis
        const flipMatrix = await  new PDFNet.Matrix2D(-1, 0, 0, 1,width, 0);
        //create  an 'element' from the existing page and apply a transform matrix to filp it
        const ele = await apBuilder.createFormFromPage(page);
        const GS =  await ele.getGState();
        await GS.setTransformMatrix(flipMatrix);
        //add the flipped element to the temp page
        apWriter.beginOnPage(newPage,PDFNet.ElementWriter.WriteMode.e_underlay, true, false );
        await apWriter.writePlacedElement(ele);
        await apWriter.end();
        //replace the page with the flip one
        const pageToReplace = await  pdfDoc.getPageIterator(pageNumber);
        await pdfDoc.pageRemove(pageToReplace)
        await pdfDoc.pageInsert(pageToReplace,newPage);
        docViewer.refreshAll();
        docViewer.updateView();
      }

      instance.setHeaderItems(function(header) {
        header.unshift(
        {
          type: 'actionButton',
          img: `<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
              viewBox="0 0 20.562 20.562" style="enable-background:new 0 0 20.562 20.562;" xml:space="preserve">
            <g>
              <g>
                <path style="fill:#030104;" d="M9.178,18.799V1.763L0,18.799H9.178z M8.517,18.136h-7.41l7.41-13.752V18.136z"/>
                <polygon style="fill:#030104;" points="11.385,1.763 11.385,18.799 20.562,18.799 		"/>
              </g>
            </g>
          </svg>`,
          title:'Flip',
          onClick: () => {
            flipDoc();
          }
        })
      });
    })
  }

  ngOnInit() {
    this.wvDocumentLoadedHandler = this.wvDocumentLoadedHandler.bind(this);
  }

  wvDocumentLoadedHandler(): void {
  }
}
