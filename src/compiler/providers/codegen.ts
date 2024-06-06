import deasync from "deasync";
import { dirname } from "path";
import { createNodeFactory, createPrinter, createSourceFile, emptyArray, emptyMap, forEachChildRecursively, getLanguageVariant, ImportAttributes, Mutable, NewLineKind, Node, NodeFactoryFlags, NodeFlags, noop, parseBaseNodeFactory, ReadonlyPragmaMap, ScriptKind, ScriptTarget, setParentRecursive, SourceFile, Statement, SyntaxKind } from "../_namespaces/ts";
import { getProviderOptionsFromImportAttributes, providedNameSeparator } from "./utils";

export function createProvidedSourceFile(fileName: string, importAttributes: ImportAttributes, setParentNodes: boolean): SourceFile {
    const providerOptions = getProviderOptionsFromImportAttributes(importAttributes);
    console.log("CREATING PROVIDED SOURCE FILE", fileName, `OPTIONS: '${JSON.stringify(providerOptions)}'`);

    const originalFileName = fileName.split(providedNameSeparator)[1];
    let providedSourceFile: SourceFile;

    const providerPackagePath = dirname(originalFileName);
    const providerPackage = require(providerPackagePath);
    const providerGenerator = providerPackage.default;

    if (typeof providerGenerator.provideDeclarationsSync === "function") {
        const result = providerGenerator.provideDeclarationsSync(providerOptions);
        providedSourceFile = result.sourceFile;
    } else if (typeof providerGenerator.provideDeclarationsAsync === "function") {
        const deasyncProvideDeclarations = deasync(providerGenerator.provideDeclarationsAsync) as (options: unknown) => { sourceFile: SourceFile };
        const result = deasyncProvideDeclarations(providerOptions);
        providedSourceFile = result.sourceFile;
    } else {
        console.error("INVALID PROVIDER PACKAGE");
        return createSourceFile(fileName, "", ScriptTarget.ES5, /*isProvided*/ false);
    }

    console.log("PROVIDER RESULT", providedSourceFile?.fileName, providedSourceFile?.statements.length, providedSourceFile.statements.map(s => s.kind));

    // const printer2 = createPrinter({
    //     newLine: NewLineKind.LineFeed,
    //     removeComments: false,
    //     omitTrailingSemicolon: true
    // });

    // console.log("PROVIDED FILE:", fileName);
    // console.log(printer2.printFile(providedSourceFile));

    const declFile = configureVirtualSourceFile(providedSourceFile, fileName);

    console.log("PROVIDED FILE CONFIGURED", providedSourceFile?.fileName);

    if (setParentNodes) {
        declFile.statements.forEach(s => (s as Mutable<Statement>).parent = declFile);
        setParentRecursive(declFile, true);
    }

    console.log("PARENT NODES SET");

    const printer = createPrinter({
        newLine: NewLineKind.LineFeed,
        removeComments: false,
        omitTrailingSemicolon: true
    });

    console.log("PROVIDED FILE:", fileName);
    console.log(printer.printFile(declFile));

    declFile.importAttributes = importAttributes;

    return declFile;
}

// Based on https://github.com/microsoft/TypeScript/pull/39784
function configureVirtualSourceFile(file: SourceFile, fileName: string): SourceFile {
    finishNode(file);
    file.referencedFiles = emptyArray;
    file.typeReferenceDirectives = emptyArray;
    file.libReferenceDirectives = emptyArray;
    file.amdDependencies = emptyArray;
    file.hasNoDefaultLib = false;
    file.pragmas = emptyMap as ReadonlyPragmaMap;
    file.parseDiagnostics = [];
    file.isDeclarationFile = true;
    file.fileName = `${fileName}.ts`;
    file.bindDiagnostics = [];
    file.bindSuggestionDiagnostics = undefined;
    file.languageVersion = ScriptTarget.Latest;
    file.languageVariant = getLanguageVariant(ScriptKind.TS);
    file.scriptKind = ScriptKind.Provided;
    file.externalModuleIndicator = file.statements[0];

    // Immediately printing the synthetic file declaration text allows us to generate concrete positions
    // for all the nodes we've synthesized, and essentially un-synthesize them (making them appear, by all
    // rights, to be veritable parse tree nodes)
    file.text = createPrinter({}, {
        onEmitNode(hint, node, cb, getTextPos) {
            const start = getTextPos();
            cb(hint, node);
            if (node) {
                (node as Mutable<typeof node>).pos = start;
                (node as Mutable<typeof node>).end = getTextPos();
            }
        },

    }).printFile(file);
    (file.endOfFileToken as Mutable<typeof file.endOfFileToken>).pos = file.text.length;
    (file.endOfFileToken as Mutable<typeof file.endOfFileToken>).end = file.text.length;

    // The above sets all node positions, but node _arrays_ still have `-1` for their pos and end.
    // We fix those up to use their constituent start and end positions here.
    fixupNodeArrays(file);

    return file;
}

function fixupNodeArrays(node: Node) {
    forEachChildRecursively(node, noop, (arr) => {
        if (arr.length) {
            (arr as Mutable<typeof arr>).pos = arr[0].pos;
            (arr as Mutable<typeof arr>).end = arr[arr.length - 1].end;
        }
    });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function finishNode<T extends Node>(node: T) {
    (node as Mutable<T>).flags |= NodeFlags.Ambient;
    return node;
}
