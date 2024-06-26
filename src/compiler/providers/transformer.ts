import { Bundle, chainBundle, ImportDeclaration, isImportDeclaration, Mutable, Node, SourceFile, TransformationContext, TransformFlags, visitEachChild, VisitResult } from "../_namespaces/ts.js";
import { getProvidedImportIdentifier } from "./utils.js";

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

        console.log("TRANSFORMING PROVIDED IMPORT");

        // Remove import attributes and replace module specifier with relative path to a generated .js file.
        let declNode = node as ImportDeclaration;
        const providerAttributesHash = getProvidedImportIdentifier(declNode.attributes!);
        const specifier = factory.createStringLiteral(`./${providerAttributesHash}.js`);

        declNode = factory.updateImportDeclaration(node, node.modifiers, node.importClause, specifier, false, undefined);

        return declNode;
    }
}
