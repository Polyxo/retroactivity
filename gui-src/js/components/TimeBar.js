import React from "react";
import TimeRuler from './TimeRuler';
import { updateModel } from '../model';
import model from '../model';

export default class TimeBar extends React.Component {
  render() {
    var timeSlices = this.props.data.timeSlices;
    var summary =
    {
      total: timeSlices[timeSlices.length - 1].end- timeSlices[0].begin
    };
    
    var sum = 0;
    summary.blocks = timeSlices.map((slice, i) =>
    {
      var duration = slice.end - slice.begin;
      var res =
      {
        key: i,
        duration,
        x: sum / summary.total * 500,
        width: duration / summary.total * 500,
        selected: this.props.sliceSelection ? this.props.sliceSelection.includes(i) : false,
        ...slice,
        application: this.props.data.applications[slice.application],
        task: this.props.data.tasks[slice.task],
      };
      sum += duration;
      return res;
    });
    
    var blocks = summary.blocks
      .sort((a,b) => a.selected ? (b.selected ? 0: 1) : -1)
      .map((item) =>
      (
        <rect
          x={item.x}
          width={item.width}
          y={50}
          height={80}
          style=
          {{
            fill: item.application.color,
            stroke: item.selected ? 'black' : 'white',
            strokeWidth: item.selected ? 1 : 0
          }}
          onClick={ (event) =>
          {
            if(typeof this.props.onSelect == 'function')
              return this.props.onSelect(event, item);
          }}
        ><title>{item.application.programName}</title></rect>
      ));
    
    var taskBlocks = summary.blocks
      .map((item, i) =>
      (
        item.task ?
        <rect
          x={item.x}
          width={item.width}
          y={10}
          height={15}
          style={{
                fill: 'url(#pattern_' + item.task.selection + ')'
              }}
        /> : null
      ));
    
    var icons = summary.blocks.map((item, i) =>
      (
        item.width > 50 ?
          <image
          key={item.application.programName + '_' + i}
          xlinkHref={item.application.logo}
          x={item.x + 0.5*item.width - 15}
          y={50 + 80/2 - 15}
          height={30}
          width={30}
          onClick={ (event) =>
          {
            if(typeof this.props.onSelect == 'function')
              return this.props.onSelect(event, item);
          }}
        /> : null
      ));
    
    return (
      <svg width="520" height="250" viewBox="-10 0 510 250">
        { blocks }{ icons }{ taskBlocks }
        <TimeRuler transform="translate(0, 150)" leftPosition={0} rightPosition={500} leftDate={timeSlices[0].begin} rightDate={timeSlices[timeSlices.length - 1].end} />
      </svg>
    );
  }
}
