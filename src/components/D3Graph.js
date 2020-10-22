import React, {useEffect, useMemo, useRef, useState} from 'react'
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

/**
 * Shorten the text if width is too big.
 */
const EllipsisFilename = ({text, maxWidth, ...props}) => {

  const container = useRef(null);
  const [clientWidth, setClientWidth] = useState(null);
  useEffect(() => {
    setClientWidth(container.current.clientWidth)
  }, [container]);

  return (
    <text ref={container} {...props}>
      <tspan fontWeight='bold'>{clientWidth > maxWidth ? text.substring(0, 13) + "..." : text}</tspan>
    </text>
  )
}

const GraphNode = ({x, y, width, height, color, highlighted = false, notebook}) => (
  <g transform={`translate(${y - width / 2}, ${x - height / 2})`}>
    {highlighted
      ? (<rect width={width} height={height} fill={color} rx={5} ry={5}
               stroke={hexToLuma(color) > 0.5 ? darkenRgb(color, 50) : lightenRgb(color, 50)} strokeWidth={3}/>)
      : (<rect width={width} height={height} fill={color} rx={5} ry={5}/>)
    }
    <g width={width} height={height} fontSize={14}
       textAnchor='left'
       alignmentBaseline='middle'
       fill={hexToLuma(color) > 0.5 ? "#222" : "#eee"}
    >
      <EllipsisFilename x={3} y={15} maxWidth={width} text={notebook.path.split(/(\\|\/)/g).pop()}/>
      <text x={7} y={32} fontSize={12}>
        <tspan fontFamily={"Icons"}>{"\uf126"}</tspan>
        <tspan> {notebook.id.substring(0, 7)} </tspan>
        {/*Does not work yet*/}
        {/*<tspan fontFamily={"Icons"}>{"\uf126"}</tspan>*/}
        {/*<tspan> {nb.commitId.substring(0, 7)} </tspan>*/}
      </text>
    </g>
  </g>
)

const GraphGradient = ({source, target}) => (
  <linearGradient id={`${source.id}-${target.id}`} gradientUnits='userSpaceOnUse'
                  x1={source.y} x2={target.y}
                  y1={source.x} y2={target.y}
  >
    <stop offset='0%' stopColor={hash.hex(source.data.notebook.id)}/>
    <stop offset='100%' stopColor={hash.hex(target.data.notebook.id)}/>
  </linearGradient>
)

const GraphCurve = ({d, stroke}) => (
  <g>
    <path d={d} fill='none' strokeWidth={3} stroke={stroke}/>
  </g>
)

const nodeWidth = 120;
const nodeHeight = 38;

export const D3Graph = ({data, dagFn, layoutFn, lineFn, highlighted}) => {

  const dag = useMemo(() => {
    // Convert to dag
    const dag = dagFn(data);
    // Compute the coordinates
    return layoutFn.nodeSize([nodeHeight * 2, nodeWidth * 1.5])(dag);
  }, [data, dagFn, layoutFn]);

  return (
    <>
      {/*Use link source and target to generate gradient definition.*/}
      <defs>
        {dag.links().map(({source, target}) => (
          <GraphGradient key={source.id + target.id} source={source} target={target}/>
        ))}
      </defs>
      {dag.links().map(({points, source, target}) => (
        <GraphCurve key={source.id + target.id} d={lineFn(points)} stroke={`url(#${source.id}-${target.id})`}/>
      ))}
      {/*Render the nodes*/}
      {dag.descendants().map(node => {
        return (
          <GraphNode x={node.x} y={node.y} key={node.data.notebook.id}
                     color={hash.hex(node.data.notebook.id)}
                     width={nodeWidth} height={nodeHeight}
                     highlighted={node.data.notebook.id === highlighted}
                     notebook={node.data.notebook}
          />
        )
      })}
    </>
  )
}

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