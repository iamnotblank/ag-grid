// Remount component when Fast Refresh is triggered
// @refresh reset

import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { initAutomatedRowGrouping } from '../../../components/automated-examples/row-grouping';
import LogoMark from '../../../components/LogoMark';
import { hostPrefix, isProductionBuild, localPrefix } from '../../../utils/consts';
import styles from './AutomatedRowGrouping.module.scss';

const helmet = [];
if (!isProductionBuild()) {
    helmet.push(
        <link
            key="hero-grid-theme"
            rel="stylesheet"
            href={`${localPrefix}/@ag-grid-community/styles/ag-theme-alpine.css`}
            crossOrigin="anonymous"
            type="text/css"
        />
    );
    helmet.push(
        <script
            key="enterprise-lib"
            src={`${localPrefix}/@ag-grid-enterprise/all-modules/dist/ag-grid-enterprise.js`}
            type="text/javascript"
        />
    );
} else {
    helmet.push(
        <script
            key="enterprise-lib"
            src="https://cdn.jsdelivr.net/npm/ag-grid-enterprise/dist/ag-grid-enterprise.min.js"
            type="text/javascript"
        />
    );
}

const mouseStyles = `
    .automated-row-grouping-grid .ag-root-wrapper,
    .automated-row-grouping-grid .ag-root-wrapper * {
        cursor: url(${hostPrefix}/images/cursor/automated-example-cursor.svg) 14 14, pointer !important;
    }
`;

function AutomatedRowGrouping() {
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const isDebug = searchParams.get('debug') === 'true';
        const isCI = searchParams.get('isCI') === 'true';
        const runOnce = searchParams.get('runOnce') === 'true';

        let params = {
            selector: '.automated-row-grouping-grid',
            mouseMaskSelector: styles.mouseMask,
            debug: isDebug,
            debugCanvasClassname: styles.debugCanvas,
            debugPanelClassname: styles.debugPanel,
            suppressUpdates: isCI,
            useStaticData: isCI,
            runOnce,
        };

        initAutomatedRowGrouping(params);
    }, []);

    return (
        <>
            <Helmet>
                <script src="https://code.createjs.com/1.0.0/tweenjs.min.js"></script>
                {helmet.map((entry) => entry)}

                <style>{mouseStyles}</style>
            </Helmet>
            <div style={{ height: '100%', width: '100%' }} className="automated-row-grouping-grid ag-theme-alpine-dark">
                <LogoMark isSpinning />
            </div>
        </>
    );
}

export default AutomatedRowGrouping;
