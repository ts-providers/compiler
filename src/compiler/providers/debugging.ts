import { Identifier, ImportAttributes, StringLiteral } from "../types";

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

export function getImportAttributeProperties(attributes?: ImportAttributes) {
    return attributes?.elements.map(e => ({ key: (e.name as Identifier).escapedText, value: (e.value as StringLiteral).text }));
}
