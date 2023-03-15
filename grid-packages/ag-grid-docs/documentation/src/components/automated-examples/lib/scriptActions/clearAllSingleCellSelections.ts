import { AG_CELL_RANGE_SINGLE_CELL_CLASSNAME } from '../constants';

export function clearAllSingleCellSelections() {
    const focusedCells = document.querySelectorAll(`.${AG_CELL_RANGE_SINGLE_CELL_CLASSNAME}`);
    focusedCells.forEach((cell) => {
        cell.classList.remove(AG_CELL_RANGE_SINGLE_CELL_CLASSNAME);
    });
}
