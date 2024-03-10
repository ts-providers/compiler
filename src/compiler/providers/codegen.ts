import { dirname } from "path";
import { createNodeFactory, createPrinter, emptyArray, emptyMap, factory, forEachChildRecursively, getLanguageVariant, ImportAttributes, Mutable, NewLineKind, Node, NodeFactoryFlags, NodeFlags, noop, parseBaseNodeFactory, ReadonlyPragmaMap, ScriptKind, ScriptTarget, setParentRecursive, SourceFile, Statement, SyntaxKind } from "../_namespaces/ts";
import { logIfProviderFile } from "./debugging";
import { getProviderOptionsFromImportAttributes } from "./utils";

export function createProvidedSourceFile(fileName: string, importAttributes: ImportAttributes, setParentNodes: boolean) {
    const providerOptions = getProviderOptionsFromImportAttributes(importAttributes);
    logIfProviderFile(fileName, "CREATING PROVIDED SOURCE FILE", `OPTIONS: '${JSON.stringify(providerOptions)}'`);

    const originalFileName = fileName.split("____")[0];
    let providedStatements: Statement[] = [];
    if (providerOptions.sample) {
        const providerPackagePath = dirname(originalFileName);
        const providerPackage = require(providerPackagePath);
        const providerGenerator = providerPackage.CsvProviderGenerator;
        providedStatements = providerGenerator.provideDeclarations(providerOptions);
    }

    // const namespaceName = "CsvProvider_" + ((Math.random() + 1).toString(36).substring(7));

    // const namespaceDeclaration = factory.createModuleDeclaration(
    //     [factory.createToken(SyntaxKind.ExportKeyword)],
    //     factory.createIdentifier(namespaceName),
    //     factory.createModuleBlock(providedStatements),
    //     NodeFlags.Namespace
    // );

    // const exportNode = factory.createExportAssignment(
    //     undefined,
    //     undefined,
    //     factory.createIdentifier(namespaceName)
    // );

    // const statements = [namespaceDeclaration, exportNode];

    const declFile = createVirtualSourceFile(fileName, providedStatements);

    if (setParentNodes) {
        setParentRecursive(declFile, true);
    }

    const printer = createPrinter({
        newLine: NewLineKind.LineFeed,
        removeComments: false,
        omitTrailingSemicolon: true
    });

    console.log("PROVIDED FILE:", fileName);
    console.log(printer.printFile(declFile));

    return declFile;
}

export function createVirtualSourceFile(fileName: string, statements: Statement[]): SourceFile {
    const factory = createNodeFactory(NodeFactoryFlags.NoOriginalNode | NodeFactoryFlags.NoNodeConverters, parseBaseNodeFactory);
    const eofToken = factory.createToken(SyntaxKind.EndOfFileToken);

    const result = factory.createSourceFile(statements, eofToken, NodeFlags.Ambient);

    result.referencedFiles = emptyArray;
    result.typeReferenceDirectives = emptyArray;
    result.libReferenceDirectives = emptyArray;
    result.amdDependencies = emptyArray;
    result.hasNoDefaultLib = false;
    result.pragmas = emptyMap as ReadonlyPragmaMap;
    result.parseDiagnostics = [];
    result.isDeclarationFile = true;
    result.fileName = `${fileName}.d.ts`;
    result.bindDiagnostics = [];
    result.bindSuggestionDiagnostics = undefined;
    result.languageVersion = ScriptTarget.Latest;
    result.languageVariant = getLanguageVariant(ScriptKind.TS);
    result.scriptKind = ScriptKind.Provided;
    result.externalModuleIndicator = result.statements[0];
    result.text = "";

    // Immediately printing the synthetic file declaration text allows us to generate concrete positions
    // for all the nodes we've synthesized, and essentially un-synthesize them (making them appear, by all
    // rights, to be veritable parse tree nodes)
    result.text = createPrinter({}, {
        onEmitNode(hint, node, cb, getTextPos) {
            const start = getTextPos();
            cb(hint, node);
            if (node) {
                (node as Mutable<typeof node>).pos = start;
                (node as Mutable<typeof node>).end = getTextPos();
            }
        },

    }).printFile(result);
    (eofToken as Mutable<typeof eofToken>).pos = result.text.length;
    (eofToken as Mutable<typeof eofToken>).end = result.text.length;

    // The above sets all node positions, but node _arrays_ still have `-1` for their pos and end.
    // We fix those up to use their constituent start and end positions here.
    fixupNodeArrays(result);

    return result;
}

// Based on: https://github.com/microsoft/TypeScript/pull/39784/commits/977c2b6e9cc9daa74212e8ee159d553628361047
export function createMagicDeclarationFile(fileName: string, typeName: string, propNames: string[]): SourceFile {
    const factory = createNodeFactory(NodeFactoryFlags.NoOriginalNode | NodeFactoryFlags.NoNodeConverters, parseBaseNodeFactory);

    const magicDecl = factory.createInterfaceDeclaration(
        [factory.createToken(SyntaxKind.ExportKeyword)],
        factory.createIdentifier(typeName),
        /*typeParameters*/ undefined,
        /*heritageClauses*/ undefined,
        propNames.map(name => factory.createPropertySignature(
            /*modifiers*/ undefined,
            factory.createIdentifier(name),
            /*questionToken*/ undefined,
            factory.createKeywordTypeNode(SyntaxKind.StringKeyword)
        ))
    );

    const statements: Statement[] = [magicDecl];
    const eofToken = factory.createToken(SyntaxKind.EndOfFileToken);

    const result = factory.createSourceFile(statements, eofToken, NodeFlags.Ambient);

    result.referencedFiles = emptyArray;
    result.typeReferenceDirectives = emptyArray;
    result.libReferenceDirectives = emptyArray;
    result.amdDependencies = emptyArray;
    result.hasNoDefaultLib = false;
    result.pragmas = emptyMap as ReadonlyPragmaMap;
    result.parseDiagnostics = [];
    result.isDeclarationFile = true;
    result.fileName = `${fileName}.d.ts`;
    result.bindDiagnostics = [];
    result.bindSuggestionDiagnostics = undefined;
    result.languageVersion = ScriptTarget.Latest;
    result.languageVariant = getLanguageVariant(ScriptKind.TS);
    result.scriptKind = ScriptKind.Provided;
    result.externalModuleIndicator = result.statements[0];
    result.text = "";

    // Immediately printing the synthetic file declaration text allows us to generate concrete positions
    // for all the nodes we've synthesized, and essentially un-synthesize them (making them appear, by all
    // rights, to be veritable parse tree nodes)
    result.text = createPrinter({}, {
        onEmitNode(hint, node, cb, getTextPos) {
            const start = getTextPos();
            cb(hint, node);
            if (node) {
                (node as Mutable<typeof node>).pos = start;
                (node as Mutable<typeof node>).end = getTextPos();
            }
        },

    }).printFile(result);
    (eofToken as Mutable<typeof eofToken>).pos = result.text.length;
    (eofToken as Mutable<typeof eofToken>).end = result.text.length;

    // The above sets all node positions, but node _arrays_ still have `-1` for their pos and end.
    // We fix those up to use their constituent start and end positions here.
    fixupNodeArrays(result);

    return result;
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
