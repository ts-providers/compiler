import { SourceFile } from "../types";

export interface TypeProviderHost {
    providedFiles: Map<string, SourceFile | undefined>;
}

export function createTypeProviderHost(): TypeProviderHost {
    const host: TypeProviderHost = {
        providedFiles: new Map<string, SourceFile | undefined>()
    };

    return host;
}
