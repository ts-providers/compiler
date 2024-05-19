export const providerPackagePrefix = "@ts-providers/csv/dist/index.d.ts";
export const providerPrintTrace = true;

export function logIfProviderFile(fileName: string, actionName: string, ...args: any[]) {
    if (fileName && fileName.includes(providerPackagePrefix)) {
        console.log(`${actionName}\n${fileName}`);
        for (const arg of args) {
            console.log(arg);
        }
        if (providerPrintTrace) {
            console.trace();
        }
        console.log();
    }
}

