import React from "react";
import TimePie from "./components/TimePie";
import TimeBar from "./components/TimeBar";
import TaskList from "./components/TaskList";
import SVGDefs from "./components/SVGDefs";
import { updateModel } from './model';
import model from './model';
import RepeatDateEditor from './components/RepeatDateEditor';

import commands from '../../commands/index';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state =
    {
      applicationSelection: [],
      sliceSelection: []
    };
    this.onTaskSelect = this.onTaskSelect.bind(this);
    this.onApplicationSelect = this.onApplicationSelect.bind(this);
    this.onSliceSelect = this.onSliceSelect.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onUndo = this.onUndo.bind(this);
    this.onRedo = this.onRedo.bind(this);
    
    this.stack = new commands.Group([]);
  }
  
  onTaskSelect(event, item)
  {/*
    var changes = { timeSlices: {}};
    this.state.sliceSelection.forEach((i) =>
    {
      changes.timeSlices[i] = { task: { $set: item.key } };
    });
    console.log(changes);
    updateModel(changes);
    */
    var group = new commands.Group(this.state.sliceSelection.map((i) => new commands.Assign(i, item.key)));
    this.stack.add(group);
    this.stack.guiDo(this.props.data, updateModel);
    console.log("Stack:", this.stack);
  }
  
  onApplicationSelect(event, item)
  {
    this.setState(
    {
      sliceSelection: this.props.data.timeSlices.map((slice, i) =>
      {
        if('' + item.key == '' + slice.application)
          return slice.id;
      }).filter((index) => typeof index != 'undefined'),
      applicationSelection: [item.key]
    });
  }
  
  onSliceSelect(event, item)
  {
    this.setState(
    {
      sliceSelection: [ item.id ],
      applicationSelection: []
    });
  }
  
  onSave(event)
  {
  }
  
  onUndo(event)
  {
    this.stack.guiUndo(this.props.data, updateModel, 1);
  }
  
  onRedo(event)
  {
    this.stack.guiDo(this.props.data, updateModel, 1);
  }
  
  render() {
    return (
    <div>
      <SVGDefs />
      <RepeatDateEditor />
      <button onClick={ this.onUndo }>Undo</button><button onClick={ this.onRedo }>Redo</button>
      <TimePie
        data={ this.props.data }
        applicationSelection={ this.state.applicationSelection }
        onSelect={this.onApplicationSelect}
      />
      <TimeBar
        data={ this.props.data }
        sliceSelection={ this.state.sliceSelection }
        onSelect={this.onSliceSelect}
      />
      <TaskList data={ this.props.data } onSelect={ this.onTaskSelect } />
      <button onClick={ this.onSave }>Save</button>
    </div>
    );
  }
}
