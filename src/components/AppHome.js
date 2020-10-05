import React from 'react'
import {RepositoryListComponent} from "./RepoList";
import {Breadcrumb, Container, Divider, Grid, Header, Icon} from "semantic-ui-react";
import {Link, Route, Switch, useParams} from "react-router-dom";
import {CommitDetailComponent, CommitListComponent, CommitListPlaceHolder} from "./Commit";
import {ExecutionComponent, ExecutionListComponent} from "./Executions";
import {DirectedAcyclicGraph} from "./Graph";


// TODO: Move to own file.
const interpolatePath = (tpl, args) => tpl.replace(/:(\w+)/g, (_, v) => args[v])

const RouteBreadCrumbSection = ({path, name, divider = false}) => {
  let params = useParams();
  return (<>
    {divider && <Breadcrumb.Divider/>}
    <Breadcrumb.Section>
      <Link to={interpolatePath(path, params)}>
        {interpolatePath(name, params)}
      </Link>
    </Breadcrumb.Section>
  </>)
}
const RouteBreadCrumb = ({path, name, divider = false}) => (
  <Route path={path} strict={false} exact={false}>
    <RouteBreadCrumbSection path={path} name={name} divider={divider}/>
  </Route>
)

const CustomBreadCrumb = () => {
  return (<Breadcrumb>

    <Route path="/">
      <Breadcrumb.Section divider>
        <Link to='/'><Icon name='home'/></Link>
      </Breadcrumb.Section>
    </Route>

    <Route path="/repository">
      <Breadcrumb.Section divider>
        <Link to='/repository'>Repositories</Link>
      </Breadcrumb.Section>
    </Route>

    <Route path="/execution" divider>
      <Breadcrumb.Section>
        Executions
      </Breadcrumb.Section>
    </Route>

    <RouteBreadCrumb path="/repository/:repositoryId" name=":repositoryId" divider/>
    <RouteBreadCrumb path="/repository/:repositoryId/commit/:commitId" name=":commitId" divider/>
    <RouteBreadCrumb path="/execution/:executionId" name=":executionId" divider/>
  </Breadcrumb>)
}

const RepositoryView = () => {
  let {repositoryId} = useParams();
  return <CommitListComponent repositoryId={repositoryId}/>
}

const CommitView = () => {
  let {repositoryId, commitId} = useParams();
  return <>
    <CommitDetailComponent repositoryId={repositoryId} commitId={commitId}/>
  </>
}

const ExecutionView = () => {
  const {executionId} = useParams();
  return <>
    <ExecutionComponent executionId={executionId}/>
  </>
}

const DagView = () => {
  const {executionId} = useParams();
  return <>
    <DirectedAcyclicGraph executionId={executionId}/>
  </>
}


function AppHome() {
  return (
    <div>
      <Container>
        <Grid columns={2}>

          <Grid.Row>
            <CustomBreadCrumb/>
          </Grid.Row>

          <Grid.Row>
            <Grid.Column width={4}>
              <RepositoryListComponent/>
            </Grid.Column>
            <Grid.Column width={12}>
              <Switch>
                <Route path="/repository/:repositoryId/commit/:commitId">
                  <CommitView/>
                </Route>

                <Route path="/test">
                  <DagView/>
                </Route>

                <Route path="/repository/:repositoryId">
                  <RepositoryView/>
                </Route>
                <Route path="/execution/:executionId">
                  <ExecutionView/>
                </Route>
                <Route>
                  <CommitListPlaceHolder/>
                </Route>
              </Switch>
            </Grid.Column>
          </Grid.Row>

        </Grid>
      </Container>

    </div>
  )
}

export default AppHome
