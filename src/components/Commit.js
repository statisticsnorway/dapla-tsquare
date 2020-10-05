import React, {useState} from 'react'
import {
  Button,
  Card,
  Dimmer,
  Divider,
  Grid,
  Header,
  Icon,
  Label,
  List,
  Loader,
  Message,
  Modal, Popup,
  Segment,
  Table
} from "semantic-ui-react";
import {Link} from "react-router-dom";
import Moment from "react-moment";
import env from "@beam-australia/react-env";
import useAxios from "axios-hooks";
import {NotebookTreeComponent} from "./Notebooks";

export const CommitItem = ({id, repositoryId, message, committer: {name}, committedAt}) => (
  <List.Item>
    <List.Content>
      <List.Header as='a'>
        <Link to={`/repository/${repositoryId}/commit/${id}`}>
          {message && message.split('\n')[0]}
        </Link>
      </List.Header>
      <List.Description as='a'>
        <List.Icon name='github' size='small' verticalAlign='middle'/>
        <b>{name}</b> committed <Moment fromNow unix>{committedAt}</Moment>
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


const CommitInfoMessage = ({updated, deleted, created}) => (
  <Message compact>
    <Message.Header>
      <Icon name='info circle'/>
      Changes
    </Message.Header>
    <Divider/>
    <Message.Content>
      <List size='mini' divided>
        {created && (
          <CommitChangesPopup
            trigger={<List.Item>
              <Label horizontal circular>{created.length}</Label>
              new notebooks
            </List.Item>}
            notebooks={created}
          />

        )}

        {updated && (
          <CommitChangesPopup
            trigger={<List.Item>
              <Label horizontal circular>{updated.length}</Label>
              modified notebooks
            </List.Item>}
            notebooks={updated}
          />

        )}

        {deleted && (
          <CommitChangesPopup
            trigger={<List.Item>
              <Label horizontal circular>{deleted.length}</Label>
              deleted notebooks
            </List.Item>}
            notebooks={deleted}
          />

        )}

        {(deleted || updated || created) || (
          <List.Item>
            no changes in this commits
          </List.Item>
        )}

        {/*<List.Item>*/}
        {/*  <Label horizontal circular>12</Label>*/}
        {/*  impacted dependencies*/}
        {/*</List.Item>*/}

      </List>
    </Message.Content>
  </Message>
)

const CommitDetailPlaceholder = () => (
  <div>Loading</div>
)

const CommitDetailError = ({error}) => (
  <div>Loading</div>
)

export const CommitDetail = ({title, body, created, updated, deleted, committedAt, id, committer, children, repositoryId, commitId}) => {

  const [{data, loading, error}, execute] = useAxios({
      url: `${env('EXECUTION_HOST')}/api/v1/execute`,
      method: 'POST'
    },
    {
      manual: true
    }
  );

  function executeNotebooks() {
    execute({
      data: {
        repositoryId,
        commitId
      }
    })
  }

  return (
    <Card fluid>
      <Card.Content>
        <Button compact floated='right' size='tiny' onClick={executeNotebooks}>
          <Icon name='cogs' loading={loading}/>
          Create execution
        </Button>
        <Card.Header>
          {title}
        </Card.Header>
        <Card.Description>
          {body}
        </Card.Description>
      </Card.Content>
      <Card.Content>
        <Card.Description>
          Notebooks in this commit
        </Card.Description>
        <Grid>
          <Grid.Column width={11}>
            {children}
          </Grid.Column>
          <Grid.Column width={5}>
            <CommitInfoMessage created={created} deleted={deleted} updated={updated}/>
          </Grid.Column>
        </Grid>
      </Card.Content>
      <Card.Content extra>
        <Card.Meta>
          <b>{committer && committer.name}</b> committed <Moment fromNow unix>{committedAt}</Moment> {id && id.substring(0, 7)}
        </Card.Meta>
      </Card.Content>
    </Card>
  )
}

export const CommitDetailComponent = ({repositoryId, commitId}) => {
  const [{data, loading, error}] = useAxios(
    `${env('BLUEPRINT_HOST')}/api/v1/repositories/${repositoryId}/commits/${commitId}`
  )

  if (loading || !data) return <CommitDetailPlaceholder/>
  if (error) return <CommitDetailError error={error}/>

  const {
    message, committedAt, committer, id,
    updated, deleted, created
  } = data;

  const [firstLine, ...otherLines] = message.split('\n')

  return (<CommitDetail id={commitId} title={firstLine} body={otherLines.join('\n')}
                        updated={updated} deleted={deleted} created={created}
                        committer={committer} committedAt={committedAt} repositoryId={repositoryId} commitId={commitId}>
      <NotebookTreeComponent repositoryId={repositoryId} commitId={commitId}/>
    </CommitDetail>
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
            <Table.Cell>
              <Moment unix fromNow>{job.startedAt}</Moment>
            </Table.Cell>
            <Table.Cell>September 14, 2013</Table.Cell>
            <Table.Cell>{job.status}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )
}

export const CommitChangesPopup = (props) => {
  if (props.notebooks.length > 0) {
    return (
      <Popup
        trigger={props.trigger}
        content={props.notebooks.length > 0 && props.notebooks.map(notebook => <p key={notebook.id}>{notebook.path}</p>)}
      />
    )
  } else {
    return props.trigger
  }
}