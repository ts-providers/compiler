import { Diagnostic, SourceFile } from "../_namespaces/ts.js";

export interface SyncTypeProvider<TOptions extends object> {
    provideDeclarationsSync: ProvideDeclarations<TOptions>
}

export interface AsyncTypeProvider<TOptions extends object> {
    provideDeclarationsAsync(context: ProviderContext, options: TOptions): Promise<ProviderGeneratorResult>
}

export type ProvideDeclarations<TOptions extends object> = (context: ProviderContext, options: TOptions) => ProviderGeneratorResult;

export interface ProviderContext {
    importingFilePath: string;
    runtimeTarget?: "browser" | "bun" | "deno" | "node";
}

export interface ProviderGeneratorResult {
    sourceFile?: SourceFile;
    generalDiagnostics?: Diagnostic[];
    optionDiagnostics?: Map<string, Diagnostic[]>;
}
