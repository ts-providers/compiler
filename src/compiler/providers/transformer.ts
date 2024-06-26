import { Bundle, chainBundle, ImportDeclaration, isImportDeclaration, Mutable, Node, SourceFile, StringLiteralLike, TransformationContext, TransformFlags, visitEachChild, VisitResult } from "../_namespaces/ts.js";
import { providerPackagePrefix } from "./debugging.js";
import { getProvidedImportHash, providedNameSeparator } from "./utils.js";

export function transformProvidedImports(context: TransformationContext): (x: SourceFile | Bundle) => SourceFile | Bundle {
    const factory = context.factory;
    return chainBundle(context, transformSourceFile);

    function transformSourceFile(node: SourceFile) {
        if (node.isDeclarationFile) {
            return node;
        }

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
        const providedImportHash = specifierText.split(providedNameSeparator)[2];
        console.log("TRANSFORMING PROVIDED IMPORT",  specifierText, providedImportHash);
        const specifier = factory.createStringLiteral(`./${providedImportHash}.js`);

        declNode = factory.updateImportDeclaration(node, node.modifiers, node.importClause, specifier, false, undefined);

        return declNode;
    }
}
