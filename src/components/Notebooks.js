import React, {useState} from 'react'
import CheckboxTree from 'react-checkbox-tree';
import {Dimmer, Icon, Loader, Message} from 'semantic-ui-react'

import 'react-checkbox-tree/lib/react-checkbox-tree.css';
import env from "@beam-australia/react-env";
import useAxios from "axios-hooks";

// TODO: Refactor
const makeHierarchy = (notebooks) => {
  const findOrCreate = (folders, nodes = [], leaf) => {
    const folder = folders.shift()
    if (folders.length === 0) {
      nodes.push({value: leaf.id, label: folder});
    } else {
      let node = nodes.find(e => e.value === folder);
      if (node === undefined) {
        node = {value: folder, label: folder, children: []}
        nodes.push(node);
      }
      if (folders.length > 0) {
        findOrCreate(folders, node.children, leaf)
      }
    }
  }

  const nodes = [];
  for (const notebook of notebooks) {
    const folders = notebook.path.split('/')
    findOrCreate(folders, nodes, notebook);
  }
  return nodes;
}

const icons = {
  check: <Icon name="check square"/>,
  uncheck: <Icon name="square outline"/>,
  halfCheck: <Icon name="minus square outline"/>,
  expandClose: <Icon name="chevron right"/>,
  expandOpen: <Icon name="chevron down"/>,
  expandAll: <Icon name="plus square outline"/>,
  collapseAll: <Icon className="rct-icon rct-icon-collapse-all" icon="minus-square"/>,
  parentClose: <Icon name="folder outline"/>,
  parentOpen: <Icon name="folder open outline"/>,
  leaf: <Icon name="file code outline"/>
}

export const NotebookTree = ({notebooks = []}) => {
  const [checked, setChecked] = useState([]);
  const [expanded, setExpanded] = useState([]);
  return <CheckboxTree nodes={makeHierarchy(notebooks)}
                       icons={icons}
                       checked={checked}
                       expanded={expanded}
                       onCheck={newChecked => setChecked(newChecked)}
                       onExpand={newExpanded => setExpanded(newExpanded)}
  />
}

export const NotebookTreeComponent = ({repositoryId, commitId}) => {

  const [{data, loading, error}, refetch] = useAxios(
    `${env('BLUEPRINT_HOST')}/api/v1/repositories/${repositoryId}/commits/${commitId}/notebooks`
  )

  if (loading) return <Dimmer active inverted><Loader inverted>Loading</Loader></Dimmer>
  if (error) return <Message error header='There was some errors with your submission'>
    <Message.Header>Error</Message.Header>
    <p>{JSON.stringify(error)}</p>
  </Message>
  return <NotebookTree notebooks={data}/>

}