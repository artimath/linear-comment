import * as vscode from "vscode";
import {
  simpleGit,
  SimpleGit,
  CleanOptions,
  SimpleGitOptions,
} from "simple-git";

const git: SimpleGit = simpleGit().clean(CleanOptions.FORCE);

import {
  LinearClient,
  LinearDocument,
  LinearError,
  LinearFetch,
} from "@linear/sdk";

let linearClient: LinearClient;

function initLinearClient(apiKey: string) {
  linearClient = new LinearClient({
    apiKey: apiKey,
  });
}

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "linear-comment" is now active!'
  );

  const apiKey = "lin_api_aCbVu3PgegnNfolLaMWZRThXVET2v9cnR2IzThu2";
  initLinearClient(apiKey);

  const disposable = vscode.commands.registerCommand(
    "linear-comment.addComment",
    async () => {
      if (!vscode.workspace.workspaceFolders?.[0].uri.fsPath) {
        vscode.window.showErrorMessage(
          "Please open a workspace to use this extension"
        );
        return;
      }

      const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

      if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder found");
      } else {
        const options: Partial<SimpleGitOptions> = {
          baseDir: workspaceFolder,
          binary: "git",
          maxConcurrentProcesses: 6,
          trimmed: false,
        };

        const git: SimpleGit = simpleGit(options);

        try {
          const branch = (await git.revparse(["--abbrev-ref", "HEAD"])).trim();
          console.log(branch);
          if (!branch) {
            throw new Error();
          }
          const comment = await vscode.window.showInputBox({
            prompt: "Enter your comment for the active issue",
          });

          if (comment) {
            await commentOnIssueByBranchName(branch, comment);
          } else {
            vscode.window.showErrorMessage("Please enter a valid comment");
          }
        } catch (error) {
          vscode.window.showErrorMessage(
            "Linear: Unable to determine the current Git branch"
          );
          return;
        }
      }
    }
  );

  context.subscriptions.push(disposable);
}

async function createComment(input: LinearDocument.CommentCreateInput) {
  try {
    /** Try to create a comment */
    const commentPayload = await linearClient.createComment(input);
    /** Return it if available */
    return commentPayload.comment;
  } catch (error) {
    /** The error has been parsed by Linear Client */
    throw error;
  }
}

async function commentOnIssueByBranchName(branchName: string, comment: string) {
  try {
    const issueResult = await linearClient.issueVcsBranchSearch(branchName);

    if (issueResult) {
      const commentPayload = await createComment({
        issueId: issueResult.id,
        body: comment,
      });
      vscode.window.showInformationMessage(
        `Comment added to issue ${issueResult.title}`
      );
    } else {
      vscode.window.showErrorMessage(
        `No issue found with branch name ${branchName}`
      );
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      vscode.window.showErrorMessage(
        `Error while searching for and commenting on an issue: ${error.message}`
      );
    } else {
      vscode.window.showErrorMessage("An unexpected error occurred");
    }
  }
}

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

// // This method is called when your extension is activated
// // Your extension is activated the very first time the command is executed
// export function activate(context: vscode.ExtensionContext) {

// 	// Use the console to output diagnostic information (console.log) and errors (console.error)
// 	// This line of code will only be executed once when your extension is activated
// 	console.log('Congratulations, your extension "linear-comment" is now active!');

// 	// The command has been defined in the package.json file
// 	// Now provide the implementation of the command with registerCommand
// 	// The commandId parameter must match the command field in package.json
// 	let disposable = vscode.commands.registerCommand('linear-comment.helloWorld', () => {
// 		// The code you place here will be executed every time your command is executed
// 		// Display a message box to the user
// 		vscode.window.showInformationMessage('Hello World from linear-comment!');
// 	});

// 	context.subscriptions.push(disposable);
// }

// // This method is called when your extension is deactivated
// export function deactivate() {}
