import React from "react";
import Item from "./TaskListItem";

export default class TaskList extends React.Component {
  constructor(props) {
    super(props);
  }
  
  render() {
    return (
      <ul className="task-list">
        {
          Object.keys(this.props.data.tasks).map((key) =>
          {
            var task = this.props.data.tasks[key];
            return ( <li onClick={(event) =>
              {
                if(typeof this.props.onSelect == 'function')
                  return this.props.onSelect(event, { key, task });
              }}><Item taskKey={key} task={task} data={this.props.data} /></li> );
          })
        }
        <li style={{ height: '500px' }} onClick={(event) =>
        {
          if(typeof this.props.onSelect == 'function')
            return this.props.onSelect(event, { null });
        }}> abwaehlen </li>
      </ul>
    );
  }
}
