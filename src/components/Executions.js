import React, {useEffect, useState} from 'react'
import {Button, Card, Grid, List, Placeholder, Segment} from "semantic-ui-react";
import useAxios from "axios-hooks";
import env from "@beam-australia/react-env";
import Moment from "react-moment";
import {NotebookTreeComponent} from "./Notebooks";
import {CommitExecutionComponent} from "./Commit";
import {Link} from "react-router-dom";
import {LazyLog} from "react-lazylog";
import D3Dag, {DirectedAcyclicGraph, JobList} from "./Graph";
import AutoSizer from "react-virtualized-auto-sizer";

export const ExecutionList = ({executions}) => (
  <List divided relaxed>
    {executions.map(execution => (
      <ExecutionListItem key={execution.id} executionId={execution.id} commitId={execution.id}
                         status={execution.status} createdAt={execution.createdAt}/>
    ))}
  </List>
)

export const ExecutionIcon = ({status}) => {
  switch (status) {
    case "Running":
      return <List.Icon name='sync alternate' loading/>
    case "Ready":
      return <List.Icon name='time'/>
    case "Failed":
      return <List.Icon name='warning'/>
    case "Done":
      return <List.Icon name='check'/>
    case "Cancelled":
      return <List.Icon name='warning'/>
    default:
      break;
  }
}

const ExecutionListItem = ({commitId, executionId, createdAt, status}) => {

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

  return (
    <List.Item>
      <List.Content>
        <List.Header>
          <Link to={`/execution/${executionId}`}>
            {executionId.substring(0, 7)} (commit {commitId.substring(0, 7)})
          </Link>
        </List.Header>
        <List.Description as='a'>
          <ExecutionIcon status={status}/>
          {getTerm(status)} <Moment unix fromNow>{createdAt}</Moment>
        </List.Description>
      </List.Content>
    </List.Item>
  )
}

export const ExecutionListComponent = ({interval = 5000}) => {

  const [{data, loading, error}, refresh] = useAxios(`${env('EXECUTION_HOST')}/api/v1/execution`);

  useEffect(() => {
    const intervalRef = setInterval(() => {
      refresh();
    }, interval);
    return () => clearInterval(intervalRef);
  });

  if (loading || !data) return <div>loading</div>
  if (error) return (<div><p>{JSON.stringify(error)}</p></div>)

  return (
    <ExecutionList executions={data}/>
  )

}

export const ExecutionComponent = ({executionId}) => {

  const [selectedJobId, setSelectedJobId] = useState();

  const [{data, loading, error}, refetch] = useAxios(`${env('EXECUTION_HOST')}/api/v1/execution/${executionId}`);
  const [{data: updateData, loading: updateLoading, error: updateError}, update] = useAxios({
      url: `${env('EXECUTION_HOST')}/api/v1/execution/${executionId}`,
      method: 'PUT'
    },
    {
      manual: true
    }
  );

  const [{data: startExecutionData, error: startExecutionError, response: startExecutionresponse},
    startExecution] = useAxios({
      url: `${env('EXECUTION_HOST')}/api/v1/execution/${executionId}/start`,
      method: 'POST'
    },
    {
      manual: true
    });

  function startExecutionAction() {
    startExecution()
      .then(() => refetch())
  }

  function updateExecution(ids) {
    update({
      data: {
        repositoryId: data.repositoryId,
        commitId: data.commitId,
        notebookIds: ids
      }
    })
  }

  return (
    <>
      <Segment>
        <Grid divided>
          <Grid.Row>
            <Grid.Column textAlign="right">
              {(loading
                ? <Placeholder/>
                : <ExecutionButtonGroup executionId={executionId} jobStatus={data.status} startExecutionCallback={startExecutionAction} compact floated='right' />
              )}
            </Grid.Column>
          </Grid.Row>
          <Grid.Column width={4}>
            {(loading
                ? <Placeholder/>
                : <NotebookTreeComponent onSelect={updateExecution} repositoryId={data.repositoryId}
                                         commitId={data.commitId}/>
            )}
          </Grid.Column>
          <Grid.Column width={12}>
            {(loading
                ? <Placeholder/>
                : <DirectedAcyclicGraph jobs={(updateData || data).jobs} setSelectedJobIdCallback={setSelectedJobId}/>
            )}
          </Grid.Column>
        </Grid>
      </Segment>
      { selectedJobId && executionId &&
      <LazyLog stream
               url={`http://localhost:10180/api/v1/execution/${executionId}/job/${selectedJobId}/log`}/>
      }
    </>
  )
}

const ExecutionButtonGroup = ({executionId, jobStatus, startExecutionCallback, ...rest}) => {

  const [{data: cancelExecutionData, error: cancelExecutionError, response: cancelExecutionResponse},
    cancelExecution] = useAxios({
      url: `${env('EXECUTION_HOST')}/api/v1/execution/${executionId}/cancel`,
      method: 'PUT'
    },
    {
      manual: true
    });

  return (
    <Button.Group labeled icon {...rest}>
      <Button icon='play' content='start' onClick={startExecutionCallback} disabled={jobStatus !== 'Ready'}/>
      <Button icon='cancel' content='cancel' onClick={cancelExecution} disabled={jobStatus !== 'Running'}/>
      {/*TODO check if job is running before trying to cancel*/}
    </Button.Group>
  )
}

export const ExecutionComponent2 = () => {
  return (
    <Card fluid>
      <Card.Content>
        <Card.Header>
          <ExecutionButtonGroup compact floated='right'/>
          Header
        </Card.Header>
        <Card.Description>
          Content
        </Card.Description>
      </Card.Content>
      <Card.Content>
        <DirectedAcyclicGraph/>
      </Card.Content>
      <Card.Content style={{height: 400, padding: 0}}>
        <LazyLog stream
                 url="http://localhost:10180/api/v1/execution/340072cf-328f-4bc7-b9cf-4670e1d887be/job/340072cf-328f-4bc7-b9cf-4670e1d887be/log"/>
      </Card.Content>
    </Card>
  );
}