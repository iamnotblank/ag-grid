// Remount component when Fast Refresh is triggered
// @refresh reset

import classnames from 'classnames';
import { withPrefix } from 'gatsby';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { isElementChildOfClass } from '../../../components/automated-examples/lib/dom';
import { initAutomatedRowGrouping } from '../../../components/automated-examples/row-grouping';
import { Icon } from '../../../components/Icon';
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
    const gridClassname = 'automated-row-grouping-grid';
    const splashClassname = styles.splash;
    const automatedScript = useRef(null);
    const [hideSplash, setHideSplash] = useState(false);
    const onTryItOutClick = useCallback(() => {
        if (!automatedScript.current) {
            return;
        }

        setHideSplash(true);
        automatedScript.current.stop();
    }, []);
    const onSplashClick = useCallback(() => {
        if (hideSplash) {
            setHideSplash(false);
            automatedScript.current.start();
        }
    }, [hideSplash]);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const isDebug = searchParams.get('debug') === 'true';
        const isCI = searchParams.get('isCI') === 'true';
        const runOnce = searchParams.get('runOnce') === 'true';

        const gridIsHoveredOver = (element) => {
            const isInGrid = isElementChildOfClass({
                element,
                classname: gridClassname,
            });
            const isOnSplash = isElementChildOfClass({
                element,
                classname: splashClassname,
            });

            return isInGrid || isOnSplash;
        };
        let params = {
            selector: `.${gridClassname}`,
            mouseMaskSelector: styles.mouseMask,
            mouseCaptureMaskSelector: styles.mouseCaptureMask,
            gridIsHoveredOver,
            onMovedOffGrid() {
                setHideSplash(false);
                automatedScript.current.start();
            },
            debug: isDebug,
            debugCanvasClassname: styles.debugCanvas,
            debugPanelClassname: styles.debugPanel,
            suppressUpdates: isCI,
            useStaticData: isCI,
            runOnce,
        };

        automatedScript.current = initAutomatedRowGrouping(params);
    }, []);

    return (
        <>
            <Helmet>
                {helmet.map((entry) => entry)}
                <style>{mouseStyles}</style>
            </Helmet>
            <div style={{ height: '100%', width: '100%' }} className="automated-row-grouping-grid ag-theme-alpine-dark">
                <LogoMark isSpinning />
            </div>
            <div
                className={classnames({
                    [splashClassname]: true,
                    [styles.hide]: hideSplash,
                })}
                onClick={onSplashClick}
                aria-hidden="true"
            >
                <div className={classnames(styles.contents, 'font-size-extra-large')}>
                    <h2 className="font-size-gigantic">
                        Feature Packed,
                        <br />
                        Incredible Performance
                    </h2>

                    <p>
                        All the features your users expect and more. Out of the box performance that can handle any data
                        you can throw at it.
                    </p>

                    <button className={styles.tryItOutButton} onClick={onTryItOutClick}>
                        Try For Yourself <Icon name="cursor" />
                    </button>

                    <a className={styles.getStartedLink} href={withPrefix('/documentation/')}>
                        Get Started with AG Grid <Icon name="chevronRight" />
                    </a>
                </div>
                <div className={styles.splashTrapeziumBackground}></div>
            </div>
        </>
    );
}

export default AutomatedRowGrouping;
