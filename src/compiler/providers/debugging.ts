import { createPrinter, NewLineKind,  SourceFile } from "../_namespaces/ts.js";

export const providerPackagePrefix = "@ts-providers";

export function printSourceFile(file: SourceFile) {
    const printer = createPrinter({
        newLine: NewLineKind.LineFeed,
        removeComments: false,
        omitTrailingSemicolon: true
    });

    console.log("\nFile:", file.fileName);
    console.log(printer.printFile(file));
    console.log();
}
