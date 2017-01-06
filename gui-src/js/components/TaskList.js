import React from "react";

export default class TaskList extends React.Component {
  constructor(props) {
    super(props);
  }
  
  render() {
    return (
      <ul>
        {
          Object.keys(this.props.data.tasks).map((key) =>
          {
            var task = this.props.data.tasks[key];
            return ( <li onClick={(event) =>
              {
                if(typeof this.props.onSelect == 'function')
                  return this.props.onSelect(event, { key, task });
              }}>{ task.name }</li> );
          })
        }
        <li onClick={(event) =>
        {
          if(typeof this.props.onSelect == 'function')
            return this.props.onSelect(event, { null });
        }}> abwaehlen </li>
      </ul>
    );
  }
}
