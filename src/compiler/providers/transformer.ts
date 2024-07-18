import { Bundle, chainBundle, getDirectoryPath, getEmitModuleKind, getOwnEmitOutputFilePath, getRelativePathFromDirectory, ImportDeclaration, isImportDeclaration, Node, SourceFile, StringLiteralLike, TransformationContext, visitEachChild, VisitResult } from "../_namespaces/ts.js";
import { getExtensionPrefixByModuleKind, getOutDirOrDefault, providedOutDir } from "./emit.js";
import { getProvidedNameHash } from "./utils.js";

export function transformProvidedImports(context: TransformationContext): (x: SourceFile | Bundle) => SourceFile | Bundle {
    let currentFile: SourceFile;
    const factory = context.factory;
    return chainBundle(context, transformSourceFile);

    function transformSourceFile(node: SourceFile) {
        currentFile = node;
        return visitEachChild(node, visitor, context);
    }

    function visitor(node: Node): VisitResult<Node> {
        // Skip all nodes that are not provided import statements.
        if (!isImportDeclaration(node) || !node.isProvided) {
            return node;
        }

        const compilerOptions = context.getCompilerOptions();

        // Remove import attributes and replace module specifier with relative path to a generated .js file.
        let declNode = node as ImportDeclaration;
        const specifierText = (declNode.moduleSpecifier as StringLiteralLike).text;
        const providedImportHash = getProvidedNameHash(specifierText);

        const outDir = getOutDirOrDefault(compilerOptions, currentFile.path);
        const fileOutput = getOwnEmitOutputFilePath(currentFile.fileName, context.getEmitHost(), ".js");
        const fileOutputDir = getDirectoryPath(fileOutput);
        const relativePathToOutDir = getRelativePathFromDirectory(fileOutputDir, outDir, false) || ".";

        const moduleKind = getEmitModuleKind(context.getCompilerOptions());
        const extension = currentFile.isDeclarationFile
            ? "d.ts"
            : `${getExtensionPrefixByModuleKind(moduleKind)}js`;
        const specifier = factory.createStringLiteral(`${relativePathToOutDir}/${providedOutDir}/${providedImportHash}.${extension}`);

        declNode = factory.updateImportDeclaration(node, node.modifiers, node.importClause, specifier, false, undefined);

        return declNode;
    }
}
