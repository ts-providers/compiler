import { DiagnosticMessage, ImportAttributes, SourceFile, StringLiteralLike } from "../types";

export interface ModuleImport {
    specifier: StringLiteralLike;
    isProvided: boolean;
    attributes?: ImportAttributes;
}

export interface SyncTypeProvider<TOptions extends object> {
    provideSourceFileSync: ProvideSourceFile<TOptions>
}

export interface AsyncTypeProvider<TOptions extends object> {
    provideSourceFileAsync(options: TOptions, context: ProviderContext): Promise<TypeProviderResult>
}

export type ProvideSourceFile<TOptions extends object> = (options: TOptions, context: ProviderContext) => TypeProviderResult;

export interface ProviderContext {
    importingFilePath: string;
    importHash: string;
    runtimeTarget?: "browser" | "bun" | "deno" | "node";
}

export interface TypeProviderResult {
    sourceFile?: SourceFile;
    generalDiagnostics?: DiagnosticMessage[];
    optionDiagnostics?: Map<string, DiagnosticMessage[]>;
    requiresAsync?: boolean;
}
