import React from 'react';
import { Route, IndexRoute } from 'react-router';

export default (
  <Route path="/">
    <IndexRoute component={(props) => <div>Hello World</div>} />
    <Route path="test" component={(props) => <div>Test</div>} />
  </Route>
);