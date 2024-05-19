import { ImportAttributes, StringLiteralLike } from "../types";

export interface ProviderOptions {
    sample?: string;
    separator?: string;
    encoding?: string;
    hasHeader?: boolean;
}

export interface ModuleImport {
    specifier: StringLiteralLike;
    attributes?: ImportAttributes;
}
