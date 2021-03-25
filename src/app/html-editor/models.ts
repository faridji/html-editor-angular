export interface ToolbarConfig {
    name: string;
    title: string;
}

export interface TableJSON {
    header: Cell[];
    body: TableBodyRow[];
}

export interface TableBodyRow {
    cells: Cell[];
}

export interface Cell {
    text: string;
    colSpan: number;
    width?: string;
}

export interface EditableContent {
    type: 'table' | 'normal';
    content: any;
}