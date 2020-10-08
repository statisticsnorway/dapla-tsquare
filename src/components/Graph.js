import React from 'react'
import * as d3dag from 'd3-dag';
import * as d3 from 'd3';
import ColorHash from "color-hash";
import {Grid, Label, List} from "semantic-ui-react";
import Moment from "react-moment";
import {UncontrolledReactSVGPanZoom} from "react-svg-pan-zoom";
import {ExecutionIcon} from "./Executions";
import {Link} from 'react-router-dom'
import D3Graph2 from "./D3Graph";

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

function getTerm(status) {
  switch (status) {
    case "Running":
      return "started"
    case "Ready":
      return "created"
    case "Failed":
      return "failed"
    case "Done":
      return "done"
    case "Cancelled":
      return "cancelled"
  }
}

const JobListItem = ({id, jobId, status, startedAt, endedAt, path, callback}) => (
  <List.Item as={Link} onClick={() => callback(jobId)}>
    <List.Content>
      <List.Header>
        <Label style={{
          background: hash.hex(id),
          color: hexToLuma(hash.hex(id)) > 0.5 ? "#222" : "#f1f1f1",
        }} horizontal>
          {id.substring(0, 7)}
        </Label>
        {path}
      </List.Header>
      <List.Description>
        <ExecutionIcon status={status}/>
        {status !== "Ready" && (
          <>
            {getTerm(status)} <Moment unix fromNow>{startedAt}</Moment>
          </>
        )}
        {status === "Ready" && (
          <>
            waiting for parents
          </>
        )}
      </List.Description>
    </List.Content>
  </List.Item>
)

export const JobList = ({jobs, callback}) => (
  <List divided relaxed>
    {jobs.map(job => (
      <JobListItem
        key={job.id}
        jobId={job.id}
        id={job.notebook.id}
        path={job.notebook.path}
        status={job.status}
        startedAt={job.startedAt}
        endedAt={job.endedAt}
        callback={callback}
      />
    ))}
  </List>
)

const stratify = d3dag.dagStratify()
  .id(n => n.id)
  .parentIds(n => n.previousJobs);

const layout = d3dag.sugiyama().layering(d3dag.layeringCoffmanGraham())
  .decross(d3dag.decrossTwoLayer().order(d3dag.twolayerMedian()))
  .coord(d3dag.coordCenter())
  .separation(() => 1);

const pathFactory = d3.line().curve(d3.curveCatmullRom).x(d => d.y).y(d => d.x);

export const DirectedAcyclicGraph = ({jobs = [], setSelectedJobIdCallback}) => {
  return (
    <Grid columns={2} stackable divided>
      <Grid.Column width={5}>
        <JobList jobs={jobs} callback={setSelectedJobIdCallback}/>
      </Grid.Column>
      <Grid.Column width={11} style={{height: 500, padding: 0}}>
        <UncontrolledReactSVGPanZoom width={500} height={500} background={'white'}

        >
          <svg>
            {jobs?.length > 0 && (
              <D3Graph2 data={jobs} createDag={data => stratify(data)} layout={layout} line={pathFactory}/>
            )}
          </svg>
        </UncontrolledReactSVGPanZoom>
      </Grid.Column>
    </Grid>
  );
}

class D3Dag extends React.Component {

  constructor(props) {
    super(props);
  }

  Viewer = null

  computeDAG() {
    // TODO: Pass function in props
    const dag = d3dag.dagStratify()
      .id(n => n.id)
      .parentIds(n => n.previousJobs)
      (this.props.jobs)
    return dag;
  }

  componentDidMount() {

    if (this.props.jobs.length === 0) {
      return;
    }

    const dag = this.computeDAG();
    const svgSelection = d3.select(this.Viewer.Viewer.ViewerDOM).selectAll('g');
    const defs = svgSelection.append('defs');

    const nodeWidth = 68;
    const nodeHeight = 26;

    d3dag.sugiyama()
      .size([dag.size() * nodeHeight, dag.size() * nodeWidth])
      .layering(d3dag.layeringCoffmanGraham())
      .decross(d3dag.decrossTwoLayer().order(d3dag.twolayerMedian()))
      .coord(d3dag.coordCenter())
      .separation(() => 1)(dag)

    // How to draw edges
    const line = d3.line()
      .curve(d3.curveCatmullRom)
      .x(d => d.y)
      .y(d => d.x);

    // Plot edges
    svgSelection.append('g')
      .selectAll('path')
      .data(dag.links())
      .enter()
      .append('path')
      .attr('d', ({points}) => line(points))
      .attr('fill', 'none')
      .attr('stroke-width', 3)
      .attr('stroke', ({source, target}) => {
        const gradId = `${source.id}-${target.id}`;
        const grad = defs.append('linearGradient')
          .attr('id', gradId)
          .attr('gradientUnits', 'userSpaceOnUse')
          // Invert x/y for top down
          .attr('x1', source.y)
          .attr('x2', target.y)
          .attr('y1', source.x)
          .attr('y2', target.x);
        grad.append('stop').attr('offset', '0%').attr('stop-color', hash.hex(source.data.notebook.id));
        grad.append('stop').attr('offset', '100%').attr('stop-color', hash.hex(target.data.notebook.id));
        return `url(#${gradId})`;
      });

    // Select nodes
    const nodes = svgSelection.append('g')
      .selectAll('g')
      .data(dag.descendants())
      .enter()
      .append('g')
      .attr('transform', ({x, y}) => `translate(${y - nodeWidth / 2}, ${x - nodeHeight / 2})`);

    // Plot nodes
    nodes.append('rect')
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('fill', n => hash.hex(n.data.notebook.id));

    // Add text to nodes
    nodes.append('text')
      .attr('x', nodeWidth / 2)
      .attr('y', nodeHeight / 2 + 1)
      .text(n => n.data.notebook.id.substring(0, 7))
      .attr('fill', n => hexToLuma(hash.hex(n.data.notebook.id)) > 0.5 ? "#222" : "#eee")
      .attr('font-weight', 'bold')
      .attr('font-family', 'sans-serif')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')

  }

  render() {
    return (
      <UncontrolledReactSVGPanZoom
        width={this.props.width}
        height={this.props.height}
        ref={Viewer => this.Viewer = Viewer}
        background={'white'}
        tool="auto"
        miniaturePosition="none"
      >
        <svg width={800} height={400}/>
      </UncontrolledReactSVGPanZoom>

    );
  }

}

export default D3Dag;