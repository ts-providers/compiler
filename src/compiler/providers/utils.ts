import { NotUndefined, sha1 } from "object-hash";
import { Identifier, ImportAttributes, SourceFile, StringLiteral } from "../types";
import { Debug, getDirectoryPath } from "../_namespaces/ts";
import { AsyncTypeProvider, SyncTypeProvider } from "./interfaces.js";

const providedNameSeparator = "|";
const providedNamePrefix = `Provided${providedNameSeparator}`;

export function isProvidedName(name?: string): boolean {
    return name?.startsWith(providedNamePrefix) ?? false;
}

export function createProvidedFileName(fileName: string, packageName: string, importAttributes: ImportAttributes, importingFilePath?: string): string {
    return `${providedNamePrefix}${fileName}${providedNameSeparator}${createImportHash(packageName, importAttributes, importingFilePath)}`;
}

export function createProvidedModuleName(packageName: string, importAttributes: ImportAttributes, importingFilePath?: string): string {
    return `${providedNamePrefix}${packageName}${providedNameSeparator}${createImportHash(packageName, importAttributes, importingFilePath)}`;
}

export function getProvidedNameBase(providedName?: string): string | undefined {
    return providedName?.split(providedNameSeparator)[1];
}

export function getProvidedNameHash(providedName?: string): string | undefined {
    return providedName?.split(providedNameSeparator)[2];
}

function createImportHash(packageName: string, importAttributes: ImportAttributes, importingFilePath?: string): string {
    Debug.assert(importAttributes);
    Debug.assert(!isProvidedName(packageName));
    const importOptions = getImportAttributesAsKeyValuePairs(importAttributes);
    const importingFileDirectory = importingFilePath ? getDirectoryPath(importingFilePath) : getSourceFileDirectory(getImportingFileNode(importAttributes));
    Debug.assert(importingFileDirectory);
    const result = createObjectHash({ packageName, importOptions, importingFileDirectory });
    console.log("PROVIDER HASH", packageName, importingFileDirectory, importOptions, result);
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

export function getImportingFileNode(attributes?: ImportAttributes): SourceFile| undefined {
    return (attributes?.parent?.parent as SourceFile);
}

export function getSourceFileDirectory(sourceFile?: SourceFile): string | undefined {
    const filePath = sourceFile?.fileName;
    return filePath ? getDirectoryPath(filePath) : undefined;
}

export function isSyncTypeProvider(instance: unknown): instance is SyncTypeProvider<{}> {
    return typeof (instance as SyncTypeProvider<{}>)?.provideDeclarationsSync === "function";
}

export function isAsyncTypeProvider(instance: unknown): instance is AsyncTypeProvider<{}> {
    return typeof (instance as AsyncTypeProvider<{}>)?.provideDeclarationsAsync === "function";
}
