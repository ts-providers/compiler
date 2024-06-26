import { NotUndefined, sha1 } from "object-hash";
import { Identifier, ImportAttributes, StringLiteral } from "../types";
import { Debug } from "../_namespaces/ts";

export const providedNameSeparator = "|";
export const providedNamePrefix = `Provided${providedNameSeparator}`;

export function isProvidedName(name: string): boolean {
    return name.startsWith(providedNamePrefix);
}

export function getProvidedFileName(fileName: string, packageName: string, importAttributes: ImportAttributes): string {
    return `${providedNamePrefix}${fileName}${providedNameSeparator}${getProvidedImportHash(packageName, importAttributes)}`;
}


export function getProvidedModuleName(packageName: string, importAttributes: ImportAttributes): string {
    return `${providedNamePrefix}${packageName}${providedNameSeparator}${getProvidedImportHash(packageName, importAttributes)}`;
}

export function getProvidedImportHash(packageName: string, importAttributes: ImportAttributes): string {
    Debug.assert(importAttributes !== undefined);
    Debug.assert(!isProvidedName(packageName));
    const importOptions = getImportAttributesAsKeyValuePairs(importAttributes);
    const result = createObjectHash({ packageName, importOptions });
    // console.log("PROVIDER HASH", packageName, importOptions, result);
    return result;
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

export function getImportAttributesAsKeyValuePairs(attributes?: ImportAttributes) {
    return attributes?.elements.map(e => ({ key: (e.name as Identifier).escapedText, value: (e.value as StringLiteral).text }));
}

export function getImportAttributesAsRecord(attributes?: ImportAttributes): Record<string, string> {
    const result: Record<string, string> = {};

    if (attributes) {
        const keyValuePairs = getImportAttributesAsKeyValuePairs(attributes) ?? [];
        for (const kv of keyValuePairs) {
            result[kv.key as string] = kv.value;
        }
    }

    return result;
}
