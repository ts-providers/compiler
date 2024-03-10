//// [tests/cases/compiler/001_magic.ts] ////

//// [001_magic.ts]
import { ImportedType } from "./001_magic_imported";
// import { MagicType } from "./001_magic_magic";

const localValue: LocalType = {
    someProp: "boring"
};

const refValue: ImportedType = {
    someNumProp: 42
};

const magicValue: MagicType = {
    someMagicProp: "abraka dabra"
}

interface LocalType {
    someProp: string
}

//// [001_magic.js]
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { MagicType } from "./001_magic_magic";
var localValue = {
    someProp: "boring"
};
var refValue = {
    someNumProp: 42
};
var magicValue = {
    someMagicProp: "abraka dabra"
};
