import React, {useEffect, useState} from 'react'
import {Button, Card, Grid, List, Placeholder, Segment} from "semantic-ui-react";
import useAxios from "axios-hooks";
import env from "@beam-australia/react-env";
import Moment from "react-moment";
import {NotebookTreeComponent} from "./Notebooks";
import {CommitExecutionComponent} from "./Commit";
import {Link} from "react-router-dom";
import {LazyLog} from "react-lazylog";
import {DirectedAcyclicGraph} from "./Graph";

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

  const [selected, setSelected] = useState([]);

  const [{data, loading, error}] = useAxios(`${env('EXECUTION_HOST')}/api/v1/execution/${executionId}`);
  const [{data: updateData, loading: updateLoading, error: updateError}, update] = useAxios({
      url: `${env('EXECUTION_HOST')}/api/v1/execution/${executionId}`,
      method: 'PUT'
    },
    {
      manual: true
    }
  );

  function updateExecution(ids) {
    setSelected(ids)
    update({
      data: {
        repositoryId: data.repositoryId,
        commitId: data.commitId,
        notebookIds: ids
      }
    })
  }

  let content
  if (loading || updateLoading) {
    content = <Placeholder/>
  } else {
    if (error || updateError) {
      content = <p>Error!</p>
    } else {
      content = <CommitExecutionComponent executionId={executionId} jobs={(updateData || data).jobs}/>
    }
  }


  return (
    <>
      <Segment>
        <Grid>
          <Grid.Column width={4}>
            {(loading
                ? <Placeholder/>
                : <NotebookTreeComponent onSelect={updateExecution} repositoryId={data.repositoryId}
                                         commitId={data.commitId}/>
            )}
          </Grid.Column>
          <Grid.Column width={12}>
            {content}
          </Grid.Column>
        </Grid>
      </Segment>
    </>
  )
}

const ExecutionButtonGroup = ({...rest}) => {
  return (
    <Button.Group labeled icon {...rest}>
      <Button icon='play' content='start'/>
      <Button icon='cancel' content='cancel'/>
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