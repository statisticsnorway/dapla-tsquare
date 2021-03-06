import React, { useState } from 'react'
import { Button, Grid, List, Placeholder, Popup, Segment } from "semantic-ui-react";
import useAxios from "axios-hooks";
import env from "@beam-australia/react-env";
import Moment from "react-moment";
import { NotebookTreeComponent } from "./Notebooks";
import { Link } from "react-router-dom";
import { LazyLog } from "react-lazylog";
import { DirectedAcyclicGraph } from "./Graph";

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

export const ExecutionComponent = ({executionId}) => {

  const [selected, setSelected] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState();

  const [{data, loading}, refetch] = useAxios(`${env('EXECUTION_HOST')}/api/v1/execution/${executionId}`);
  const [{data: updateData, loading: updateLoading}, update] = useAxios({
      url: `${env('EXECUTION_HOST')}/api/v1/execution/${executionId}`,
      method: 'PUT'
    },
    {
      manual: true
    }
  );

  const jobs = (updateData || data) ? (updateData || data).jobs : [];
  const endJobs = (updateData || data) ? (updateData || data).endJobs : [];
  const jobNotebookIds = jobs.map(job => job.notebook.id)
  const endJobsNotebookIds = endJobs.map(job => job.notebook.id)

  const [{loading: startExecutionLoading}, startExecution] = useAxios({
      url: `${env('EXECUTION_HOST')}/api/v1/execution/${executionId}/start`,
      method: 'POST'
    },
    {
      manual: true
    });

  function startExecutionAction() {
    startExecution().then(() => refetch());
  }

  function updateExecution(ids) {
    setSelected(ids)
    update({
      data: {
        repositoryId: data.repositoryId,
        commitId: data.commitId,
        endNotebookIds: ids
      }
    })
  }

  return (
    <>
      <Segment>
        <Grid divided>
          <Grid.Row>
            <Grid.Column textAlign="right">
              {(loading || !data
                  ? <Placeholder/>
                  : <ExecutionButtonGroup
                    executionId={executionId}
                    jobStatus={data.status}
                    startExecutionCallback={startExecutionAction}
                    loading={loading || startExecutionLoading}
                    compact floated='right'
                    hasSelectedNotebooks={jobNotebookIds.length > 0}
                  />
              )}
            </Grid.Column>
          </Grid.Row>
          <Grid.Column width={4}>
            {(loading || !data
                ? <Placeholder/>
                : <NotebookTreeComponent onSelect={updateExecution} repositoryId={data.repositoryId}
                                         commitId={data.commitId} disabled={data.status !== "Ready"}
                                         showCheckboxes={true} endJobsNotebookIds={endJobsNotebookIds}
                                         checked={ loading || updateLoading ? selected : jobNotebookIds}/>
            )}
          </Grid.Column>
          <Grid.Column width={12}>
            {(loading || !data
                ? <Placeholder/>
                : <DirectedAcyclicGraph jobs={jobs} setSelectedJobIdCallback={setSelectedJobId}/>
            )}
          </Grid.Column>
        </Grid>
      </Segment>
      { selectedJobId && executionId &&
      <LazyLog stream
               url={`${env('EXECUTION_HOST')}/api/v1/execution/${executionId}/job/${selectedJobId}/log`}/>
      }
    </>
  )
}

const ExecutionButtonGroup = ({executionId, jobStatus, startExecutionCallback, hasSelectedNotebooks, loading, ...rest}) => {

  const [, cancelExecution] = useAxios({
      url: `${env('EXECUTION_HOST')}/api/v1/execution/${executionId}/cancel`,
      method: 'PUT'
    },
    {
      manual: true
    });

  return (
    <Button.Group labeled icon {...rest}>
      <Popup
        trigger={<Button icon='play' content='start' onClick={startExecutionCallback}
                         disabled={jobStatus !== 'Ready' || !hasSelectedNotebooks} loading={loading}/>}
        content={"Velg minst én notebook for å starte en kjøring"}
        open={!hasSelectedNotebooks}
      />
      <Button icon='cancel' content='cancel' onClick={cancelExecution} disabled={jobStatus !== 'Running'}
              loading={loading}/>
      {/*TODO check if job is running before trying to cancel*/}
    </Button.Group>
  )
}