import React from 'react'
import {Dimmer, List, Loader, Segment} from "semantic-ui-react";
import env from "@beam-australia/react-env";
import {Get} from "react-axios"
import {Link} from "react-router-dom";

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