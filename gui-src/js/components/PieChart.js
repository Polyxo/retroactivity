import React from "react";
var PropTypes = React.PropTypes;

const turns2radians = 2 * Math.PI;
const turns2degrees = 360;

function mapRange(x, sourceLow, sourceHigh, targetLow, targetHigh) {
	return (x - sourceLow) / (sourceHigh - sourceLow) * (targetHigh - targetLow) + targetLow;
}

export class Wedge extends React.Component {
	propTypes: {
		beginAngle:  React.PropTypes.number.required, // clockwise turns beginning at the top
		sizeAngle:   React.PropTypes.number.required, // clockwise turns beginning beginAngle
		beginRadius: React.PropTypes.number.required, // distance of outer beginning point from center
		endRadius:   React.PropTypes.number, // if not specified, equal to beginRadius
		width:       React.PropTypes.number, // width of the ring, wedge if not specified
	}
	
	constructPath(beginAngle, beginRadius, endAngle, endRadius, omitBegin) {
		var path = [];
		if(!omitBegin)
			path.push(['M', Math.cos(beginAngle * turns2radians) * beginRadius,
			               Math.sin(beginAngle * turns2radians) * beginRadius]);
		
		path.push(['A', beginRadius, endRadius,
		                beginAngle * turns2degrees,
		                0, beginAngle < endAngle ? 1 : 0,
		                Math.cos(endAngle * turns2radians) * endRadius,
		                Math.sin(endAngle * turns2radians) * endRadius]);
		
		return path;
	}
	
	constructRing(beginAngle, sizeAngle, beginRadius, endRadius, width) {
		var firstArc = true;
	  var innerPath = [];
	  var outerPath = [];
	  var currentEndAngle = beginAngle;
	  var endAngle = beginAngle + sizeAngle;
	  var currentEndRadius = beginRadius;
	  
	  while(currentEndAngle < endAngle) {
	    var currentBeginAngle = currentEndAngle;
	    currentEndAngle = Math.min(currentEndAngle + 0.25, endAngle);
	    var currentBeginRadius = currentEndRadius;
	    //currentEndRadius = mapRange(currentEndAngle, beginAngle, endAngle, beginRadius, endRadius); FIXME
	    var lastArc = currentEndAngle == endAngle;
	    
			innerPath = innerPath.concat(this.constructPath(currentBeginAngle, currentBeginRadius - width, currentEndAngle, currentEndRadius - width, !firstArc));
			outerPath = this.constructPath(currentEndAngle, currentEndRadius, currentBeginAngle, currentBeginRadius, !lastArc).concat(outerPath);
			
			firstArc = false;
		}
		outerPath[0][0] = 'L';
		
		var path = innerPath.concat(outerPath);
		path.push(['Z']);
		
		return path;
	}
	
	constructWedge(beginAngle, sizeAngle, beginRadius, endRadius) {
		var firstArc = true;
	  var path = [ ['M', 0, 0] ];
	  var currentEndAngle = beginAngle;
	  var endAngle = beginAngle + sizeAngle;
	  var currentEndRadius = beginRadius;
	  
	  while(currentEndAngle < endAngle) {
	    var currentBeginAngle = currentEndAngle;
	    currentEndAngle = Math.min(currentEndAngle + 0.25, endAngle);
	    var currentBeginRadius = currentEndRadius;
	    currentEndRadius = mapRange(currentEndAngle, beginAngle, endAngle, beginRadius, endRadius);
	    var lastArc = currentEndAngle == endAngle;
	    
			path = path.concat(this.constructPath(currentBeginAngle, currentBeginRadius, currentEndAngle, currentEndRadius, !firstArc));
			
			firstArc = false;
		}
		path[1][0] = 'L';
		path.push(['Z']);
		
		return path;
	}
	
	render() {
	  var { beginAngle, sizeAngle, beginRadius, width, endRadius, ...attributes } = this.props;
	  beginRadius = beginRadius || 0;
	  endRadius = endRadius || beginRadius;
	  
	  if(width === 0)
	  	var path = this.constructLine(beginAngle, sizeAngle, beginRadius, endRadius);
	 	else if(width > 0 || width < 0)
	  	var path = this.constructRing(beginAngle, sizeAngle, beginRadius, endRadius, width);
	 	else //width probably undefined
	 		var path = this.constructWedge(beginAngle, sizeAngle, beginRadius, endRadius);
		
		var pathString = path.reduce(function(a, b) { return a + ' ' + b.join(' '); }, '');
		
		return ( <path d={pathString} {...attributes} >{ this.props.children }</path> );
	}
}

