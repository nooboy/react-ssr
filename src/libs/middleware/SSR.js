import {matchPath, StaticRouter} from "react-router-dom";
import logger from "../logger"
import routes from "../../configuration/routes.config"
import React from "react"
import {renderToStaticMarkup} from 'react-dom/server'
import App from "../../components/App"
import StateWrapper from "../../components/common/StateWrapper"
import html from "../html"

export default async function (req, res, next) {
    if (req.method === "GET") {
        const route = routes.find(f => {
            return matchPath(req.url, {
                path: f.path,
                exact: true,
                strict: false
            });
        });
        if (route) {
            logger.info(`${req.url} is matched`);
            let initialState = null;
            const fetchInitialState = route.component.fetchInitialState;
            if (fetchInitialState) {
                if (typeof(fetchInitialState) !== "function") {
                    throw new Error('route handler must be a Function');
                }
                initialState = await fetchInitialState();
                logger.info(`initial state : ${JSON.stringify(initialState)}`);
            }
            const context = {};
            const markup = renderToStaticMarkup(
                <StaticRouter
                    location={req.url}
                    context={context}>
                    <StateWrapper state={initialState}>
                        <App/>
                    </StateWrapper>
                </StaticRouter>
            );
            const content = html.getHtml().replace('#MARKUP#', markup);
            res.send(content);
        }
        else {
            logger.warn(`${req.url} is not matched`);
        }
    }
    next();
}