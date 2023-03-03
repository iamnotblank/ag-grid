import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { AgChart, AgChartOptions } from 'ag-charts-community';
import {
    waitForChartStability,
    setupMockCanvas,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    extractImageData,
    IMAGE_SNAPSHOT_DEFAULTS,
} from 'ag-charts-community/src/chart/test/utils';

expect.extend({ toMatchImageSnapshot });

describe('Chart', () => {
    let chart: any;
    const ctx = setupMockCanvas();

    beforeEach(() => {
        console.warn = jest.fn();
    });

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        expect(console.warn).not.toBeCalled();
    });

    const EXAMPLE_OPTIONS: AgChartOptions = {
        data: [
            { x: 0, y: 0 },
            { x: 1, y: 50 },
            { x: 2, y: 25 },
            { x: 3, y: 75 },
        ],
        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    };

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        (expect(imageData) as any).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    it(`should render placeholder chart as expected`, async () => {
        const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
        options.autoSize = false;
        options.width = CANVAS_WIDTH;
        options.height = CANVAS_HEIGHT;

        chart = AgChart.create(options);
        await compare();
    });
});
