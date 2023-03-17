// Type definitions for @ag-grid-community/core v29.2.0
// Project: https://www.ag-grid.com/
// Definitions by: Niall Crosby <https://github.com/ag-grid/>
import { AgPickerField } from "./agPickerField";
import { ListOption, AgList } from "./agList";
import { IAgLabel } from './agAbstractLabel';
export declare class AgSelect extends AgPickerField<HTMLSelectElement, string> {
    static EVENT_ITEM_SELECTED: string;
    protected listComponent: AgList;
    private hideList;
    private popupService;
    constructor(config?: IAgLabel);
    init(): void;
    showPicker(): AgList;
    addOptions(options: ListOption[]): this;
    addOption(option: ListOption): this;
    setValue(value?: string | null, silent?: boolean, fromPicker?: boolean): this;
    protected destroy(): void;
}
