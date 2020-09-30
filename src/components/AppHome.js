import React from 'react'
import {NotebookList, RepositoryList} from "./RepoList";
import {Breadcrumb, Card, Container, Grid} from "semantic-ui-react";

function AppHome() {
  return (
    <div>
      <Container>
        <Grid columns={2}>

          <Grid.Row>
            <Grid.Column fluid>
              <Breadcrumb>
                <Breadcrumb.Section link>Home</Breadcrumb.Section>
                <Breadcrumb.Divider/>
                <Breadcrumb.Section link>statisticsnorway/dapla-blueprint</Breadcrumb.Section>
                <Breadcrumb.Divider/>
                <Breadcrumb.Section active>4e6c87a - Some descripti(...)</Breadcrumb.Section>
              </Breadcrumb>
            </Grid.Column>
          </Grid.Row>

          <Grid.Row>
            <Grid.Column width={4}>
              <RepositoryList/>
            </Grid.Column>
            <Grid.Column width={12}>
              <Card.Group>
                <Card fluid>
                  <Card.Content>
                    <Card.Header>Commit title (first line)</Card.Header>
                  </Card.Content>
                  <Card.Content>
                    <Grid columns={2} relaxed='very'>
                      <Grid.Column>Some description of the commit</Grid.Column>
                      <Grid.Column width={6}><NotebookList/></Grid.Column>
                    </Grid>
                  </Card.Content>
                </Card>
              </Card.Group>
            </Grid.Column>
          </Grid.Row>

        </Grid>
      </Container>

    </div>
  )
}

export default AppHome
