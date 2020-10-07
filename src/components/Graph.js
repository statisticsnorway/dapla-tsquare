import React from 'react'
import * as d3dag from 'd3-dag';
import * as d3 from 'd3';
import ColorHash from "color-hash";
import {Grid, Label, List} from "semantic-ui-react";
import Moment from "react-moment";
import {UncontrolledReactSVGPanZoom} from "react-svg-pan-zoom";
import AutoSizer from 'react-virtualized-auto-sizer'
import {ExecutionIcon} from "./Executions";
import { LazyLog } from "react-lazylog"
import { Link } from 'react-router-dom'

const hash = new ColorHash({lightness: [0.35, 0.5, 0.65]})

const jobsExample = [{
  "id": "1424026a-a3e4-4af2-9ac7-b910f98f213d",
  "status": "Ready",
  "startedAt": null,
  "endedAt": null,
  "exception": null,
  "notebook": {
    "id": "a92b824decc7b369180f4c30241e91f149c20e96",
    "path": "blueprint/tests/1.ipynb",
    "commitId": "b1c4d0db22fcd94ae0718319756d979f3c62490a",
    "fetchUrl": "/api/v1/repositories/9bf7399763ff968e4dbaf1bef11ad7b8f5a75c09/commits/b1c4d0db22fcd94ae0718319756d979f3c62490a/notebooks/a92b824decc7b369180f4c30241e91f149c20e96",
    "inputs": ["/START"],
    "outputs": ["/A", "/B"]
  },
  "previousJobs": []
}, {
  "id": "399b29ca-ed1b-4052-994c-aef55a39fb4b",
  "status": "Ready",
  "startedAt": null,
  "endedAt": null,
  "exception": null,
  "notebook": {
    "id": "fececd88044240b980f7b392a89b5493c8201e23",
    "path": "blueprint/tests/2.ipynb",
    "commitId": "b1c4d0db22fcd94ae0718319756d979f3c62490a",
    "fetchUrl": "/api/v1/repositories/9bf7399763ff968e4dbaf1bef11ad7b8f5a75c09/commits/b1c4d0db22fcd94ae0718319756d979f3c62490a/notebooks/fececd88044240b980f7b392a89b5493c8201e23",
    "inputs": ["/A"],
    "outputs": ["/C", "/D", "/F"]
  },
  "previousJobs": ["1424026a-a3e4-4af2-9ac7-b910f98f213d"]
}, {
  "id": "b6271f43-5eea-417b-9538-8e017926712e",
  "status": "Ready",
  "startedAt": null,
  "endedAt": null,
  "exception": null,
  "notebook": {
    "id": "3f545669d5726660f1f8b4e29379f3d03a37b003",
    "path": "blueprint/tests/3.ipynb",
    "commitId": "b1c4d0db22fcd94ae0718319756d979f3c62490a",
    "fetchUrl": "/api/v1/repositories/9bf7399763ff968e4dbaf1bef11ad7b8f5a75c09/commits/b1c4d0db22fcd94ae0718319756d979f3c62490a/notebooks/3f545669d5726660f1f8b4e29379f3d03a37b003",
    "inputs": ["/B", "/C"],
    "outputs": ["/E"]
  },
  "previousJobs": ["399b29ca-ed1b-4052-994c-aef55a39fb4b", "1424026a-a3e4-4af2-9ac7-b910f98f213d"]
}, {
  "id": "323a8080-6449-47d0-877b-fb6f679a5b77",
  "status": "Ready",
  "startedAt": null,
  "endedAt": null,
  "exception": null,
  "notebook": {
    "id": "fe699b6dde2e8fd27ca22f6c8c97b8a8cbf9463d",
    "path": "blueprint/tests/4.ipynb",
    "commitId": "b1c4d0db22fcd94ae0718319756d979f3c62490a",
    "fetchUrl": "/api/v1/repositories/9bf7399763ff968e4dbaf1bef11ad7b8f5a75c09/commits/b1c4d0db22fcd94ae0718319756d979f3c62490a/notebooks/fe699b6dde2e8fd27ca22f6c8c97b8a8cbf9463d",
    "inputs": ["/D", "/E", "/F"],
    "outputs": ["/END"]
  },
  "previousJobs": ["399b29ca-ed1b-4052-994c-aef55a39fb4b", "b6271f43-5eea-417b-9538-8e017926712e", "1424026a-a3e4-4af2-9ac7-b910f98f213d"]
}]

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

export const DirectedAcyclicGraph = ({jobs = [], setSelectedJobIdCallback}) => {
  return (
    <Grid columns={2} stackable divided>
      <Grid.Column width={5}>
        <JobList jobs={jobs} callback={setSelectedJobIdCallback}/>
      </Grid.Column>
      <Grid.Column width={11} style={{height: 500, padding: 0}}>
        <AutoSizer>
          {({height, width}) => (
            <D3Dag height={height} width={width} jobs={jobs}/>
          )}
        </AutoSizer>
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