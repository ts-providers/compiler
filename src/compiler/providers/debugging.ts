export const providerPackagePrefix = "@ts-providers";
export const providerPackageIndex = "@ts-providers/csv/dist/index.d.ts";
const printLog = false;
const printTrace = false;

export function logIfProviderFile(fileName: string, actionName: string, ...args: any[]) {
    if (printLog && fileName) {
        console.log(`${actionName}\n${fileName}`);
        for (const arg of args) {
            console.log(arg);
        }
        if (printTrace) {
            console.trace();
        }
        console.log();
    }
}

