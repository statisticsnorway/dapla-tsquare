# dapla-tsquare

## Overview
A React front-end application for statisctis production automation. The application gives the user 
the possibility to build execution plans based on Jupyter notebooks in a GitHub repo, to view these in 
the form of a Directional Acyclic Graph (DAG), to execute the execution plan and monitor its progress. 

## Usage
This application communicates with the services [dapla-blueprint](https://github.com/statisticsnorway/dapla-blueprint) 
and [dapla-blueprint-execution](https://github.com/statisticsnorway/dapla-blueprint-execution). Set the 
address to these services in the .ENV file, whether you run them locally or somewhere else.

Run `npm start` or `yarn start` to start the application and navigate to http://localhost:3000
