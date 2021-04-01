import { Component, ElementRef, Renderer2, ViewChild, ɵSafeHtml } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { EditableContent, TableJSON, ToolbarConfig } from './models';


@Component({
  selector: 'html-editor',
  templateUrl: './html-editor.component.html',
  styleUrls: ['./html-editor.component.scss']
})
export class HtmlEditorComponent
{
	@ViewChild('editabeContent') editableContent: ElementRef<HTMLDivElement>;

	toolbar: ToolbarConfig[];
	tableActions: ToolbarConfig[];
	content: EditableContent[];
	html: ɵSafeHtml;

	numOfCols: number;
	numOfRows: number;
	numOfTables: number;
	numOfTablesToPatch: number;
	rowIndex: number;
	colIndex: number;
	currentElement: 'Table' | 'EditableContainer' | 'MainContainer';
	tableJson: TableJSON;

	constructor(private renderer: Renderer2, private sanitizer: DomSanitizer) 
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
				name: 'remove_table',
				title: 'Remove Table'
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
			}
		]
		this.numOfCols = null;
		this.numOfRows = null;

		this.rowIndex = 0;
		this.colIndex = 0;

		this.currentElement = 'MainContainer';

		this.numOfTables = 0;
		this.numOfTablesToPatch = null;

		this.tableJson = { header: [], body: [] };
		this.content = [];
		this.html = '';
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

			case 'remove_table':
				this.onRemove('table');
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

	onMainContainerClick(): void
	{
		this.currentElement = 'MainContainer';
	}

	onEditableContainerClicked(ev: MouseEvent): void
	{
		this.currentElement = 'EditableContainer';
        this.makeContentEditable();
		ev.stopPropagation();
	}

	makeTable(): void
	{
		const dimensions = prompt('rows/cols', '2/3');
        if (dimensions && dimensions != '') 
		{
			if (this.currentElement === 'Table' || this.currentElement === 'MainContainer') return;

            [this.numOfRows, this.numOfCols] = dimensions.split('/').map(Number);
            this.addHTMLAtCaretPos('table');
			this.setEventListeners();
            this.removeContentEditable();
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
		this.currentElement = 'Table';
		this.rowIndex = row.rowIndex;
		this.removeContentEditable();
		ev.stopPropagation();
	}
	
	getCellIndex(col: HTMLTableCellElement) 
	{
		this.colIndex = col.cellIndex;
		this.currentElement = 'Table';		
		console.log('Col Index =', this.colIndex);
	}
	
	onCellFocus(cell) {
		// setTimeout(() => {
		//     document.execCommand('selectAll', false, null);
		// }, 10);
	}

	getTableHTML(): HTMLTableElement
	{
		this.numOfTables += 1;
		const containerPadding = 20;
		const styles = window.getComputedStyle(this.editableContent.nativeElement);		// TODO replace getComputed with offsetWidth;
		const containerWidth = parseInt(styles.width, 10) - containerPadding;
		let width = (containerWidth / this.numOfCols).toFixed(2);	
	
		let table = this.renderer.createElement('table');
		table.setAttribute('id', `dynamic_table_${this.numOfTables}`);
		
		let thead = this.renderer.createElement('thead');
		let tbody = this.renderer.createElement('tbody');
		let theadRow = this.renderer.createElement('tr');
	
		for (let c=0; c<this.numOfCols; c++) {
			let th = this.renderer.createElement('th');
			th.setAttribute('contenteditable', 'true');

			if (this.tableJson.header.length > 0) {
				th.innerHTML = this.tableJson.header[c].text;
				th.style.width = this.tableJson.header[c].width;

				if (this.tableJson.header[c].colSpan > 0) {
					th.colSpan = this.tableJson.header[c].colSpan;
				}
			} 
			else {
				th.innerHTML = `Heading ${c+1}`;
				th.style.width = width + 'px';	
			}
			theadRow.appendChild(th);
		}
	
		thead.appendChild(theadRow);
	
		for (let r=0; r<this.numOfRows - 1; r++) {
			let tr = this.renderer.createElement('tr');
			const len = this.tableJson.body.length;

			console.log('Table JSON =', this.tableJson);
			this.numOfCols = (len > 0) ? this.tableJson.body[r].cells.length : this.numOfCols;
			
			for (let c=0; c<this.numOfCols; c++) {
				let td = this.renderer.createElement('td');
				td.setAttribute('contenteditable', 'true');

				if (len > 0) {
					td.innerHTML = this.tableJson.body[r].cells[c].text;

					if (this.tableJson.body[r].cells[c].colSpan > 0) {
						td.colSpan = this.tableJson.body[r].cells[c].colSpan;
					}
				} 
				else {
					td.innerHTML = `Cell ${c+1}`;
				}
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

	getTableId(): string 
	{
		let selection = window.getSelection().getRangeAt(0);
		let startingElement = selection.startContainer.parentElement;

		while(startingElement.tagName != 'TABLE') {
			startingElement = startingElement.parentElement;
		}

		return startingElement.getAttribute('id');
	}

	addRow(pos: string): void
	{
		const table = (document.getElementById(this.getTableId()) as HTMLTableElement);		// TODO; need to remove document.getElement
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

			this.reInitializeResizing();
		}
	}

	addColumn(pos: string): void
	{
		if (pos == 'right') this.colIndex += 1;
	
		if (this.colIndex < 0) this.colIndex = 0;
	
		const table = (document.getElementById(this.getTableId()) as HTMLTableElement);
	
		if (table) {
			var tblHeadObj = table.tHead;
	
			for (var h=0; h<tblHeadObj.rows.length; h++) {
				tblHeadObj.rows[h].insertCell(this.colIndex).outerHTML = "<th>Heading</th>";
				const th = tblHeadObj.rows[h].cells[this.colIndex];
				th.setAttribute('contenteditable', 'true');
				th.style.width = '70px';
				th.style.border = '1px solid gray';
				th.style.position = 'relative';

				th.onclick = () => {
					this.getCellIndex(th);
				}
	
				th.onfocus = () => {
					this.onCellFocus(th);
				};
	
				// addResizerDiv(th, table);
			}
		
			var tblBodyObj = table.tBodies[0];
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
		
			this.reInitializeResizing();
	
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
		const table = (document.getElementById(this.getTableId()) as HTMLTableElement);
		if (table) 
		{
			switch(type) {
				case 'row':
					table.deleteRow(this.rowIndex);
					this.numOfRows -= 1;
					break;

				case 'table':
					const parent = table.parentElement;
					parent.removeChild(table);
					this.numOfTables -= 1;
					break;

				default:
					var allRows = table.rows;
					for (var i=0; i<allRows.length; i++) 
					{
						if (allRows[i].cells.length > 1) allRows[i].deleteCell(this.colIndex);
					}

					this.numOfCols -= 1;
			}
		}
	}

	mergeCells(s: HTMLTableCellElement = null, r: HTMLTableRowElement = null): void
	{
		let selection = window.getSelection().getRangeAt(0);
		let startingElementIdx = 0;
	
		const startingElement = s ? s : selection.startContainer.parentElement as HTMLTableCellElement;
		startingElementIdx = startingElement.cellIndex;
		const row = r ? r : selection.startContainer.parentElement.parentElement as HTMLTableRowElement;
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
		const id = this.getTableId();
		const table = document.getElementById(id);
		table.querySelectorAll('.resizer').forEach(e => e.remove());
		this.initResizing(id);
	}
	
	initResizing(id: string): void
	{
		const table = document.getElementById(id) as HTMLTableElement;
	
		// Query all headers
		const cols = table.querySelectorAll('th');
	
		// Loop over them
		[].forEach.call(cols, (col) => {
			this.addResizerDiv(col, table);
		});
	}
	
	addResizerDiv(c: HTMLTableCellElement, tbl: HTMLTableElement) {
		// Create a resizer element
		const resizer = this.renderer.createElement('div');
		resizer.classList.add('resizer');
	
		// Set the height
		resizer.style.height = `${tbl.offsetHeight}px`;
	
		// Add a resizer element to the column
		c.appendChild(resizer);
	
		// Will be implemented in the next section
		this.createResizableColumn(c, resizer, tbl);
	}
	
	createResizableColumn2(col: HTMLTableCellElement, resizer: HTMLDivElement, table: HTMLTableElement): void
	{
		// Track the current position of mouse
		let x = 0;
		let w = 0;
	
		const mouseDownHandler = (e: MouseEvent) => {
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
	
		const mouseMoveHandler = (e: MouseEvent) => {
			// Determine how far the mouse has been moved
			const dx = e.clientX - x;
	
			// Update the width of column
			col.style.width = `${w + dx}px`;
	
			resizer.classList.remove('resizing');
		};
	
		// When user releases the mouse, remove the existing event listeners
		const mouseUpHandler = () => {
			document.removeEventListener('mousemove', mouseMoveHandler);
			document.removeEventListener('mouseup', mouseUpHandler);
		};
	
		resizer.addEventListener('mousedown', mouseDownHandler);
	};

	createResizableColumn(col: HTMLTableCellElement, resizer: HTMLDivElement, table: HTMLTableElement): void
	{
		let pageX = 0;
		let curColWidth = 0;
		let nxtColWidth = 0;
		let nxtCol = null;
		const minColWidth = 70;
		const parentPadding = 22;

		const mouseDownHandler = (e: MouseEvent) => {
			// Calculate the current width of column
			nxtCol = col.nextElementSibling as HTMLTableCellElement;
			pageX = e.pageX;
			curColWidth = col.offsetWidth;
			if (nxtCol) {
				nxtColWidth = nxtCol.offsetWidth;
			}
			resizer.classList.add('resizing');
	
			// Attach listeners for document's events
			document.addEventListener('mousemove', mouseMoveHandler);
			document.addEventListener('mouseup', mouseUpHandler);
		};
	
		const mouseMoveHandler = (e: MouseEvent) => {
			if (col) 
			{
				var diffX = e.pageX - pageX;
			  
				if (nxtCol) {
					nxtCol.style.width = (nxtColWidth - (diffX))+'px';

					// Min column width Check;
					if (nxtCol.offsetWidth <= minColWidth) this.removeMouseEvents(mouseMoveHandler, mouseUpHandler);
				}
			 
				col.style.width = (curColWidth + diffX)+'px';

				// Last column width should not increase if table width exceeds from parent width;
				if (col.cellIndex === this.numOfCols - 1 && (table.offsetWidth >= (table.parentElement.parentElement.offsetWidth - parentPadding)) && diffX > 0)
				{
					console.log('Table width exceeds from parent width.');
					this.removeMouseEvents(mouseMoveHandler, mouseUpHandler);
				}

				// Min column width Check;
				if (col.offsetWidth <= minColWidth) this.removeMouseEvents(mouseMoveHandler, mouseUpHandler);
				resizer.classList.remove('resizing');
			}
		};
	
		// When user releases the mouse, remove the existing event listeners
		const mouseUpHandler = () => this.removeMouseEvents(mouseMoveHandler, mouseUpHandler);
	
		resizer.addEventListener('mousedown', mouseDownHandler);
	};

	removeMouseEvents(mouseMove: any, mouseUp: any): void {
		document.removeEventListener('mousemove', mouseMove);
		document.removeEventListener('mouseup', mouseUp);
		return;
	}

	getDescriptionDataAsString(): string
    {
        let content = '';
        const children = this.editableContent.nativeElement.children;

		if (children.length > 0) {
			for (let c=0; c<children.length; c++ ) 
			{
				let child = children[c];
				let json = null;
	
				if (child.getElementsByTagName('table').length > 0) 
				{
					let newChildren = child.children;

					for (let j=0; j<newChildren.length; j++) 
					{
						let newChild = newChildren[j];
						if (newChild.tagName === 'TABLE') {
							json = this.getTableJSON(newChild.getAttribute('id'));
							content += `#JSON${json}`;
						}

						else if (newChild.getElementsByTagName('table').length > 0) {
							let tableChildrens = newChild.children;
							while(tableChildrens.length > 0) {
								let counter = 0;
								if (tableChildrens[counter].tagName === 'TABLE') {
									json = this.getTableJSON(tableChildrens[counter].getAttribute('id'));
									content += `#JSON${json}`;
									break;
								}
								else if (tableChildrens[counter].getElementsByTagName('table')) {
									tableChildrens = tableChildrens[counter].children;
									counter += 1;
								}
							}
						}
						else {
							content += newChild.outerHTML;
						}
					}
				}
				else
				{
					content += child.outerHTML;
				}			
			}
		}
		else 
		{
			return this.editableContent.nativeElement.innerHTML
		}
    
        return content;
    }

	addContent(type: 'table' | 'normal', content: any): void
	{
		const obj: EditableContent = {type, content};
		this.content.push(obj);
	}

	getSectionJSON(): void
	{
		this.content = [];
        const children = this.editableContent.nativeElement.children;

		if (children.length > 0) {
			let json = null;
			Array.from(children).forEach((child: HTMLElement) => {
				if (child.getElementsByTagName('table').length > 0) 
				{
					Array.from(child.children).forEach((newChild: HTMLElement) => {
						if (newChild.tagName === 'TABLE') {
							json = this.getTableJSON(newChild.getAttribute('id'));
							this.addContent('table', json);
						}

						else if (newChild.getElementsByTagName('table').length > 0) {
							let tableChildrens = newChild.children;
							while(tableChildrens.length > 0) {
								let counter = 0;
								if (tableChildrens[counter].tagName === 'TABLE') 
								{
									json = this.getTableJSON(tableChildrens[counter].getAttribute('id'));
									this.addContent('table', json);
									break;
								}
								else if (tableChildrens[counter].getElementsByTagName('table')) {
									tableChildrens = tableChildrens[counter].children;
									counter += 1;
								}
							}
						}
						else this.addContent('normal', newChild.outerHTML);
					});
				}
				else
				{
					if (child.tagName === 'TABLE') {
						json = this.getTableJSON(child.getAttribute('id'));
						this.addContent('table', json);
					}
					else this.addContent('normal', child.outerHTML);
				}
			});
		}
		else 
		{
			this.addContent('normal', this.editableContent.nativeElement.innerHTML);
		}
	}

	getTableJSON(id: string): string
	{
		this.tableJson = {header: [], body: []};
		const table = (document.getElementById(id) as HTMLTableElement);		// TODO; need to remove document.getElement			
		if (table) 
		{
			table.querySelectorAll('.resizer').forEach(e => e.remove());

			let thead = table.tHead.rows[0];

			for (var th=0; th<thead.cells.length; th++) {
				const cell = thead.cells[th];

				this.tableJson.header.push({
					text: cell.innerHTML,
					colSpan: +cell.getAttribute('colSpan'),
					width: cell.style.width
				});
			}

			const tableBody = table.tBodies[0];
			for (let r=0; r < tableBody.rows.length; r++) {
				let row = tableBody.rows[r];
				this.tableJson.body.push({cells: []});
				
				for (let c=0; c < row.cells.length; c++ )
				{
					let cell = row.cells[c];
					this.tableJson.body[r].cells.push({
						text: cell.innerHTML,
						colSpan: +cell.getAttribute('colSpan')
					});
				}
			}
		}	

		return JSON.stringify(this.tableJson);
	}

	onPreview(): void
	{		
		this.getSectionJSON();
		console.log('Content =', this.content);
		// this.content = [ { "type": "normal", "content": "<div>some Text</div>" }, { "type": "normal", "content": "<div><b><i>bold + italic</i></b></div>" }, { "type": "normal", "content": "<div><b><i><u>bold + italic + underline</u></i></b></div>" }, { "type": "normal", "content": "<div><b><i><u><br></u></i></b></div>" }, { "type": "normal", "content": "<div><b><u>list 1</u></b></div>" }, { "type": "normal", "content": "<div><ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul></div>" }, { "type": "table", "content": "{\"header\":[{\"text\":\"Heading 1\",\"colSpan\":0,\"width\":\"241.33px\"},{\"text\":\"Heading 2\",\"colSpan\":0,\"width\":\"241.33px\"},{\"text\":\"Heading 3\",\"colSpan\":0,\"width\":\"241.33px\"}],\"body\":[{\"cells\":[{\"text\":\"Cell 1\",\"colSpan\":0},{\"text\":\"Cell 2\",\"colSpan\":0},{\"text\":\"Cell 3\",\"colSpan\":0}]}]}" }, { "type": "normal", "content": "<br>" }, { "type": "normal", "content": "<div _ngcontent-wdl-c11=\"\"><b><u>list 2</u></b></div>" }, { "type": "normal", "content": "<ul><li>Item 4</li><li>Item 5</li><li>Item 6</li><li>Item 7</li></ul>" }, { "type": "table", "content": "{\"header\":[{\"text\":\"Heading 1\",\"colSpan\":0,\"width\":\"238.67px\"},{\"text\":\"Heading 2\",\"colSpan\":0,\"width\":\"238.67px\"},{\"text\":\"Heading 3\",\"colSpan\":0,\"width\":\"238.67px\"}],\"body\":[{\"cells\":[{\"text\":\"Cell 1\",\"colSpan\":2},{\"text\":\"Cell 3\",\"colSpan\":0}]},{\"cells\":[{\"text\":\"Cell 1\",\"colSpan\":0},{\"text\":\"Cell 2\",\"colSpan\":0},{\"text\":\"Cell 3\",\"colSpan\":0}]},{\"cells\":[{\"text\":\"<b>Cell 1</b>\",\"colSpan\":0},{\"text\":\"<span style=\\\"background-color: green;\\\">Cell 2</span>\",\"colSpan\":0},{\"text\":\"Cell 3\",\"colSpan\":0}]}]}" } ];
		this.editableContent.nativeElement.innerHTML = null;
		for (let section of this.content) {
			switch(section.type) {
				case 'normal':
					this.editableContent.nativeElement.innerHTML += section.content;
					break;

				case 'table':
					this.tableJson = JSON.parse(section.content);
					this.numOfCols = this.tableJson.header.length;
					this.numOfRows = this.tableJson.body.length + 1;
					
					const el = this.renderer.createElement('div');
					el.appendChild(this.getTableHTML());
					this.editableContent.nativeElement.appendChild(el);
					this.numOfTablesToPatch = this.numOfTables;
					setTimeout(() => {
						this.setEventListeners();
					}, 0);
					break;
			}
		}

		this.html = this.sanitizer.bypassSecurityTrustHtml(this.editableContent.nativeElement.innerHTML);
		console.log('HTML =', this.editableContent.nativeElement.innerHTML);

		setTimeout(() => {
			this.numOfTablesToPatch = null;
		}, 0);
		
		
		// this.content = this.getDescriptionDataAsJSON();
		// this.editableContent.nativeElement.innerHTML = null;
		// if (this.content.includes('#JSON')) {
		// 	console.log('JSON Content =', this.content);

		// 	const searchTerm = this.content.substring(this.content.search('#JSON'), (this.content.search('}]}]}'))) + '}]}]}';
		// 	console.log('Search Term =', searchTerm);
        //     const otherContent = this.content.split(searchTerm);
        //     console.log('Other content =', otherContent);

		// 	this.editableContent.nativeElement.innerHTML = otherContent[0];

		// 	this.tableJson = JSON.parse(searchTerm.replace('#JSON', ''));
		// 	this.numOfCols = this.tableJson.header.length.toString();
		// 	this.numOfRows = (this.tableJson.body.length + 1).toString();
			
		// 	const el = this.renderer.createElement('div');
		// 	el.appendChild(this.getTableHTML());
		// 	this.editableContent.nativeElement.appendChild(el);
		// 	this.editableContent.nativeElement.innerHTML += otherContent[1];

		// 	this.setEventListeners();
		// 	this.initResizing(`dynamic_table_${this.numOfTables}`);
		// }
		// else
		// {
		// 	console.log('Without JSON =', this.content);
		// 	this.editableContent.nativeElement.innerHTML = this.content;
		// }
	}

	setEventListeners(): void
	{
		let id = 'dynamic_table_';
		id += this.numOfTablesToPatch ? this.numOfTablesToPatch : this.numOfTables;
		const table = document.getElementById(id) as HTMLTableElement;
		
		if (table) {
			const theadRow = table.tHead.rows[0];
			theadRow.addEventListener('click', (ev: MouseEvent) => {
				this.getRowIndex(ev, theadRow);
			});
	
			for (let h=0; h<theadRow.cells.length; h++) {
				const th = theadRow.cells[h];
				th.addEventListener('click', (ev: MouseEvent) => {
					this.getCellIndex(th);
				});
			}
	
			const tbody = table.tBodies[0].rows;
	
			for (let r=0; r<tbody.length; r++) {
				const row = tbody[r];
				row.addEventListener('click', (ev: MouseEvent) => {
					this.getRowIndex(ev, row);
				});
	
				for (let c=0; c<row.cells.length; c++) {
					const td = row.cells[c];
					td.addEventListener('click', (ev: MouseEvent) => {
						this.getCellIndex(td);
					});
				}
			}
		}

		if (this.numOfTablesToPatch) this.numOfTablesToPatch -= 1;
		this.initResizing(id);
	}
}
