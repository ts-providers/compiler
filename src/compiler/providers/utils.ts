import { Identifier, ImportAttributes, StringLiteral } from "../types";
import { ProviderOptions } from "./types";

export function getProviderSamplePath(importAttributes?: ImportAttributes): string | undefined {
    if (!importAttributes) {
        return undefined;
    }

    const attribute = importAttributes.elements.find(a => (a.name as Identifier).escapedText === "sample");
    return attribute ? (attribute.value as StringLiteral).text : undefined;
}

export function getImportAttributeProperties(attributes?: ImportAttributes) {
    return attributes?.elements.map(e => ({ key: (e.name as Identifier).escapedText, value: (e.value as StringLiteral).text }));
}

export function getProviderOptionsFromImportAttributes(attributes?: ImportAttributes): ProviderOptions {
    const result: Record<string, string> = {};

    if (attributes) {
        const keyValuePairs = getImportAttributeProperties(attributes) ?? [];
        for (const kv of keyValuePairs) {
            result[kv.key as string] = kv.value;
        }
    }

    return result as ProviderOptions;
}

export function getFileNameWithSample(fileName: string, samplePath: string): string {
    const sanitizedSamplePath = samplePath.replace(":", "_").replace("/", "_");
    const result = fileName + "____" + sanitizedSamplePath + ".d.ts";
    return result.toLowerCase();
}

export function getModuleNameWithSample(moduleName: string, samplePath: string): string {
    console.log("ADDING SUFFIX TO MODULE NAME", moduleName, samplePath);
    const sanitizedSamplePath = samplePath.replace(":", "_").replace("/", "_");
    const result = moduleName + "__" + sanitizedSamplePath;
    return result;
}

export function generateHash(length = 6): string {
    return ((Math.random() + 1).toString(36).substring(length));
}

// export function getFileNameWithSample(fileName: string, samplePath: string): string {
//     return fileName;
// }

// export function getModuleNameWithSample(moduleName: string, samplePath: string): string {
//     return moduleName;
// }
