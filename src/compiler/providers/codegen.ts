import { awaitSync } from "@kaciras/deasync";
import { dirname } from "path";
import { attachFileToDiagnostics, CompilerOptions, createPrinter, Debug, Diagnostics, DiagnosticWithDetachedLocation, emptyArray, emptyMap, factory, forEachChild, forEachChildRecursively, getLanguageVariant, ImportAttributes, ImportDeclaration, isImportDeclaration, Mutable, Node, NodeFlags, noop, ReadonlyPragmaMap, ScriptKind, ScriptTarget, setParentRecursive, SourceFile, Statement, StringLiteral, SyntaxKind, TransformFlags } from "../_namespaces/ts";
import { printSourceFile as logSourceFileText } from "./debugging.js";
import { createImportDiagnostics, createImportOptionSpecificDiagnostics } from "./diagnostics.js";
import { createImportHash, getImportAttributesAsRecord, getImportingFileNode, getProvidedNameBase, getProvidedNameHash, getSourceFileDirectory, isAsyncTypeProvider, isProvidedName, isSyncTypeProvider } from "./utils";
import { ProviderContext, ProvideSourceFile } from "./types.js";

// TODO(OR): Revise what is exported from the `providers` directory

export function createProvidedSourceFile(fileName: string, importAttributes: ImportAttributes, compilerOptions?: CompilerOptions): SourceFile {
    const importingFile = getImportingFileNode(importAttributes);

    if (!importingFile) {
        return createEmptyFile(fileName, importAttributes);
    }

    const { file, diagnostics } = createProvidedSourceFileWorker(fileName, importAttributes, importingFile, compilerOptions);

    if (diagnostics) {
        const attachedDiganostics = attachFileToDiagnostics(diagnostics, importingFile);
        attachedDiganostics.forEach(d => importingFile.bindDiagnostics.push(d));
    }

    return file ?? createEmptyFile(fileName, importAttributes);
}

function createProvidedSourceFileWorker(fileName: string, importAttributes: ImportAttributes, importingFile: SourceFile, compilerOptions?: CompilerOptions): { file?: SourceFile, diagnostics?: DiagnosticWithDetachedLocation[] } {
    const importingFilePath = getSourceFileDirectory(importingFile);
    const importDeclaration = importAttributes.parent as ImportDeclaration;

    Debug.assert(importingFilePath);
    Debug.assert(isImportDeclaration(importDeclaration));

    const providerOptions = getImportAttributesAsRecord(importAttributes);
    console.log("== OPTIONS ==", providerOptions);

    // TODO(OR): Remove this
    console.log("Creating provided source file", fileName, `'${JSON.stringify(providerOptions)}'`);

    const moduleSpecifier = (importDeclaration.moduleSpecifier as StringLiteral).text;
    const originalModuleName = isProvidedName(moduleSpecifier) ? getProvidedNameBase(moduleSpecifier) : moduleSpecifier;
    const originalFileName = getProvidedNameBase(fileName);

    Debug.assert(originalModuleName);
    Debug.assert(originalFileName);

    const providerPackagePath = dirname(originalFileName);

    const diagnostics: DiagnosticWithDetachedLocation[] = [];
    let providerPackage;
    let provider;

    try {
        providerPackage = require(providerPackagePath);
        provider = providerPackage.default;
    }
    catch {
        const message = Diagnostics.The_module_0_could_not_be_loaded_as_a_type_provider_Try_installing_packages_with_your_package_manager_then_rerun_the_command_or_restart_your_editor;
        diagnostics.push(...createImportDiagnostics(importDeclaration, importingFile, [message], originalModuleName));
        return { diagnostics };
    }

    const context: ProviderContext = {
        importingFilePath,
        importHash: createImportHash(originalModuleName, importAttributes, importingFilePath) ?? "",
        runtimeTarget: compilerOptions?.runtimeTarget
    };

    let providedSourceFile: SourceFile;

    try {
        const provideSourceFile = isSyncTypeProvider(provider)
            ? provider.provideSourceFileSync
            : isAsyncTypeProvider(provider)
                ? ((context, options) => {
                    const promise = provider.provideSourceFileAsync(context, options);
                    return awaitSync(promise);
                }) as ProvideSourceFile<object>
                : undefined;

        if (!provideSourceFile) {
            const message = Diagnostics.The_module_0_does_not_export_a_valid_type_provider_as_the_default_export;
            diagnostics.push(...createImportDiagnostics(importDeclaration.moduleSpecifier, importingFile, [message], originalModuleName));
            return { diagnostics };
        }

        console.log("Retrieving provided source file using", provideSourceFile);

        let providerResult = provideSourceFile(providerOptions, context) ?? {};

        if (providerResult.requiresAsync === true && isAsyncTypeProvider(provider)) {
            // Retry with async
            console.log("Type provider indicated that the specified options are supported only in async mode. Retrying.")
            const promise = provider.provideSourceFileAsync(providerOptions, context);
            providerResult = awaitSync(promise);
        }

        if (providerResult.generalDiagnostics) {
            diagnostics.push(...createImportDiagnostics(importDeclaration, importingFile, providerResult.generalDiagnostics));
        }

        providerResult.optionDiagnostics?.forEach((messages, optionName) => {
            diagnostics.push(...createImportOptionSpecificDiagnostics(optionName, importAttributes, importingFile, messages));
        });

        if (providerResult.sourceFile) {
            providedSourceFile = providerResult.sourceFile as unknown as SourceFile;
        } else {
            return { diagnostics };
        }
    }
    catch {
        console.log("CRASHED PROVIDER CALL");

        const message = Diagnostics.An_unspecified_error_occured_during_type_provider_evaluation;
        const diagnostics = createImportDiagnostics(importDeclaration, importingFile, [message]);
        return { diagnostics };
    }

    configureProvidedSourceFile(providedSourceFile, fileName, importAttributes);

    // TODO(OR): Remove this
    logSourceFileText(providedSourceFile);

    return { file: providedSourceFile, diagnostics };
}

