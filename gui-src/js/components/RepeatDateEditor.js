import React from "react";

var unitInfo =
{
  'Minute': { singular: 'minute', plural: 'minutes', values: [1, 2, 3, 4, 5, 6, 10, 15, 20, 30, 60], max: 60 },
  'Hour':   { singular: 'hour',   plural: 'hours',   values: [1, 2, 3, 4, 6, 8, 12, 24], max: 24 }
};

export default class RepeatDateEditor extends React.Component {
  constructor(props)
  {
    super(props);
    
    this.state =
    {
      unit: props.unit,
      interval: props.interval
    };
    
    this.onIntervalChange = this.onIntervalChange.bind(this);
    this.onUnitChange = this.onUnitChange.bind(this);
  }
  
  onIntervalChange(event, info)
  {
    if(!info)
      info = unitInfo[this.state.unit];
    var newInterval = parseInt(event.target.value);
    
    console.log(newInterval, info);
    if(info.values.indexOf(newInterval) != -1)
    {}
    else if(newInterval > this.state.interval)
    {
      newInterval = info.values.reduce((x, v) => v >= newInterval && v < x ? v : x, info.max);
    }
    else if(newInterval <= this.state.interval)
    {
      newInterval = info.values.reduce((x, v) => v <= newInterval && v > x ? v : x, 1);
    }
    this.setState({ interval: newInterval });
  }
  
  onUnitChange(event)
  {
    this.onIntervalChange({ target: { value: this.state.interval }}, unitInfo[event.target.value]);
    this.setState({ unit: event.target.value });
  }
  
  render() {
    var info = unitInfo[this.state.unit];
    
    return (
      <div>
        Every <input type="number" step={1} min={1} max={info.max} value={this.state.interval} onChange={this.onIntervalChange} />
              <select onChange={this.onUnitChange}>
              {
                this.props.availableUnits.map((name) =>
                {
                  var info = unitInfo[name];
                  return (
                    <option
                      selected={name == this.state.unit}
                      value={name}
                      key={name}>
                      {
                        this.state.interval > 1 ? info.plural : info.singular
                      }
                    </option>
                  );
                })
              }
              </select>
      </div>
    );
  }
}

RepeatDateEditor.defaultProps =
{
  unit: 'Minute',
  interval: 1,
  availableUnits: ['Minute', 'Hour']
};
