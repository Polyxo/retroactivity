import App from "./App";
import React from "react";
import ReactDOM from "react-dom";

import css from '../scss/style.scss';

const app = document.getElementById('app');

import model from './model';
import { onUpdateModel } from './model';

onUpdateModel((model) =>
{
  console.log(model);
  ReactDOM.render(
    <App data={ model }/>
  , app);
});

ReactDOM.render(
  <App data={ model }/>
, app);
