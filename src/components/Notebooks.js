import React, { useEffect, useState } from 'react'
import CheckboxTree from 'react-checkbox-tree';
import { Dimmer, Icon, Loader, Message, Popup } from 'semantic-ui-react'

import 'react-checkbox-tree/lib/react-checkbox-tree.css';
import env from "@beam-australia/react-env";
import useAxios from "axios-hooks";

const makeHierarchy = (notebooks, created, updated, showCheckboxes, endJobsNotebookIds, checked) => {

  const containsChanges = (created, updated, leaf) => {
    return !!(created?.filter(n => n.id === leaf.id).length > 0
      || updated?.filter(n => n.id === leaf.id).length > 0);

  }

  const findOrCreate = (folders, nodes = [], leaf, created, updated) => {
    const folder = folders.shift()
    if (folders.length === 0) {
      nodes.push({
        value: leaf.id,
        label: folder
      });
    } else {
      let node = nodes.find(e => e.value === folder);
      if (node === undefined) {
        if (containsChanges(created, updated, leaf) === true) {
          node = { value: folder, label: <span style={{fontWeight: "bold"}}>{folder}</span>,
            children: [] }
        } else {
          node = {value: folder, label: folder, children: []}
        }
        nodes.push(node);
      }
      if (folders.length > 0) {
        findOrCreate(folders, node.children, leaf, created, updated)
      }
    }
  }

  const nodes = [];
  for (const notebook of notebooks) {
    const folders = notebook.path.split('/')
    findOrCreate(folders, nodes, notebook, created, updated);
  }

  /**
   * - Remove checkbox for all folders
   * - Remove checkbox for notebooks if <code>showCheckboxes === true</code>
   * - Disable checkbox if notebook is checked and not a end node in the execution graph
   * - Mark Notebooks as modified or added
   *
   * @param nodes Notebok tree nodes
   * @param endJobsNotebookIds List of end nodes in execution graph
   * @param checked List of checked Notebooks
   */
  const setNodeStatus = (nodes, endJobsNotebookIds, checked, created, updated) => {
    for (const node of nodes) {
      if (node.children) {
        node.showCheckbox = false;
        setNodeStatus(node.children, endJobsNotebookIds, checked, created, updated)
      } else {
        node.showCheckbox = showCheckboxes;

        // Disable if implicitly checked by dependency
        if (checked.includes(node.value) && !endJobsNotebookIds.includes(node.value)) {
          node.disabled = true;
        }

        // Mark Notebok as modified or added
        if (created?.length > 0 && created.filter(notebook => notebook.id === node.value).length > 0) {
          node.label = <span style={{ color: "green" }}>*{node.label}</span>
        } else if (updated?.length > 0 && updated.filter(notebook => notebook.id === node.value).length > 0) {
          node.label= <span style={{ color: "blue" }}>~{node.label}</span>
        }
      }
    }
  }

  setNodeStatus(nodes, endJobsNotebookIds, checked, created, updated);
  return nodes;
}

const icons = {
  check: <Icon fitted name="check square"/>,
  uncheck: <Icon fitted name="square outline"/>,
  halfCheck: <Icon fitted name="minus square outline"/>,
  expandClose: <Icon fitted name="chevron right"/>,
  expandOpen: <Icon fitted name="chevron down"/>,
  expandAll: <Icon fitted name="plus square outline"/>,
  collapseAll: <Icon fitted className="rct-icon rct-icon-collapse-all" icon="minus-square"/>,
  parentClose: <Icon fitted name="folder outline"/>,
  parentOpen: <Icon fitted name="folder open outline"/>,
  leaf: <Icon fitted name="file code outline"/>
}

export const NotebookTree =
  ({
     notebooks = [], onSelect = () => {
    }, created = [], updated = [], disabled, showCheckboxes, checkedNotebooks, endJobsNotebookIds
   }) => {

  const [checked, setChecked] = useState([]);
  const [expanded, setExpanded] = useState([]);

    useEffect(() => {
      setChecked(checkedNotebooks);
    }, [checkedNotebooks, setChecked]);

    useEffect( () => {
      calculateExpanded();
    }, [setExpanded])

    const calculateExpanded = () => {
      for (const notebook of notebooks) {
        if (checkedNotebooks.includes(notebook.id)) {
          let folders = notebook.path.split('/');
          if (folders.length > 1) {
            folders.pop()
          }
          setExpanded(expanded => expanded.concat(folders))
        }
      }

  }

  function select(checked) {
    setChecked(checked);
    onSelect(checked);
  }

  return <CheckboxTree nodes={makeHierarchy(notebooks, created, updated, showCheckboxes, endJobsNotebookIds, checked)}
                       icons={icons}
                       checked={checked}
                       expanded={expanded}
                       onCheck={newChecked => select(newChecked)}
                       onExpand={newExpanded => setExpanded(newExpanded)}
                       disabled={disabled}
  />
}

export const NotebookTreeComponent =
  ({repositoryId, commitId, onSelect, created, updated, disabled, showCheckboxes, endJobsNotebookIds, checked = []}) => {

  const [{data, loading, error}] = useAxios(
    `${env('BLUEPRINT_HOST')}/api/v1/repositories/${repositoryId}/commits/${commitId}/notebooks`
  )

  if (loading) return <Dimmer active inverted><Loader inverted>Loading</Loader></Dimmer>
  if (error) return <Message error header='There was some errors with your submission'>
    <Message.Header>Error</Message.Header>
    <p>{JSON.stringify(error)}</p>
  </Message>
  return <NotebookTree
    notebooks={data}
    onSelect={onSelect}
    created={created}
    updated={updated}
    disabled={disabled}
    showCheckboxes={showCheckboxes}
    checkedNotebooks={checked}
    endJobsNotebookIds={endJobsNotebookIds}
  />

}