/*
A pass is a helper component for the chart that will loop through the data items.
For each data itme it will perform two actions, if the corresponding props are given:
- Create a summary data structure by reducing the data array with the function getSummary and the initial value defaultSummary
The summary is chained between passes, it is simply extended with defaultSummary before the reduce step.
- Create child components by mapping the function item to the data array, passing the summary to it
These separate steps allow us to declaratively specify all calculations that are necessary
to create a chart. 
*/
export class Pass extends React.Component {
	propTypes: {
		getSummary: PropTypes.func,
		defaultSummary: PropTypes.object,
		item: PropTypes.node
	}
	
	render() {
		if (process.env.NODE_ENV !== 'production') {
      throw new Error('Component <Pass /> should never render');
    }
    return null;
	}
}

export class Chart extends React.Component {
	render() {
		var summary = {};
		var children = React.Children.map(this.props.children, function(pass) {
			if(pass.type !== Pass) return pass;
			
			if(typeof pass.props.defaultSummary !== 'undefined')
				summary = {...summary, ...pass.props.defaultSummary};
			if(typeof pass.props.getSummary !== 'undefined')
				summary = this.props.data.reduce(pass.props.getSummary, summary);
			
			if(typeof pass.props.item !== 'function') return undefined;
			
			return (
				<g>{
					this.props.data.map((item, index) => pass.props.item(item, index, summary))
				}</g>
			);
		}, this)
			.filter((child) => ( typeof child !== 'undefined' ));
		
		return ( <g>{ children }</g> );
	}
}

export default class PieChart extends React.Component {
	propTypes: {
		data: React.PropTypes.array.required,/*
		valueAccessor: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.func,
    ]),
		total:  React.PropTypes.oneOfType([
      React.PropTypes.number,
      React.PropTypes.func,
    ]),*/
    valueAccessor: React.PropTypes.func,
    total: React.PropTypes.func,
	}
	
	accessValue(item) {
	  console.log("access", this.props.valueAccessor, typeof this.props.valueAccessor);
		if(typeof this.props.valueAccessor == 'function')
		  return this.props.valueAccessor(item);
		else
			return item[this.props.valueAccessor];
	}
	
	getTotal() {
		if(typeof this.props.total == 'function')
			return this.props.total(this.props.data);
		else
			return this.props.total;
	}
  
  render() {
  	/*var self = this;
  	var total = this.getTotal();
  	var nextSum = 0;
  	var sum = 0;
  	var colors = ['#ff8000', '#00FF80', '#bb00bb', '#2020FF'];
  	var i = -1;
  	var wedges = this.props.data.map(function(item) {
  		i++;
  		var value = self.accessValue(item);
  		sum = nextSum;
  		console.log(sum, total);
  		nextSum = sum + value;
  		return (<Wedge beginAngle={sum / total} sizeAngle={value / total} beginRadius={20} endRadius={35} width={5} style={{fill: colors[i%colors.length]}} />);
  	});*/
  	
  	var colors = ['#ff8000', '#00FF80', '#bb00bb', '#2020FF'];
  	
  	return (
  		<svg width="80" height="80" viewBox="-40 -40 80 80"
  		><Chart
  			data={ this.props.data }
  			><Pass
						getSummary={ function(summary, item) {
							var sum = summary.total + item;
							return { total: sum, sums: summary.sums.concat(sum) };
						} }
						defaultSummary={ {
							total: 0,
							sums: [ 0 ]
						} }
					/><Pass
						item={ (item, index, summary) => ( <Wedge
							key={index}
							beginAngle={summary.sums[index] / summary.total}
							sizeAngle={item / summary.total}
							beginRadius={20}
							endRadius={35}
							width={5}
							style={{fill: colors[index%colors.length]}} /> ) }
					/></
				Chart></
			svg>
		);
  }
}

PieChart.defaultProps = {
  total: (data) => data.reduce((sum, item) => sum + item /*FIXME: has to use accessor*/, 0),
  valueAccessor: (item) => item
};
