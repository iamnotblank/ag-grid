// Remount component when Fast Refresh is triggered
// @refresh reset

import classnames from 'classnames';
import { withPrefix } from 'gatsby';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { createAutomatedRowGrouping } from '../../../components/automated-examples/row-grouping';
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
        cursor: url(${hostPrefix}/images/cursor/automated-example-cursor.svg) 24 24, pointer !important;
    }
`;

function AutomatedRowGrouping() {
    const gridClassname = 'automated-row-grouping-grid';
    const splashClassname = styles.splash;
    const automatedScript = useRef(null);
    const splashEl = useRef(null);
    const [showSplash, setShowSplash] = useState(true);
    // NOTE: Needs to be a ref instead of useState, as it is passed into a plain JavaScript context
    const scriptEnabled = useRef(true);
    const [splashIsTransitioning, setSplashIsTransitioning] = useState(false);

    const onTryItOutClick = useCallback(() => {
        if (!automatedScript.current) {
            return;
        }

        setShowSplash(false);
        scriptEnabled.current = false;
        setSplashIsTransitioning(true);
        automatedScript.current.stop();
    }, []);

    const restartScript = () => {
        setShowSplash(true);
        scriptEnabled.current = true;
        automatedScript.current.start();
    };

    const onSplashClick = useCallback(() => {
        if (!showSplash) {
            restartScript();
        }
    }, [showSplash]);

    const scriptIsEnabled = () => {
        return scriptEnabled.current;
    };

    useEffect(() => {
        if (!splashEl.current) {
            return;
        }

        const transitionHandler = (event) => {
            if (event.target !== splashEl.current) {
                return;
            }

            setSplashIsTransitioning(false);
        };

        splashEl.current.addEventListener('transitionend', transitionHandler);

        return () => {
            splashEl.current.removeEventListener('transitionend', transitionHandler);
        };
    }, []);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const isDebug = searchParams.get('debug') === 'true';
        const isCI = searchParams.get('isCI') === 'true';
        const runOnce = searchParams.get('runOnce') === 'true';

        let params = {
            gridClassname,
            mouseMaskClassname: styles.mouseMask,
            scriptIsEnabled,
            debug: isDebug,
            debugCanvasClassname: styles.debugCanvas,
            debugPanelClassname: styles.debugPanel,
            suppressUpdates: isCI,
            useStaticData: isCI,
            runOnce,
        };

        automatedScript.current = createAutomatedRowGrouping(params);
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
                    [styles.hide]: !showSplash,
                    [styles.hiding]: splashIsTransitioning,
                })}
                onClick={onSplashClick}
                aria-hidden="true"
                ref={splashEl}
            >
                <div className={classnames(styles.contents, 'font-size-large')}>
                    <div className={styles.contentsInner}>
                        <h2 className="font-size-massive">
                            Feature Packed,
                            <br />
                            Incredible Performance
                        </h2>

                        <p>
                            All the features your users expect and more. Out of the box performance that can handle any
                            data you can throw&nbsp;at&nbsp;it.
                        </p>

                        <button className={styles.exploreExampleButton} onClick={onTryItOutClick}>
                            Explore this example <Icon name="sidePanelOpen" />
                        </button>

                        <a className={styles.getStartedLink} href={withPrefix('/documentation/')}>
                            Get Started with AG Grid <Icon name="chevronRight" />
                        </a>
                    </div>

                    <div className={styles.openPanelIndicator}>
                        <Icon name="sidePanelClose" />
                        <span>See details</span>
                    </div>
                </div>
                <div className={styles.exampleClickTarget} aria-hidden="true"></div>
                <div className={styles.splashTrapeziumBackground}></div>
            </div>
        </>
    );
}

export default AutomatedRowGrouping;