// Based on https://github.com/microsoft/TypeScript/pull/39784
function configureProvidedSourceFile(file: SourceFile, fileName: string, importAttributes: ImportAttributes) {
    (file as Mutable<SourceFile>).flags |= NodeFlags.Ambient;
    (file as Mutable<SourceFile>).flags &= ~NodeFlags.Synthesized;
    (file as Mutable<SourceFile>).kind = SyntaxKind.SourceFile;
    file.identifiers = emptyMap;
    file.referencedFiles = emptyArray;
    file.typeReferenceDirectives = emptyArray;
    file.libReferenceDirectives = emptyArray;
    file.amdDependencies = emptyArray;
    file.hasNoDefaultLib = false;
    file.pragmas = emptyMap as ReadonlyPragmaMap;
    file.parseDiagnostics = [];
    file.isDeclarationFile = false;
    file.fileName = `${fileName}.ts`;
    file.bindDiagnostics = [];
    file.bindSuggestionDiagnostics = undefined;
    file.languageVersion = ScriptTarget.Latest;
    file.languageVariant = getLanguageVariant(ScriptKind.TS);
    file.scriptKind = ScriptKind.Provided;
    file.externalModuleIndicator = file.statements[0];
    file.importAttributes = importAttributes;

    unsynthesizeFile(file);
    (file.endOfFileToken as Mutable<typeof file.endOfFileToken>).pos = file.text.length;
    (file.endOfFileToken as Mutable<typeof file.endOfFileToken>).end = file.text.length;

    // The above sets all node positions, but node _arrays_ still have `-1` for their pos and end.
    // We fix those up to use their constituent start and end positions here.
    fixupNodeArrays(file);

    file.statements.forEach(s => (s as Mutable<Statement>).parent = file);
    setParentRecursive(file, true);

    const setContainsTypeScriptRecursive = (node: Node) => {
        (node as Mutable<Node>).transformFlags |= TransformFlags.ContainsTypeScript;
        forEachChild(node, setContainsTypeScriptRecursive);
    }

    setContainsTypeScriptRecursive(file);
}

// We need the generated AST nodes to behave as a normal nodes parsed from a text file in the rest of the compiler.
// To achieve this, we need to remove the Synthesized flag and set their text position start and end.
const unsynthetizationPrinter = createPrinter({}, {
    onEmitNode(hint, node, cb, getTextPos) {
        const start = getTextPos();
        cb(hint, node);
        if (node) {
            (node as Mutable<typeof node>).flags &= ~NodeFlags.Synthesized;
            (node as Mutable<typeof node>).pos = start;
            (node as Mutable<typeof node>).end = getTextPos();
        }
    },
});

function unsynthesizeFile(file: SourceFile) {
    file.text = unsynthetizationPrinter.printFile(file);
}

function fixupNodeArrays(node: Node) {
    forEachChildRecursively(node, noop, (arr) => {
        if (arr.length) {
            (arr as Mutable<typeof arr>).pos = arr[0].pos;
            (arr as Mutable<typeof arr>).end = arr[arr.length - 1].end;
        }
    });
}

function createEmptyFile(fileName: string, importAttributes: ImportAttributes): SourceFile {
    const emptyExport = factory.createExportDeclaration(/*modifiers*/ undefined, /*isTypeOnly*/ false, factory.createNamedExports([]));
    const file = factory.createSourceFile([emptyExport], factory.createToken(SyntaxKind.EndOfFileToken), NodeFlags.None);
    configureProvidedSourceFile(file, fileName, importAttributes);
    return file;
}
