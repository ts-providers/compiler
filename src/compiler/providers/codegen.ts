import deasync from "deasync";
import { dirname } from "path";
import { createPrinter, createSourceFile, Debug, emptyArray, emptyMap, forEachChild, forEachChildRecursively, getDirectoryPath, getLanguageVariant, ImportAttributes, Mutable, NewLineKind, Node, NodeFlags, noop, ReadonlyPragmaMap, ScriptKind, ScriptTarget, setParentRecursive, SourceFile, Statement, SyntaxKind, TransformFlags } from "../_namespaces/ts";
import { getImportAttributesAsRecord, getImportingFileDirectory, providedNameSeparator } from "./utils";

export function createProvidedSourceFile(fileName: string, importAttributes: ImportAttributes, setParentNodes: boolean): SourceFile {
    const providerOptions = getImportAttributesAsRecord(importAttributes);
    console.log("CREATING PROVIDED SOURCE FILE", fileName, `OPTIONS: '${JSON.stringify(providerOptions)}'`);

    const originalFileName = fileName.split(providedNameSeparator)[1];
    let providedSourceFile: SourceFile;

    const providerPackagePath = dirname(originalFileName);
    const providerPackage = require(providerPackagePath);
    const providerGenerator = providerPackage.default;
    const importingFilePath = getImportingFileDirectory(importAttributes);
    Debug.assert(importingFilePath);

    const context = { importingFilePath };

    if (typeof providerGenerator.provideDeclarationsSync === "function") {
        const result = providerGenerator.provideDeclarationsSync(context, providerOptions);
        providedSourceFile = result.sourceFile;
    } else if (typeof providerGenerator.provideDeclarationsAsync === "function") {
        const deasyncProvideDeclarations = deasync(providerGenerator.provideDeclarationsAsync) as (context: unknown, options: unknown) => { sourceFile: SourceFile };
        const result = deasyncProvideDeclarations(context, providerOptions);
        providedSourceFile = result.sourceFile;
    } else {
        console.error("INVALID PROVIDER PACKAGE");
        return createEmptyFile(fileName);
    }

    const file = configureVirtualSourceFile(providedSourceFile, fileName);

    if (setParentNodes) {
        file.statements.forEach(s => (s as Mutable<Statement>).parent = file);
        setParentRecursive(file, true);
    }

    const recurse = (node: Node) => {
        (node as Mutable<Node>).transformFlags |= TransformFlags.ContainsTypeScript;
        forEachChild(node, recurse);
    }

    recurse(file);

    const printer = createPrinter({
        newLine: NewLineKind.LineFeed,
        removeComments: false,
        omitTrailingSemicolon: true
    });

    console.log("PROVIDED FILE:", fileName);
    console.log(printer.printFile(file));

    file.importAttributes = importAttributes;

    return file;
}

// Based on https://github.com/microsoft/TypeScript/pull/39784
function configureVirtualSourceFile(file: SourceFile, fileName: string): SourceFile {
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


    unsynthesizeFile(file);
    (file.endOfFileToken as Mutable<typeof file.endOfFileToken>).pos = file.text.length;
    (file.endOfFileToken as Mutable<typeof file.endOfFileToken>).end = file.text.length;

    // The above sets all node positions, but node _arrays_ still have `-1` for their pos and end.
    // We fix those up to use their constituent start and end positions here.
    fixupNodeArrays(file);

    return file;
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

function createEmptyFile(fileName: string) {
    return createSourceFile(fileName, "", ScriptTarget.ES5, /*isProvided*/ true);
}
