import { CompilerOptions, getAreDeclarationMapsEnabled, getEmitDeclarations, getEmitModuleKind, ModuleKind, SourceFile } from "../_namespaces/ts.js";
import { getProvidedNameHash } from "./utils.js";

export const providedOutDir = "_provided";

export function getOutputPathsForProvidedFile(sourceFile: SourceFile, compilerOptions: CompilerOptions) {
    // TODO(OR): Handle case when outDir is not set properly
    // TODO(OR): Handle case when outFile is used

    const outDir = compilerOptions.outDir!;
    const moduleKind = getEmitModuleKind(compilerOptions);
    const extensionPrefix = getExtensionPrefixByModuleKind(moduleKind);
    const hash = getProvidedNameHash(sourceFile.fileName);

    const jsFilePath = !compilerOptions.emitDeclarationOnly ? `${outDir}/${providedOutDir}/${hash}.${extensionPrefix}js` : undefined;
    const sourceMapFilePath = jsFilePath ? `${outDir}/${providedOutDir}/${hash}.${extensionPrefix}js.map` : undefined;
    const declarationFilePath = getEmitDeclarations(compilerOptions) ? `${outDir}/${providedOutDir}/${hash}.d.${extensionPrefix}ts` : undefined;
    const declarationMapPath = getAreDeclarationMapsEnabled(compilerOptions) ? `${outDir}/${providedOutDir}/${hash}.d.${extensionPrefix}ts.map` : undefined;
    return {
        jsFilePath, sourceMapFilePath, declarationFilePath, declarationMapPath
    }
}

export function getExtensionPrefixByModuleKind(moduleKind: ModuleKind): string {
    switch (moduleKind) {
        case ModuleKind.CommonJS:
        case ModuleKind.Node16:
        case ModuleKind.NodeNext:
            return "c";
        case ModuleKind.ES2015:
        case ModuleKind.ES2020:
        case ModuleKind.ES2022:
        case ModuleKind.ESNext:
            return "m";
        default:
            return "";
    }
}
