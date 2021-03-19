import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ToolbarConfig } from './models';


@Component({
  selector: 'html-editor',
  templateUrl: './html-editor.component.html',
  styleUrls: ['./html-editor.component.scss']
})
export class HtmlEditorComponent implements OnInit 
{
	@ViewChild('editabeContent') editableContent: ElementRef<HTMLDivElement>;

	toolbar: ToolbarConfig[];
	tableActions: ToolbarConfig[];
	content: string;

	numOfCols: string;
	numOfRows: string;
	rowIndex: number;
	colIndex: number;
	currentElement: string;

	constructor(private renderer: Renderer2) 
	{
		this.toolbar = [
			{
				name: 'list',
				title: 'List'
			},
			{
				name: 'hyperlink',
				title: 'Hyperlink'
			},
			{
				name: 'back_color',
				title: 'Background Color'
			},
			{
				name: 'strikethrough',
				title: 'Strikethrough'
			},
			{
				name: 'image',
				title: 'Image'
			},
			{
				name: 'bold',
				title: 'Bold'
			},
			{
				name: 'italic',
				title: 'Italic'
			},
			{
				name: 'underline',
				title: 'Underline'
			},
			{
				name: 'select_all',
				title: 'Select All'
			}
		];

		this.tableActions = [
			{
				name: 'row_below',
				title: 'Row Below'
			},
			{
				name: 'row_above',
				title: 'Row Above'
			},
			{
				name: 'column_left',
				title: 'Column Left'
			},
			{
				name: 'column_right',
				title: 'Column Right'
			},
			{
				name: 'remove_row',
				title: 'Remove Row'
			},
			{
				name: 'remove_column',
				title: 'Remove Column'
			},
			{
				name: 'merge_cells',
				title: 'Merge Cells'
			},
		]
		this.numOfCols = null;
		this.numOfRows = null;

		this.rowIndex = 0;
		this.colIndex = 0;

		this.currentElement = null;
	}

	ngOnInit(): void 
	{

	}

	onToolbarAction(action: ToolbarConfig): void
	{
		console.log('Action =', action);

		switch(action.name) 
		{
			case 'list':
				document.execCommand('insertUnorderedList');
				break;
			
			case 'hyperlink':
				const url = prompt('Enter a URL:', 'http://');
				document.getSelection();
				document.execCommand('createLink', true, url);
				break;

			case 'back_color':
				const backgroundColor = prompt('Background color:', '');
        		document.execCommand('backColor', true, backgroundColor);
				break;

			case 'strikethrough':
				document.execCommand('strikeThrough');
				break;

			case 'image':
				const src = prompt('Enter a URL:', 'http://');
				document.getSelection();
				document.execCommand('insertImage', true, src);
				break;
			
			case 'bold':
				document.execCommand('bold');
				break;

			case 'italic':
				document.execCommand('italic');
				break;

			case 'underline':
				document.execCommand('underline');
				break;

			case 'select_all':
				document.execCommand('selectAll');
				break;
		}
	}

	onTableActions(action: ToolbarConfig): void
	{
		switch(action.name) 
		{
			case 'row_below':
				this.addRow('below');
				break;

			case 'row_above':
				this.addRow('above');
				break;

			case 'column_right':
				this.addColumn('right');
				break;

			case 'column_left':
				this.addColumn('left');
				break;

			case 'remove_row':
				this.onRemove('row');
				break;

			case 'remove_column':
				this.onRemove('column');
				break;

			case 'merge_cells':
				this.mergeCells();
				break;
		}
	}

	onAddTable(): void
	{
		this.makeTable();
		this.initResizing();
	}

	onEditableContainerClicked(ev: MouseEvent): void
	{
		this.currentElement = null;
        this.makeContentEditable();
	}

	makeTable(): void
	{
		const dimensions = prompt('rows/cols', '2/3');
        if (dimensions && dimensions != '') {
            [this.numOfRows, this.numOfCols] = dimensions.split('/');
            this.addHTMLAtCaretPos('table');
            this.removeContentEditable();
            // initResizing();
        }
	}

	makeContentEditable() {
		this.editableContent.nativeElement.setAttribute('contenteditable', 'true');
	}
	
	removeContentEditable() {
		this.editableContent.nativeElement.removeAttribute('contenteditable');
	}

	getRowIndex(ev: MouseEvent, row: HTMLTableRowElement) 
	{
		this.currentElement = 'table';
		this.rowIndex = row.rowIndex;
		this.removeContentEditable();
		ev.stopPropagation();
	}
	
	getCellIndex(col: HTMLTableCellElement) 
	{
		this.colIndex = col.cellIndex;
		this.currentElement = 'table';		
		console.log('Col Index =', this.colIndex);
	}
	
	onCellFocus(cell) {
		// setTimeout(() => {
		//     document.execCommand('selectAll', false, null);
		// }, 10);
	}

