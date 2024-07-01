import { Debug, ImportAttributes, isSourceFile, createDetachedDiagnostic, getTextOfNode, DiagnosticArguments, DiagnosticMessage, DiagnosticWithDetachedLocation, ImportDeclaration, findAncestor, Expression, SourceFile, createCompilerDiagnostic, isIdentifier, isStringLiteral } from "../_namespaces/ts.js";

export function createImportDiagnostics(node: ImportDeclaration | ImportAttributes | Expression, importingFile: SourceFile, messages: DiagnosticMessage[], ...args: DiagnosticArguments): DiagnosticWithDetachedLocation[] {
    Debug.assert(isSourceFile(importingFile));

    const text = getTextOfNode(node);
    const startPos = importingFile.text.indexOf(text);

    return messages.map(message => createDetachedDiagnostic(importingFile.fileName, importingFile.text, startPos, text.length, message, ...args));
}

export function createImportOptionSpecificDiagnostics(optionName: string, importAttributes: ImportAttributes, importingFile: SourceFile, messages: DiagnosticMessage[], ...args: DiagnosticArguments): DiagnosticWithDetachedLocation[] {
    Debug.assert(isSourceFile(importingFile));

    const attribute = importAttributes.elements.find(a => isIdentifier(a.name) && a.name.escapedText === optionName || isStringLiteral(a.name) && a.name.text === optionName);
    console.log("ATTRIBUTE DIAGNOSTIC", optionName, attribute);
    const node = attribute ? attribute : importAttributes;
    const text = getTextOfNode(node);
    const startPos = importingFile.text.indexOf(text);

    return messages.map(message => createDetachedDiagnostic(importingFile.fileName, importingFile.text, startPos, text.length, message, ...args));
}
