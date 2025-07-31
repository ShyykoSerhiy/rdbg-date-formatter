import * as vscode from 'vscode';

const formatDate = (date: Date) => {
    // Get the components of the date
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
    // Format the date string
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} +0000`;
    
    return formattedDate;
};

const parse = (isFloat: boolean, value?: string) => {
    const val = value || '';
    return isFloat ? parseFloat(val) : parseInt(val);
};

const mutateToIncludeDateIfNeeded = (variable: {
    [key: string]: string | undefined;
    type: string;
    value?: string;
    result?: string;
}) => {
    const minDate = vscode.workspace.getConfiguration('rdbg-date-formatter').get<number>('minDate', /**2000.01.01*/ 946684800);
    const maxDate = vscode.workspace.getConfiguration('rdbg-date-formatter').get<number>('maxDate', /**2071.09.08*/ 2208988800);

    const isFloat = variable && variable.type === "Float";
    const isInteger = variable && variable.type === "Integer";

    if (isFloat || isInteger) {
        const key = variable.result ? "result" : "value";       
        const value = parse(isFloat, variable[key]);
        if (minDate < value && value < maxDate) {
            variable[key] = `${value} (${formatDate(new Date(value * 1000))})`;
        }
    }
};

export function activate(context: vscode.ExtensionContext) {
	console.log('rdbg-date-formatter is now active!');    
    
	const disposable = vscode.debug.registerDebugAdapterTrackerFactory('rdbg', {
		createDebugAdapterTracker(_session) {
		  return {
			onDidSendMessage: message => {
				if (message && message.type === "response" && (message.message === "Success" || message.success)) {
                    const { body } = message;
                    if (message.command === "evaluate") {
                        mutateToIncludeDateIfNeeded(body);
                    } else if (message.command === "variables") {
                        const { variables } = body;
                        if (variables) {
                            variables.forEach(mutateToIncludeDateIfNeeded);
                        }
                    }
                }
			},
		  };
		}
	  });
	
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
