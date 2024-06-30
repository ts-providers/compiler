import { ImportAttributes, StringLiteralLike } from "../types";

export interface ModuleImport {
    specifier: StringLiteralLike;
    isProvided: boolean;
    providedName?: string;
    attributes?: ImportAttributes;
}