	getTableHTML(): HTMLTableElement
	{
		// const colWidth = (100/numOfCols).toFixed(2);
		const containerPadding = 20;
		const styles = window.getComputedStyle(this.editableContent.nativeElement);		// TODO replace getComputed with offsetWidth;
		const containerWidth = parseInt(styles.width, 10) - containerPadding;
		let width = (containerWidth / parseInt(this.numOfCols)).toFixed(2);
		console.log("width", width, this.numOfCols)
		//  width = 100;
	
		let table = this.renderer.createElement('table');
		table.setAttribute('id', 'dynamic_table');
		
		let thead = this.renderer.createElement('thead');
		let tbody = this.renderer.createElement('tbody');
	
		let theadRow = this.renderer.createElement('tr');
		theadRow.addEventListener('click', (ev: MouseEvent) => {
			this.getRowIndex(ev, theadRow)
		});
	
		for (let c=0; c<parseInt(this.numOfCols); c++) {
			let th = this.renderer.createElement('th');
			th.setAttribute('contenteditable', 'true');
			th.innerHTML = `Heading ${c+1}`;
			th.style.width = width + 'px';
	
			th.addEventListener('click', () => {
				this.getCellIndex(th);
			});
	
			th.addEventListener('focus', () => {
				this.onCellFocus(th);
			});
	
			theadRow.appendChild(th);
		}
	
		thead.appendChild(theadRow);
	
		for (let r=1; r<parseInt(this.numOfRows); r++) {
			let tr = this.renderer.createElement('tr');
			tr.addEventListener('click', (ev: MouseEvent) => {
				this.getRowIndex(ev, tr);
			});
	
			for (let c=0; c<parseInt(this.numOfCols); c++) {
				let td = this.renderer.createElement('td');
				td.setAttribute('contenteditable', 'true');
				td.innerHTML = `Cell ${c+1}`;
				//td.style.width = width + 'px';
	
				td.addEventListener('click', () => {
					this.getCellIndex(td);
				});
	
				td.addEventListener('focus', () => {
					this.onCellFocus(td);
				});
	
				tr.appendChild(td);
			}
	
			tbody.appendChild(tr);
		}
	
		table.appendChild(thead);
		table.appendChild(tbody);
	   
		return table;
	}

	addHTMLAtCaretPos(type: string): void
	{
		var sel, range;
		if (window.getSelection) 
		{
			// IE9 and non-IE
			sel = window.getSelection();
			if (sel.getRangeAt && sel.rangeCount) 
			{
				range = sel.getRangeAt(0);
				range.deleteContents();
	
				// Range.createContextualFragment() would be useful here but is
				// non-standard and not supported in all browsers (IE9, for one)
				const el = this.renderer.createElement('div');
				if (type == 'table') {
					el.appendChild(this.getTableHTML());
				}
				
				var frag = document.createDocumentFragment(), node, lastNode;
				while ( (node = el.firstChild) ) {
					lastNode = frag.appendChild(node);
				}
				
				range.insertNode(frag);
				
				// Preserve the selection
				if (lastNode) {
					range = range.cloneRange();
					range.setStartAfter(lastNode);
					range.collapse(true);
					sel.removeAllRanges();
					sel.addRange(range);
				}
			}
		} 
		// else if (document.selection && document.selection.type != "Control") {
		// 	// IE < 9
		// 	document.selection.createRange().pasteHTML(html);
		// }
	}

	addRow(pos: string): void
	{
		const table = (document.getElementById('dynamic_table') as HTMLTableElement);		// TODO; need to remove document.getElement
		let colsToAdd = 0;
			
		if (table) {
			colsToAdd = table.rows[this.rowIndex].cells.length;
	
			if (pos == 'below') this.rowIndex += 1;
			if (this.rowIndex == 0) this.rowIndex = 1;
	
			const row = table.insertRow(this.rowIndex);
	
			for (let i=0; i<colsToAdd; i++) {
				let cell = row.insertCell(i);
				cell.setAttribute('contenteditable', 'true');
				cell.innerHTML = `Cell ${i+1}`;
				cell.style.border = '1px solid gray';
				cell.onclick = () => {
					this.getCellIndex(cell);
				}
			}
	
			row.onclick = (ev: MouseEvent) => {
				this.getRowIndex(ev, row);
			};
		}
	}

