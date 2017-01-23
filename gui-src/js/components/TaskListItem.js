import React from "react";

function formatDuration(duration)
{
  if(duration == 0)
    return '';
  
  var unitNames = [ 'ms', 's', 'm', 'h', 'd' ];
  var unitDividers = [ 1000, 60,  60,  24 ];
  
  for(var i = 0; i < 4 && duration > unitDividers[i]; i++)
  {
    duration /= unitDividers[i];
  }
  
  return Math.round(duration) + ' ' + unitNames[i];
}

export default class TaskListItem extends React.Component
{
  constructor(props) {
    super(props);
  }
  
  render() {
    console.log("Looking for", this.props.taskKey);
    var totalDuration = this.props.data.timeSlices.reduce((duration, slice) => duration + slice.end - slice.begin, 0);
    var slices = this.props.data.timeSlices.filter(slice => ''+slice.task == this.props.taskKey);
    var duration = slices.reduce((duration, slice) => duration + slice.end - slice.begin, 0);
    var taskDurations = {};
    slices.forEach(slice =>
    {
      if(typeof taskDurations[slice.application] == 'undefined')
        taskDurations[slice.application] = 0;
      taskDurations[slice.application] += slice.end - slice.begin;
    });
    console.log(taskDurations);
    
    return (
       <div className={'task-list-item' + (duration > 0 ? ' pattern_' + this.props.task.selection + '_fill' : '')}>
         <span className="task-name">{ this.props.task.name }</span>
         <span className="task-duration">{ formatDuration(duration) }</span>
         <div className="application-blocks">
           {
             Object.keys(taskDurations).map(key =>
             {
               var duration = taskDurations[key];
               var application = this.props.data.applications[key];
               return (
               <div
                   key={key}
                   className="application-block"
                   style=
                   {{
                     backgroundColor: application.color,
                     width: (duration / totalDuration * 50)+'%'
                   }}
                   title={application.programName}
               />);
             })
           }
         </div>
       </div>
    );
  }
}
