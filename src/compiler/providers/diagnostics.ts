import { Debug, ImportAttributes, isSourceFile, createDetachedDiagnostic, getTextOfNode, DiagnosticArguments, DiagnosticMessage, DiagnosticWithDetachedLocation, ImportDeclaration, findAncestor, Expression, SourceFile } from "../_namespaces/ts.js";

export function createImportDiagnostic(node: ImportDeclaration | ImportAttributes | Expression, importingFile: SourceFile, message: DiagnosticMessage, ...args: DiagnosticArguments): DiagnosticWithDetachedLocation {
    Debug.assert(isSourceFile(importingFile));

    const text = getTextOfNode(node);
    const startPos = importingFile.text.indexOf(text);

    return createDetachedDiagnostic(importingFile.fileName, importingFile.text, startPos, text.length, message, ...args);
}
