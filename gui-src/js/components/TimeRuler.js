import React from "react";
import { dateManipulation } from '../util';
var { getProperty, setProperty, resetLower } = dateManipulation;

export default class TimeRuler extends React.Component {
  propTypes: {
		leftPosition:  React.PropTypes.number.required,
		//leftDate:      React.PropTypes.instanceOf(Date).required,
		rightPosition: React.PropTypes.number.required,
		//rightDate:     React.PropTypes.instanceOf(Date).required
	}

  render() {
    var { leftDate, rightDate, leftPosition, rightPosition } = this.props;
    var duration = rightDate - leftDate;
    var width = rightPosition - leftPosition;
    
    leftDate = new Date(leftDate);
    rightDate = new Date(rightDate);
    
    if(duration > 1000*60*60*24*31*2) // longer than 2 months
    {
      var align = 'Month';
      var interval = 1;
      var divisions = 4;
    }
    else if(duration > 1000*60*60*48)    // longer than 2 days
    {
      var align = 'Days';
      var interval = 1;
      var divisions = 4;
    }
    else if(duration > 1000*60*60*12)    // longer than 12 hours
    {
      var align = 'Hours';
      var interval = 4;
      var divisions = 4;
    }
    else if(duration > 1000*60*60*2) // longer than 2 hours
    {
      var align = 'Hours';
      var interval = 1;
      var divisions = 6;
    }
    else if(duration > 1000*60*30) // longer than half an hour
    {
      var align = 'Minutes';
      var interval = 15;
      var divisions = 3;
    }
    else
    {
      var align = 'Minutes';
      var interval = 5;
      var divisions = 5;
    }
    
    var format = function format(date) //FIXME: should be something smarter that depends on current date and duration
    {
      return date.getHours() + ':' + date.getMinutes();
    }
    
    console.log(align, interval, divisions);
    
    var beginDate = resetLower(leftDate, align); //FIXME: should reset next higher unit instead
    var checkDate = beginDate;
    while(checkDate <= leftDate)
    {
      beginDate = new Date(checkDate);
      setProperty(checkDate, getProperty(checkDate, align)+interval, align);
    }
    
    console.log(beginDate);
    
    var lines = [];
    var text = [];
    for(var currentDate = new Date(beginDate);
        currentDate <= rightDate;) 
    {
      var nextDate = new Date(currentDate);
      setProperty(nextDate, getProperty(nextDate, align) + interval, align);
      //FIXME: should re-align whenever the next higher unit changes
      
      //draw main line
      var relPosition = (currentDate - leftDate)/duration;
      var position = relPosition*width + leftPosition;
      lines.push(<polyline key={currentDate} points={ position + ',0 ' + position + ',10'} />);
      
      //draw text
      var content = format(currentDate);
      var anchor = relPosition < 0.2 ? 'start' : (relPosition > 0.8 ? 'end' : 'middle');
      text.push(<text key={currentDate} x={position} y={20} style={{ fontSize: '10px', textAnchor: anchor, stroke: 'none' }}><tspan>{ content }</tspan></text>);
      
      //draw divisions
      var nextPosition = (nextDate - leftDate)/duration*width + leftPosition;
      var step = (nextPosition - position) / divisions;
      for(var i = 1; i < divisions; i++)
      {
        var subPosition = position + step*i;
        if(subPosition <= rightPosition)
          lines.push(<polyline key={currentDate + '_' + i} points={ subPosition + ',0 ' + subPosition + ',5'} />);
      }
      
      currentDate = nextDate;
    }
    
    return (
      <g style={{ stroke: 'black', strokeWidth: 1 }} transform={this.props.transform}>
        { lines }
        { text }
      </g>
    );
  }
}

TimeRuler.defaultProps =
{
  leftPosition: 0,
  rightPosition: 100
};
