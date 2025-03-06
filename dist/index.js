require('./sourcemap-register.js');/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 781:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 869:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 460:
/***/ ((module) => {

"use strict";
module.exports = require("timers/promises");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
const core = __nccwpck_require__(781);
const github = __nccwpck_require__(869);
const { setTimeout } = __nccwpck_require__(460);

async function run() {
  try {
    // Get inputs
    const targetRepo = core.getInput('target_repo', { required: true });
    const workflowId = core.getInput('workflow_id', { required: true });
    const token = core.getInput('github_token', { required: true });
    const ref = core.getInput('ref');
    const inputsJson = core.getInput('inputs');
    const waitInterval = parseInt(core.getInput('wait_interval'), 10);
    const timeout = parseInt(core.getInput('timeout'), 10);
    
    let workflowInputs = {};
    if (inputsJson) {
      try {
        workflowInputs = JSON.parse(inputsJson);
      } catch (error) {
        throw new Error(`Failed to parse inputs JSON: ${error.message}`);
      }
    }
    
    // Create an octokit client
    const octokit = github.getOctokit(token);
    const [owner, repo] = targetRepo.split('/');
    
    // Record timestamp before triggering the workflow
    const triggerTime = new Date();
    
    // Trigger the workflow
    core.info(`Triggering workflow "${workflowId}" in repository "${targetRepo}" on ref "${ref}" at ${triggerTime.toISOString()}`);

    core.info(`API call parameters: 
      owner: ${owner}
      repo: ${repo}
      workflow_id: ${workflowId}
      ref: ${ref}
      inputs: ${JSON.stringify(workflowInputs)}
    `);
    
    const dispatchResponse = await octokit.rest.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: workflowId,
      ref,
      inputs: workflowInputs
    });
    
    if (dispatchResponse.status !== 204) {
      throw new Error(`Failed to trigger workflow. Status: ${dispatchResponse.status}`);
    }
    
    core.info('Workflow triggered successfully. Waiting for it to start...');
    
    // Wait for the workflow to start and get run ID
    let runId = null;
    const startTime = Date.now();
    
    while (!runId) {
      if (Date.now() - startTime > timeout * 1000) {
        throw new Error('Timed out waiting for workflow to start');
      }
      
      // List recent workflow runs
      const runsResponse = await octokit.rest.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: workflowId,
        branch: ref,
        // Add event type if you know it (e.g., 'workflow_dispatch')
        // event: 'workflow_dispatch'
      });
      
      // Find the most recent run that was created after we dispatched
      const recentRuns = runsResponse.data.workflow_runs;
      
      // Look for runs created after our trigger time
      const newRun = recentRuns.find(run => {
        const runCreatedAt = new Date(run.created_at);
        return runCreatedAt > triggerTime;
      });
      
      if (newRun) {
        runId = newRun.id;
        core.info(`Workflow started with run ID: ${runId}`);
        core.info(`Run created at: ${newRun.created_at}, which is after our trigger time: ${triggerTime.toISOString()}`);
        core.setOutput('run_id', `${runId}`);
        core.setOutput('workflow_url', newRun.html_url);
      } else {
        core.info('Workflow not yet started. Waiting...');
        await setTimeout(waitInterval * 1000);
      }
    }
    
    // Wait for workflow completion
    let workflowCompleted = false;
    
    while (!workflowCompleted) {
      if (Date.now() - startTime > timeout * 1000) {
        throw new Error('Timed out waiting for workflow to complete');
      }
      
      const runResponse = await octokit.rest.actions.getWorkflowRun({
        owner,
        repo,
        run_id: runId
      });
      
      const status = runResponse.data.status;
      const conclusion = runResponse.data.conclusion;
      
      core.info(`Workflow status: ${status}, conclusion: ${conclusion || 'N/A'}`);
      
      if (status === 'completed') {
        workflowCompleted = true;
        core.setOutput('status', status);
        core.setOutput('conclusion', conclusion);
        
        if (conclusion !== 'success') {
          core.setFailed(`Remote workflow completed with status: ${conclusion}`);
        } else {
          core.info('Remote workflow completed successfully!');
        }
      } else {
        core.info(`Waiting for workflow to complete. Current status: ${status}`);
        await setTimeout(waitInterval * 1000);
      }
    }
    
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

run();
module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=index.js.map