	addColumn(pos: string): void
	{
		if (pos == 'right') this.colIndex += 1;
	
		if (this.colIndex < 0) this.colIndex = 0;
	
		const table = (document.getElementById('dynamic_table') as HTMLTableElement);
	
		if (table) {
			var tblHeadObj = table.tHead;
	
			for (var h=0; h<tblHeadObj.rows.length; h++) {
				tblHeadObj.rows[h].insertCell(this.colIndex).outerHTML = "<th>Heading</th>";
				const th = tblHeadObj.rows[h].cells[this.colIndex];
				th.setAttribute('contenteditable', 'true');
				th.style.width = '70px';
				th.style.border = '1px solid gray';
				th.onclick = () => {
					this.getCellIndex(th);
				}
	
				th.onfocus = () => {
					this.onCellFocus(th);
				};
	
				// addResizerDiv(th, table);
			}
		
			var tblBodyObj = (document.getElementById('dynamic_table') as HTMLTableElement).tBodies[0];
			for (var i=0; i<tblBodyObj.rows.length; i++) {
				const cell = tblBodyObj.rows[i].insertCell(this.colIndex);
				cell.setAttribute('contenteditable', 'true');
				cell.innerHTML = `Cell ${i+1}`;
				cell.style.border = '1px solid gray';
				cell.onclick = () => {
					this.getCellIndex(cell);
				}
	
				cell.onfocus = () => {
					this.onCellFocus(cell);
				};
			}
		
	
			// This give equal width to all table columns;
			
			// numOfCols = parseInt(numOfCols) + 1;
			// // const colWidth = (100 / numOfCols).toFixed(2);
		
			// const rowInds = Object.keys(table.rows);
		
			// setTimeout(() => {
			//     for (const rIdx of rowInds) {
			//         const row = table.rows[+rIdx];
			//         const cellIdx = Object.keys(row.cells);
			//         for (const cIdx of cellIdx) {
			//             const col = row.cells[+cIdx];
			//             col.style.width = 'fit-content';
			//         }
			//     }
			// }, 0);
		}
	}

	onRemove(type: string): void
	{
		const table = (document.getElementById('dynamic_table') as HTMLTableElement);
		if (table) 
		{
			if (type == 'row') table.deleteRow(this.rowIndex);
			else 
			{
				var allRows = table.rows;
				for (var i=0; i<allRows.length; i++) 
				{
					if (allRows[i].cells.length > 1) allRows[i].deleteCell(this.colIndex);
				}
			}
		}
	}

	mergeCells(): void
	{
		let selection = window.getSelection().getRangeAt(0);
		let startingElementIdx = 0;
	
		const startingElement = selection.startContainer.parentElement as HTMLTableCellElement;
		startingElementIdx = startingElement.cellIndex;
		const row = selection.startContainer.parentElement.parentElement as HTMLTableRowElement;
		const endingElementIdx = startingElementIdx + 1;
		const endingElement = row.cells[endingElementIdx];
	
		const cells = row.cells;

		if (cells) 
		{
			for (let i=0; i<cells.length; i++) {
				let cell = cells[i];

				if (cell.cellIndex <= startingElementIdx) continue;
				if (cell.cellIndex > endingElementIdx) continue;
			
				setTimeout(() => {
					row.removeChild(cell);
				}, 100);
			}
		
			if (startingElement.getAttribute('colSpan')) 
			{
				if (endingElement.getAttribute('colSpan')) {
					startingElement.colSpan += endingElement.colSpan;
				} else {
					startingElement.colSpan += 1;
				}
			}
			else {
				startingElement.colSpan = endingElementIdx - startingElementIdx + 1;
			}
		}
	}


	reInitializeResizing(): void
	{
		document.querySelectorAll('.resizer').forEach(e => e.remove());
		this.initResizing();
	}
	
	initResizing(): void
	{
		const table = document.getElementById('dynamic_table');
	
		// Query all headers
		const cols = table.querySelectorAll('th');
	
		// Loop over them
		[].forEach.call(cols, (col) => {
			this.addResizerDiv(col, table);
		});
	}
	
	addResizerDiv(c: any, tbl: any) {
		// Create a resizer element
		const resizer = this.renderer.createElement('div');
		resizer.classList.add('resizer');
	
		// Set the height
		resizer.style.height = `${tbl.offsetHeight}px`;
	
		// Add a resizer element to the column
		c.appendChild(resizer);
	
		// Will be implemented in the next section
		this.createResizableColumn(c, resizer);
	}
	
	createResizableColumn(col: any, resizer: any): void
	{
		// Track the current position of mouse
		let x = 0;
		let w = 0;
	
		const mouseDownHandler = function(e) {
			// Get the current mouse position
			x = e.clientX;
	
			// Calculate the current width of column
			const styles = window.getComputedStyle(col);
			w = parseInt(styles.width, 10);
			resizer.classList.add('resizing');
	
			// Attach listeners for document's events
			document.addEventListener('mousemove', mouseMoveHandler);
			document.addEventListener('mouseup', mouseUpHandler);
		};
	
		const mouseMoveHandler = function(e) {
			// Determine how far the mouse has been moved
			const dx = e.clientX - x;
	
			// Update the width of column
			col.style.width = `${w + dx}px`;
	
			resizer.classList.remove('resizing');
		};
	
		// When user releases the mouse, remove the existing event listeners
		const mouseUpHandler = function() {
			document.removeEventListener('mousemove', mouseMoveHandler);
			document.removeEventListener('mouseup', mouseUpHandler);
		};
	
		resizer.addEventListener('mousedown', mouseDownHandler);
	};

	onPreview(): void
	{
		this.content = this.editableContent.nativeElement.innerHTML;
	}
}
