import { NotUndefined, sha1 } from "object-hash";
import { Identifier, ImportAttributes, StringLiteral } from "../types";
import { ProviderOptions } from "./types";
import { Debug } from "../_namespaces/ts";

export const providedNameSeparator = "|";
export const providedNamePrefix = `Provided${providedNameSeparator}`;

export function isProvidedModuleName(name: string): boolean {
    return name.startsWith(providedNamePrefix);
}

export function getProvidedFileName(fileName: string, importAttributes: ImportAttributes): string {
    return `${providedNamePrefix}${fileName}${providedNameSeparator}${getProvidedImportIdentifier(importAttributes)}`;
}


export function getProvidedModuleName(packageName: string, importAttributes: ImportAttributes): string {
    return `${providedNamePrefix}${packageName}${providedNameSeparator}${getProvidedImportIdentifier(importAttributes)}`;
}

export function getProvidedImportIdentifier(importAttributes: ImportAttributes): string {
    Debug.assert(importAttributes !== undefined);
    return createObjectHash(importAttributes);
}

function createObjectHash<T extends NotUndefined>(instance: T): string {
    return sha1(instance);
}

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

// export function getFileNameWithSample(fileName: string, samplePath: string): string {
//     const sanitizedSamplePath = samplePath.replace(":", "_").replace("/", "_");
//     const result = fileName + "____" + sanitizedSamplePath + ".d.ts";
//     return result.toLowerCase();
// }

// export function getModuleNameWithSample(moduleName: string, samplePath: string): string {
//     console.trace("ADDING SUFFIX TO MODULE NAME", moduleName, samplePath);
//     const sanitizedSamplePath = samplePath.replace(":", "_").replace("/", "_");
//     const result = moduleName + "__" + sanitizedSamplePath;
//     return result;
// }

export function generateHash(length = 6): string {
    return ((Math.random() + 1).toString(36).substring(length));
}

// export function getFileNameWithSample(fileName: string, samplePath: string): string {
//     return fileName;
// }

// export function getModuleNameWithSample(moduleName: string, samplePath: string): string {
//     return moduleName;
// }
