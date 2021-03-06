import express from 'express';
import morgan from 'morgan';
import { renderToStaticMarkup } from 'react-dom-stream/server';
import { watchIndex, watchClient } from './application';
import { loadConfig } from './configuration';
import { match } from 'react-router';
import { createStore } from './store';
import { createRoutes } from './routing';
import ServerContainer from './containers/server';

function serveStatic(server, config) {
  if (!config.express.serveStatic) return;
  server.use(express.static(config.app.assetPath));
}

function serveClient(server, config) {
  server.get('/assets/javascripts/client.dist.js', function (request, response) {
    response.sendFile(config.app.tmpPath + '/client.dist.js');
  });
}

function renderPage(dependencyContainer, config) {
  return function (request, response) {
    const { app } = dependencyContainer;
    const store = createStore();

    match({ routes: createRoutes({ app, store }), location: request.url }, (error, redirectLocation, renderProps) => {
      if (redirectLocation) {
        response.redirect(redirectLocation.pathname + redirectLocation.search);
      } else if (error) {
        console.log('error:', error);
        console.log('redirectLocation:', redirectLocation);
        response.status(500).send(error.message);
      } else if (!renderProps) {
        console.log('no route matched');
        response.status(404).send('Not found');
      } else {
        response.write('<!DOCTYPE html>');
        renderToStaticMarkup(ServerContainer({ app, config, store, renderProps })).pipe(response);
      }
    });
  };
}

function createServer(dependencyContainer, config) {
  const server = express();
  server.use(morgan('dev'));
  serveStatic(server, config);
  serveClient(server, config);
  server.use(renderPage(dependencyContainer, config));
  return server;
}

export function run({ env }) {
  const config = loadConfig(env);
  let dependencyContainer = {};
  console.log('');
  console.log('It all started when they descended to the Piraeus...');

  function onFirstBuildFinish(app) {
    dependencyContainer.app = app;
    createServer(dependencyContainer, config).listen(config.port, function () {
      console.log(`on port ${config.port}`);
      console.log('');
    });
  }

  function onBuildFinish(app) {
    dependencyContainer.app = app;
    console.log('reload');
    console.log('');
  }

  function onClientBuildFinish(clientPath) {
    console.log('client reload');
    console.log('');
  }

  watchIndex({ config, onFirstBuildFinish, onBuildFinish });
  watchClient({ config, onBuildFinish: onClientBuildFinish });
}
