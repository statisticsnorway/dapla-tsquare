import React, {useEffect, useState} from 'react'
import {Placeholder, Button, Card, Grid, Icon, List, Segment, Step} from "semantic-ui-react";
import useAxios from "axios-hooks";
import env from "@beam-australia/react-env";
import Moment from "react-moment";
import {NotebookTreeComponent} from "./Notebooks";
import {CommitExecutionComponent} from "./Commit";
import {Link} from "react-router-dom";

export const ExecutionList = ({executions}) => (
  <List divided relaxed>
    {executions.map(execution => (
      <ExecutionListItem executionId={execution.id} commitId={execution.id}
                         status={execution.status} createdAt={execution.createdAt}/>
    ))}
  </List>
)

const ExecutionIcon = ({status}) => {
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
  const [step, setStep] = useState({num: 0, ready: false});

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
        notebookIds: selected
      }
    })
  }

  if (loading) return <Placeholder></Placeholder>

  console.log(selected)
  console.log(updateData)

  function next() {
    setStep(prevState => ({num: prevState.num + 1, ready: false}))
  }

  function previous() {
    setStep(prevState => ({num: prevState.num - 1, ready: false}))
  }

  return (
    <>
      <Step.Group attached='top'>
        <Step active={step.num === 0} completed={step.num > 0}>
          <Icon name='check square'/>
          <Step.Content>
            <Step.Title>Select</Step.Title>
            <Step.Description>Choose the notebooks to include</Step.Description>
          </Step.Content>
        </Step>

        <Step active={step.num === 1} completed={step.num > 1}>
          <Icon name='eye'/>
          <Step.Content>
            <Step.Title>Review</Step.Title>
            <Step.Description>Check the execution plan</Step.Description>
          </Step.Content>
        </Step>

        <Step active={step.num === 2} completed={step.num > 2}>
          <Icon name='play'/>
          <Step.Content>
            <Step.Title>Run the execution</Step.Title>
          </Step.Content>
        </Step>
      </Step.Group>
      <Segment attached>
        <Grid>
          <Grid.Column width={4}>
            <NotebookTreeComponent onSelect={updateExecution} repositoryId={data.repositoryId} commitId={data.commitId}/>
          </Grid.Column>
          <Grid.Column width={12}>
            <CommitExecutionComponent executionId={executionId} jobs={(updateData || data).jobs}/>
          </Grid.Column>
        </Grid>

        <Button onClick={previous} primary>Previous</Button>
        <Button onClick={next} primary floated='right'>Next</Button>
      </Segment>

    </>
  )
}

const CommitDetailComponent = ({repositoryId, commitId}) => {

  const [selected, setSelected] = useState([]);
  const [{data: executeData, loading: executeLoading, error: executeError}, execute] = useAxios({
      url: `${env('EXECUTION_HOST')}/api/v1/execute`,
      method: 'POST'
    },
    {
      manual: true
    }
  );

  function executeNotebooks() {
    console.log("executing")
    execute({
      data: {
        repositoryId,
        commitId,
        notebookIds: selected
      }
    })
  }

  return (
    <Card fluid>
      <Card.Content>

        <Button.Group icon floated='right' size='tiny'>
          <Button disabled={executeData} onClick={executeNotebooks}>
            <Icon name='play'/>
          </Button>
          <Button disabled={!executeData}>
            <Icon name='cancel'/>
          </Button>
        </Button.Group>

        <Card.Header>
          <List.Icon name='github' size='small' verticalAlign='middle'/>
          <b>Name</b> committed <Moment fromNow unix>0</Moment>
          Commit title (first line) {commitId}
        </Card.Header>
      </Card.Content>
      <Card.Content>
        <Grid columns={2} relaxed='very'>
          <Grid.Column>Some description of the commit</Grid.Column>
          <Grid.Column width={6}>
            <NotebookTreeComponent onSelect={setSelected} repositoryId={repositoryId} commitId={commitId}/>
          </Grid.Column>
        </Grid>
      </Card.Content>
      <Card.Content>
        {executeData && <CommitExecutionComponent executionId={executeData.id} jobs={executeData.jobs}/>}
      </Card.Content>
    </Card>
  )
}