import {  CompilerOptions, DiagnosticMessage, SourceFile } from "../_namespaces/ts.js";

export interface SyncTypeProvider<TOptions extends object> {
    provideDeclarationsSync: ProvideDeclarations<TOptions>
}

export interface AsyncTypeProvider<TOptions extends object> {
    provideDeclarationsAsync(context: ProviderContext, options: TOptions): Promise<ProviderGeneratorResult>
}

export type ProvideDeclarations<TOptions extends object> = (context: ProviderContext, options: TOptions) => ProviderGeneratorResult;

export interface ProviderContext {
    importingFilePath: string;
    importHash: string;
    runtimeTarget?: CompilerOptions["runtimeTarget"];
}

export interface ProviderGeneratorResult {
    sourceFile?: SourceFile;
    generalDiagnostics?: DiagnosticMessage[];
    optionDiagnostics?: Map<string, DiagnosticMessage[]>;
}
