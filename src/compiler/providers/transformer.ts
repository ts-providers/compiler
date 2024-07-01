import { Bundle, chainBundle, getDirectoryPath, getEmitModuleKind, getOwnEmitOutputFilePath, getRelativePathFromDirectory, ImportDeclaration, isImportDeclaration, Mutable, Node, SourceFile, StringLiteralLike, TransformationContext, visitEachChild, VisitResult } from "../_namespaces/ts.js";
import { getExtensionPrefixByModuleKind, providedOutDir } from "./emit.js";
import { getProvidedNameHash } from "./utils.js";

export function transformProvidedImports(context: TransformationContext): (x: SourceFile | Bundle) => SourceFile | Bundle {
    let currentFile: SourceFile;
    const factory = context.factory;
    return chainBundle(context, transformSourceFile);

    function transformSourceFile(node: SourceFile) {
        if (node.isDeclarationFile) {
            return node;
        }
        currentFile = node;
        return visitEachChild(node, visitor, context);
    }

    function visitor(node: Node): VisitResult<Node> {
        // Skip all nodes that are not provided import statements.
        if (!isImportDeclaration(node) || !node.isProvided) {
            return node;
        }

        // Remove import attributes and replace module specifier with relative path to a generated .js file.
        let declNode = node as ImportDeclaration;
        const specifierText = (declNode.moduleSpecifier as StringLiteralLike).text;
        const providedImportHash = getProvidedNameHash(specifierText);

        const outDir = context.getCompilerOptions().outDir!;
        const fileOutput = getOwnEmitOutputFilePath(currentFile.fileName, context.getEmitHost(), ".js");
        const fileOutputDir = getDirectoryPath(fileOutput);
        const relativePathToOutDir = getRelativePathFromDirectory(fileOutputDir, outDir, false) || ".";

        const moduleKind = getEmitModuleKind(context.getCompilerOptions());
        const extensionPrefix = getExtensionPrefixByModuleKind(moduleKind)
        const specifier = factory.createStringLiteral(`${relativePathToOutDir}/${providedOutDir}/${providedImportHash}.${extensionPrefix}js`);

        declNode = factory.updateImportDeclaration(node, node.modifiers, node.importClause, specifier, false, undefined);

        return declNode;
    }
}
