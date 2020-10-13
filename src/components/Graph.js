import React, {useState} from 'react'
import * as d3dag from 'd3-dag';
import * as d3 from 'd3';
import ColorHash from "color-hash";
import {Grid, Label, List} from "semantic-ui-react";
import Moment from "react-moment";
import {TOOL_PAN, UncontrolledReactSVGPanZoom} from "react-svg-pan-zoom";
import {ExecutionIcon} from "./Executions";
import {Link} from 'react-router-dom'
import {D3Graph} from "./D3Graph";
import AutoSizer from "react-virtualized-auto-sizer";

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
    default:
      break;
  }
}

const JobListItem = ({id, jobId, status, startedAt, path, callback, onMouseEnter, onMouseLeave}) => (
  <List.Item as={Link} onClick={() => callback(jobId)}
             onMouseEnter={(event) => onMouseEnter(event, id)}
             onMouseLeave={(event) => onMouseLeave(event, id)}>
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

export const JobList = ({jobs, callback, onMouseEnter, onMouseLeave}) => (
  <List divided relaxed>
    {jobs.map(job => (
      <JobListItem
        key={job.id}
        jobId={job.id}
        id={job.notebook.id}
        path={job.notebook.path}
        status={job.status}
        startedAt={job.startedAt}
        callback={callback}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
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

  const [hover, setHover] = useState();

  return (
    <Grid columns={2} stackable divided>
      <Grid.Column width={5}>
        <JobList jobs={jobs} callback={setSelectedJobIdCallback}
                 onMouseEnter={(event, id) => setHover(id)}
                 onMouseLeave={() => setHover(null)}/>
      </Grid.Column>
      <Grid.Column width={11} style={{height: 500, padding: 0}}>
        <AutoSizer>
          {({height, width}) => (
            <UncontrolledReactSVGPanZoom width={width} height={height} background={'white'} defaultTool={TOOL_PAN}>
              <svg width={width} height={height}>
                {jobs?.length > 0 && (
                  <D3Graph data={jobs} dagFn={stratify} layoutFn={layout} lineFn={pathFactory} highlighted={hover}/>
                )}
              </svg>
            </UncontrolledReactSVGPanZoom>
          )}
        </AutoSizer>

      </Grid.Column>
    </Grid>
  );
}