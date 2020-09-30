import React from 'react'
import {Icon, Header, Dimmer, List, Loader, Segment, Card, Grid} from "semantic-ui-react";
import env from "@beam-australia/react-env";
import {Get} from "react-axios"
import Moment from "react-moment";
import {Link} from "react-router-dom";

export const NotebookList = () => (
  <List>
    <List.Item>
      <List.Icon name='folder'/>
      <List.Content>
        <List.Header>src</List.Header>
        <List.Description>Source files for project</List.Description>
        <List.List>
          <List.Item>
            <List.Icon name='folder'/>
            <List.Content>
              <List.Header>site</List.Header>
              <List.Description>Your site's theme</List.Description>
            </List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name='folder'/>
            <List.Content>
              <List.Header>themes</List.Header>
              <List.Description>Packaged theme files</List.Description>
              <List.List>
                <List.Item>
                  <List.Icon name='folder'/>
                  <List.Content>
                    <List.Header>default</List.Header>
                    <List.Description>Default packaged theme</List.Description>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Icon name='folder'/>
                  <List.Content>
                    <List.Header>my_theme</List.Header>
                    <List.Description>
                      Packaged themes are also available in this folder
                    </List.Description>
                  </List.Content>
                </List.Item>
              </List.List>
            </List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name='file'/>
            <List.Content>
              <List.Header>theme.config</List.Header>
              <List.Description>
                Config file for setting packaged themes
              </List.Description>
            </List.Content>
          </List.Item>
        </List.List>
      </List.Content>
    </List.Item>
    <List.Item>
      <List.Icon name='folder'/>
      <List.Content>
        <List.Header>dist</List.Header>
        <List.Description>Compiled CSS and JS files</List.Description>
        <List.List>
          <List.Item>
            <List.Icon name='folder'/>
            <List.Content>
              <List.Header>components</List.Header>
              <List.Description>
                Individual component CSS and JS
              </List.Description>
            </List.Content>
          </List.Item>
        </List.List>
      </List.Content>
    </List.Item>
    <List.Item>
      <List.Icon name='file'/>
      <List.Content>
        <List.Header>semantic.json</List.Header>
        <List.Description>Contains build settings for gulp</List.Description>
      </List.Content>
    </List.Item>
  </List>
)

const exampleRepoPayload = [{
  "id": "9bf7399763ff968e4dbaf1bef11ad7b8f5a75c09",
  "uri": "https://github.com/statisticsnorway/dapla-notebooks.git"
}];

const RepositoryItem = ({id, uri}) => (
  <List.Item>
    <List.Icon name='github' size='small' verticalAlign='middle'/>
    <List.Content>
      <List.Header><Link to={`/repository/${id}`}>statisticsnorway/dapla-blueprint</Link></List.Header>
      <List.Description as='a'>TODO: Updated 10 min ago</List.Description>
    </List.Content>
  </List.Item>
);

export const RepositoryList = ({repositories = [], test}) => {
  if (test) {
    repositories = exampleRepoPayload;
  }
  return <List divided relaxed>
    {repositories.map((repository) => <RepositoryItem key={repository.id}{...repository} />)}
  </List>
}

export const RepositoryListComponent = () => {
  return (
    <Segment>
      <Get url={`${env('BLUEPRINT_HOST')}/api/v1/repositories`}>
        {(error, response, isLoading, makeRequest, axios) => {
          if (isLoading) {
            return <Dimmer active inverted><Loader inverted>Loading</Loader></Dimmer>
          } else if (response) {
            return <RepositoryList repositories={response.data}/>
          } else {
            return <div>IDK</div>
          }
        }}
      </Get>
    </Segment>

  )
}

const exampleCommitPayload = [{
  "message": "Added note to create testdata for lineage\n",
  "id": "87fadea309f1e6fb63e1faed5c57f0461e816908",
  "createdAt": 1601289474.000000000,
  "authorName": "Bjørn-Andre Skaar",
  "authorEmail": "kons-skaar@ssb.no",
  "authoredAt": 1601289474.000000000,
  "committerName": "Bjørn-Andre Skaar",
  "committerEmail": "kons-skaar@ssb.no",
  "committedAt": 1601289474.000000000
}];

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

export const CommitList = ({repositoryId, commits = [], test}) => {
  if (test) {
    commits = exampleCommitPayload;
  }
  commits.sort(({committedAt: a}, {committedAt: b}) => b - a);
  return <List divided relaxed>
    {commits.map((commit) => <CommitItem key={commit.id} repositoryId={repositoryId} {...commit} />)}
  </List>
}

export const CommitListPlaceHolder = () => (
  <Segment placeholder>
    <Header icon>
      <Icon name='arrow left' />
      Start by choosing a repository
    </Header>
  </Segment>
)

export const CommitListComponent = ({repositoryId}) => {
  return (
    <Segment>
      <Get url={`${env('BLUEPRINT_HOST')}/api/v1/repositories/${repositoryId}/commits`}>
        {(error, response, isLoading, makeRequest, axios) => {
          if (isLoading) {
            return <div>loading</div>
          } else if (response) {
            return <CommitList repositoryId={repositoryId} commits={response.data}/>
          } else {
            return <div>IDK</div>
          }
        }}
      </Get>
    </Segment>
  )
}

export const CommitDetailComponent = ({repositoryId, commitId}) => {
  return (
    <Card.Group>
      <Card fluid>
        <Card.Content>
          <Card.Header>Commit title (first line) {commitId}</Card.Header>
        </Card.Content>
        <Card.Content>
          <Grid columns={2} relaxed='very'>
            <Grid.Column>Some description of the commit</Grid.Column>
            <Grid.Column width={6}><NotebookList/></Grid.Column>
          </Grid>
        </Card.Content>
      </Card>
    </Card.Group>
  )
}

export default RepositoryList