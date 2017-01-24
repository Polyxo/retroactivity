import React from "react";
import TimePie from "./components/TimePie";
import TimeBar from "./components/TimeBar";
import TaskList from "./components/TaskList";
import SVGDefs from "./components/SVGDefs";
import { updateModel } from './model';
import model from './model';

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
  }
  
  onTaskSelect(event, item)
  {
    var changes = { timeSlices: {}};
    this.state.sliceSelection.forEach((i) =>
    {
      changes.timeSlices[i] = { task: { $set: item.key } };
    });
    console.log(changes);
    updateModel(changes);
  }
  
  onApplicationSelect(event, item)
  {
    this.setState(
    {
      sliceSelection: this.props.data.timeSlices.map((slice, i) =>
      {
        if('' + item.key == '' + slice.application)
          return i;
      }).filter((index) => typeof index != 'undefined'),
      applicationSelection: [item.key]
    });
  }
  
  onSliceSelect(event, item)
  {
    this.setState(
    {
      sliceSelection: [ item.key ],
      applicationSelection: []
    });
  }
  
  render() {
    return (
    <div>
      <SVGDefs />
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
    </div>
    );
  }
}
