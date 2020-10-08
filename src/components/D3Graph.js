import React from 'react'
import PropTypes from 'prop-types';
import ColorHash from "color-hash";

const hash = new ColorHash({lightness: [0.35, 0.5, 0.65]})

const hexToLuma = (colour) => {
  const hex = colour.replace(/#/, '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  return [
    0.299 * r,
    0.587 * g,
    0.114 * b
  ].reduce((a, b) => a + b) / 255;
};

const GraphNode = ({label, x, y, width, height, color}) => (
  <g transform={`translate(${y - width / 2}, ${x - height / 2})`}>
    <rect width={width} height={height} fill={color} rx={5} ry={5}/>
    <text x={width / 2} y={height / 2} fill={hexToLuma(color) > 0.5 ? "#222" : "#eee"}
          fontWeight='bold' fontFamily='sans-serif' textAnchor='middle' alignmentBaseline='middle'
    >{label}</text>
  </g>
)

const GraphGradient = ({source, target}) => (
  <linearGradient id={`${source.id}-${target.id}`} gradientUnits='userSpaceOnUse'
                  x1={source.y} x2={target.y}
                  y1={source.x} y2={target.y}>
    <stop offset='0%' stopColor={hash.hex(source.data.notebook.id)}/>
    <stop offset='100%' stopColor={hash.hex(target.data.notebook.id)}/>
  </linearGradient>
)

const GraphCurve = ({d, stroke}) => (
  <g>
    <path d={d} fill='none' strokeWidth={3} stroke={stroke}/>
  </g>
)

const nodeWidth = 68;
const nodeHeight = 26;

class D3Graph2 extends React.Component {

  static getDerivedStateFromProps(props) {
    // Convert to dag
    const dag = props.createDag(props.data);
    const {
      width = dag.size() * nodeHeight,
      height = dag.size() * nodeWidth
    } = props;

    // Compute the coordinates
    const layoutDag = props.layout.size([width, height])(dag);
    return {
      dag: layoutDag
    }
  }

  render() {

    if (!this.state.dag) return <></>;

    return (
      <>
        {/*Use link source and target to generate gradient definition.*/}
        <defs>
          {this.state.dag.links().map(({source, target}) => (
            <GraphGradient source={source} target={target}/>
          ))}
        </defs>
        {this.state.dag.links().map(({points, source, target}) => (
          <GraphCurve d={this.props.line(points)} stroke={`url(#${source.id}-${target.id})`}/>
        ))}
        {/*Render the nodes*/}
        {this.state.dag.descendants().map(node => (
          <GraphNode x={node.x} y={node.y}
                     color={hash.hex(node.data.notebook.id)}
                     width={nodeWidth} height={nodeHeight}
                     label={node.data.notebook.id.substring(0, 7)}
          />
        ))}
      </>
    );
  }
}

// TODO: Setup proptypes. See https://github.com/erikbrinkman/d3-dag/issues/45
//
// import Dag from "d3-dag/src/dag/node";
// import SugiyamaOperator from "d3-dag/src/sugiyama";
// import ZherebkoOperator from "d3-dag/src/zherebko";
// import Operator from "d3-dag/src/arquint";
//
// D3Graph2.propTypes = {
//   dag: PropTypes.instanceOf(Dag),
//   layout: PropTypes.oneOfType([
//     PropTypes.instanceOf(SugiyamaOperator),
//     PropTypes.instanceOf(ZherebkoOperator),
//     PropTypes.instanceOf(Operator),
//   ])
// };

D3Graph2.propTypes = {
  data: PropTypes.any.isRequired,
  createDag: PropTypes.func.isRequired,
  layout: PropTypes.any.isRequired,
  line: PropTypes.func.isRequired,
  width: PropTypes.number,
  height: PropTypes.number
}

export default D3Graph2;