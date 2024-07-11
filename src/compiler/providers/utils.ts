import { NotUndefined, sha1 } from "object-hash";
import { Identifier, ImportAttributes, SourceFile, StringLiteral, SyntaxKind } from "../types";
import { Debug, getDirectoryPath, isBooleanLiteral, isIdentifier, isNumericLiteral, isStringLiteralLike } from "../_namespaces/ts";
import { AsyncTypeProvider, SyncTypeProvider } from "./types.js";

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
    return providedName?.split(providedNameSeparator)[2].split(".")[0];
}

export function createImportHash(packageName: string, importAttributes: ImportAttributes, importingFilePath?: string): string {
    Debug.assert(!isProvidedName(packageName));
    const importOptions = getImportAttributesAsKeyValuePairs(importAttributes) ?? [];
    const importingFileDirectory = importingFilePath ? getDirectoryPath(importingFilePath) : getSourceFileDirectory(getImportingFileNode(importAttributes));
    const result = createObjectHash({ packageName, importOptions, importingFileDirectory });
    // console.log("PROVIDER HASH", packageName, importingFileDirectory, importOptions, result);
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
    return attributes?.elements.map(e => {
        const key = isIdentifier(e.name) ? e.name.escapedText : (e.name as StringLiteral).text;
        const value = isNumericLiteral(e.value)
                ? Number(e.value.text)
                : isBooleanLiteral(e.value)
                    ? e.value.kind === SyntaxKind.TrueKeyword
                    : (e.value as StringLiteral).text;

        return { key, value };
    });
}

export function getImportAttributesAsRecord(attributes?: ImportAttributes): Record<string, string | number | boolean> {
    const result: Record<string, string | number | boolean> = {};

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
    return typeof (instance as SyncTypeProvider<{}>)?.provideSourceFileSync === "function";
}

export function isAsyncTypeProvider(instance: unknown): instance is AsyncTypeProvider<{}> {
    return typeof (instance as AsyncTypeProvider<{}>)?.provideSourceFileAsync === "function";
}
