import React from "react";
import { Wedge } from "./PieChart";
import { dateManipulation, arrayToURL } from '../util';

const turns2radians = 2 * Math.PI;



export default class TimePie extends React.Component {
  render() {
    var summary =
    {
      total: 0,
			wedges:
			{
			}
    }
    
    this.props.data.timeSlices.forEach((slice) =>
    {
      var duration = slice.end - slice.begin;
      summary.total += duration;
      if(summary.wedges[slice.application])
      {
        summary.wedges[slice.application].duration += duration;
      }
      else
      {
        var application = this.props.data.applications[slice.application];
        
        summary.wedges[slice.application] =
        {
          key: slice.application,
          duration: duration,
          application: slice.application,
          tasks: {}
        };
      }
      
      var wedge = summary.wedges[slice.application];
      if(wedge.tasks[slice.task])
      {
        wedge.tasks[slice.task].duration += duration;
      }
      else
      {
        wedge.tasks[slice.task] =
        {
          key: slice.task,
          duration: duration,
          task: slice.task
        };
      }
    });
    
    var sum = 0;
    summary.wedges = Object.keys(summary.wedges)
      .map((applicationKey) => summary.wedges[applicationKey])
      .sort((a, b) => a.duration - b.duration)
      .map((item) =>
      {
        var application = this.props.data.applications[item.application];
        var res =
        {
          beginAngle: sum / summary.total,
          sizeAngle: item.duration / summary.total,
          midAngle: (sum + 0.5*item.duration) / summary.total,
          selected: this.props.applicationSelection ? this.props.applicationSelection.includes(item.key) : false,
          ...item,
          application
        };
        sum += item.duration;
        return res;
      });
    
    sum = 0;
    summary.taskWedges = summary.wedges
      .reduce((res, wedge) => //Flatten list of tasks
      {
        return res.concat(Object.keys(wedge.tasks)
          .map((task) => wedge.tasks[task]));
      }, [])
      .reduce((res, task) => //Join equal tasks
      {
        if(res.length == 0)
          return [ task ];
        
        var last = res[res.length-1];
        if(last.task == task.task)
        {
          last.duration += task.duration;
          return res;
        }
        
        return res.concat(task);
      }, [])
      .map((item) =>
      {
        var task = this.props.data.tasks[item.task];
        var res =
        {
          beginAngle: sum / summary.total,
          sizeAngle: item.duration / summary.total,
          midAngle: (sum + 0.5*item.duration) / summary.total,
          ...item,
          task
        };
        sum += item.duration;
        return res;
      });
    
    console.log(summary);
    
    var wedges = summary.wedges
      .sort((a,b) => a.selected ? (b.selected ? 0: 1) : -1)
      .map((item) =>
      {
        return (
          <Wedge
              key={item.application.programName}
          		beginRadius={60}
          		beginAngle={item.beginAngle}
          		sizeAngle={item.sizeAngle}
          		style={{
                fill: item.application.color,
                stroke: item.selected ? 'black' : 'white',
                strokeWidth: 2
              }}
              onClick={ (event) =>
              {
                if(typeof this.props.onSelect == 'function')
                  return this.props.onSelect(event, item);
              }}
            ><title>{item.application.programName}</title></Wedge>
        );
      });
      
    var icons = summary.wedges.map((item) =>
    {
      return ( 
        <image
          key={item.application.programName}
          xlinkHref={arrayToURL(item.application.icon)}
          x={Math.cos(item.midAngle * turns2radians) * 40 - 10}
          y={Math.sin(item.midAngle * turns2radians) * 40 - 10}
          height={20}
          width={20}
          onClick={ (event) =>
          {
            if(typeof this.props.onSelect == 'function')
              return this.props.onSelect(event, item);
          }}
        />
      );
    });
    
    var taskWedges = summary.taskWedges.map((item, i) =>
    {
      return (
        item.task ?
          <Wedge
            key={item.task.name + '_' + i}
            beginRadius={72}
            width={10}
            beginAngle={item.beginAngle}
          	sizeAngle={item.sizeAngle}
          	style={{
                fill: 'url(#pattern_' + item.task.selection + ')',
                stroke: 'white',
                strokeWidth: 2
              }}
          /> : null
       );
    });

    var descriptions = summary.wedges.map((item) =>
    {
      var props =
      {
        x: Math.cos(item.midAngle * turns2radians) * 80,
        y: Math.sin(item.midAngle * turns2radians) * 80,
      };
      
      if(Math.abs(props.y) > 50)
        props.y *= 1.15;
      
      return ( 
        <text
          key={item.application.programName}
          { ...props }
          style={{
            fontSize: '10px',
            textAnchor: Math.abs(props.y) > 50 ? 'middle' : (props.x > 0 ? 'start' : 'end')
          }}
        >
          <tspan { ...props}>{ item.application.programName }</tspan>
          <tspan { ...props} dy="12">{ dateManipulation.formatDuration(item.duration) }</tspan>
        </text>
      );
    });
    return (
      <svg width="320" height="320" viewBox="-160 -160 320 320">
    		{wedges}
    		{ taskWedges }
    		{ icons }
    		{ descriptions }
  		</svg>
    );
  }
}
