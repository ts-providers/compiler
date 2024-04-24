import { ImportAttributes, StringLiteralLike } from "../types";

export interface ProviderOptions {
    sample: string
}

export interface ModuleImport {
    specifier: StringLiteralLike;
    attributes?: ImportAttributes;
}
