import React, {useState} from 'react'
import {Button, Card, Dimmer, Grid, Header, Icon, List, Loader, Message, Segment, Table} from "semantic-ui-react";
import {Link} from "react-router-dom";
import Moment from "react-moment";
import env from "@beam-australia/react-env";
import {NotebookTreeComponent} from "./Notebooks";
import useAxios from "axios-hooks";

export const CommitItem = ({id, repositoryId, message, committerName, committedAt}) => (
  <List.Item>
    <List.Content>
      <List.Header as='a'>
        <Link to={`/repository/${repositoryId}/commit/${id}`}>{message}</Link>
      </List.Header>
      <List.Description as='a'>
        {committerName} committed <Moment fromNow unix>{committedAt}</Moment>
      </List.Description>
    </List.Content>
  </List.Item>
)

export const CommitList = ({repositoryId, commits = []}) => {
  commits.sort(({committedAt: a}, {committedAt: b}) => b - a);
  return <List divided relaxed>
    {commits.map((commit) => <CommitItem key={commit.id} repositoryId={repositoryId} {...commit} />)}
  </List>
}

export const CommitListPlaceHolder = () => (
  <Segment placeholder>
    <Header icon>
      <Icon name='arrow left'/>
      Start by choosing a repository
    </Header>
  </Segment>
)

export const CommitListComponent = ({repositoryId}) => {

  const [{data, loading, error}, refetch] = useAxios(
    `${env('BLUEPRINT_HOST')}/api/v1/repositories/${repositoryId}/commits`
  )

  if (loading) return <Segment><Dimmer active inverted><Loader inverted>Loading</Loader></Dimmer></Segment>
  if (error) return <Segment><Message error header='There was some errors with your submission'>
    <Message.Header>Error</Message.Header>
    <p>{JSON.stringify(error)}</p>
  </Message></Segment>

  return <Segment><CommitList repositoryId={repositoryId} commits={data}/></Segment>
}

export const CommitDetailComponent = ({repositoryId, commitId}) => {

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

export const CommitExecutionComponent = ({executionId, jobs = []}) => {

  const [{data, loading, error}, refresh] = useAxios(
    `${env('EXECUTION_HOST')}/api/v1/execution/${executionId}`,
    {manual: true}
  );

  if (data) {
    jobs = data.jobs || jobs;
  }

  return (
    <Table basic="very" singleLine>
      <Table.Header>
        <Button as='a' onClick={refresh}>refresh</Button>
        <Table.Row>
          <Table.HeaderCell>Path</Table.HeaderCell>
          <Table.HeaderCell>Started</Table.HeaderCell>
          <Table.HeaderCell>Stopped</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {jobs.map(job => (
          <Table.Row key={job.id}>
            <Table.Cell>{job.notebook.path}</Table.Cell>
            <Table.Cell><Moment ago>{job.started}</Moment></Table.Cell>
            <Table.Cell>September 14, 2013</Table.Cell>
            <Table.Cell>{job.status}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )
}