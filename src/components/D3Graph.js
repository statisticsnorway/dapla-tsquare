import React, {useMemo} from 'react'
import PropTypes from 'prop-types';
import ColorHash from "color-hash";

const hash = new ColorHash({lightness: [0.35, 0.5, 0.65]})

const hexToRgb = (colour) => {
  const hex = colour.replace(/#/, '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return [r, g, b]
}

const rgbToHex = (rgb) => {
  let hex = '#';
  rgb.forEach(value => {
    if (value < 16) {
      hex += 0;
    }
    hex += Math.floor(value).toString(16);
  });
  return hex;
}

const lightenRgb = (color, percent) => rgbToHex(lighten(hexToRgb(color), percent))

const lighten = ([r, g, b], percent) => {
  return [
    r + (256 - r) * percent / 100,
    g + (256 - g) * percent / 100,
    b + (256 - b) * percent / 100
  ]
}

const darkenRgb = (color, percent) => {
  return rgbToHex(darken(hexToRgb(color), percent));
}

const darken = ([r, g, b], percent) => {
  return [
    r * (100 - percent) / 100,
    g * (100 - percent) / 100,
    b * (100 - percent) / 100
  ]
}


const hexToLuma = (colour) => {
  const [r, g, b] = hexToRgb(colour);
  return [
    0.299 * r,
    0.587 * g,
    0.114 * b
  ].reduce((a, b) => a + b) / 255;
};

const GraphNode = ({label, x, y, width, height, color, highlighted = false}) => (
  <g transform={`translate(${y - width / 2}, ${x - height / 2})`}>
    {highlighted
      ? (<rect width={width} height={height} fill={color} rx={5} ry={5}
               stroke={hexToLuma(color) > 0.5 ? darkenRgb(color, 50) : lightenRgb(color, 50)} strokeWidth={3}/>)
      : (<rect width={width} height={height} fill={color} rx={5} ry={5}/>)
    }
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

export const D3Graph = ({data, dagFn, layoutFn, lineFn, highlighted}) => {

  const dag = useMemo(() => {
    // Convert to dag
    const dag = dagFn(data);
    // Compute the coordinates
    return layoutFn.nodeSize([nodeHeight * 2, nodeWidth * 2])(dag);
  }, [data, dagFn, layoutFn]);

  return (
    <>
      {/*Use link source and target to generate gradient definition.*/}
      <defs>
        {dag.links().map(({source, target}) => (
          <GraphGradient key={source.id+target.id} source={source} target={target}/>
        ))}
      </defs>
      {dag.links().map(({points, source, target}) => (
        <GraphCurve key={source.id+target.id} d={lineFn(points)} stroke={`url(#${source.id}-${target.id})`}/>
      ))}
      {/*Render the nodes*/}
      {dag.descendants().map(node => {
        const factor = node.data.notebook.id === highlighted ? 1.2 : 1;
        return (
          <GraphNode x={node.x} y={node.y} key={node.data.notebook.id}
                     color={hash.hex(node.data.notebook.id)}
                     width={nodeWidth * factor} height={nodeHeight * factor}
                     label={node.data.notebook.id.substring(0, 7)}
                     highlighted={node.data.notebook.id === highlighted}
          />
        )
      })}
    </>
  )
}

// TODO: Setup proptypes. See https://github.com/erikbrinkman/d3-dag/issues/45
//
// import Dag from "d3-dag/src/dag/node";
// import SugiyamaOperator from "d3-dag/src/sugiyama";
// import ZherebkoOperator from "d3-dag/src/zherebko";
// import Operator from "d3-dag/src/arquint";
//
// D3Graph.propTypes = {
//   dag: PropTypes.instanceOf(Dag),
//   layout: PropTypes.oneOfType([
//     PropTypes.instanceOf(SugiyamaOperator),
//     PropTypes.instanceOf(ZherebkoOperator),
//     PropTypes.instanceOf(Operator),
//   ])
// };

D3Graph.propTypes = {
  data: PropTypes.any.isRequired,
  dagFn: PropTypes.func.isRequired,
  layoutFn: PropTypes.func.isRequired,
  lineFn: PropTypes.func.isRequired,
}