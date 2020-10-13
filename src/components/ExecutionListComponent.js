import useAxios from "axios-hooks"
import env from "@beam-australia/react-env"
import React, { useEffect } from "react"
import { ExecutionList } from "./Executions"

const ExecutionListComponent = ({interval = 5000}) => {

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

export default ExecutionListComponent