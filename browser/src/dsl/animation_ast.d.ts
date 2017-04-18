/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimateTimings, ɵStyleData } from '@angular/animations';
export interface AnimationAstVisitor {
    visitTrigger(ast: AnimationTriggerAst, context: any): any;
    visitState(ast: AnimationStateAst, context: any): any;
    visitTransition(ast: AnimationTransitionAst, context: any): any;
    visitSequence(ast: AnimationSequenceAst, context: any): any;
    visitGroup(ast: AnimationGroupAst, context: any): any;
    visitAnimate(ast: AnimationAnimateAst, context: any): any;
    visitStyle(ast: AnimationStyleAst, context: any): any;
    visitKeyframeSequence(ast: AnimationKeyframesSequenceAst, context: any): any;
    visitReference(ast: AnimationReferenceAst, context: any): any;
    visitAnimateChild(ast: AnimationAnimateChildAst, context: any): any;
    visitQuery(ast: AnimationQueryAst, context: any): any;
    visitStagger(ast: AnimationStaggerAst, context: any): any;
    visitTiming(ast: AnimationTimingAst, context: any): any;
}
export declare abstract class AnimationAst {
    abstract visit(ast: AnimationAstVisitor, context: any): any;
    locals?: {
        [name: string]: any;
    } | undefined;
}
export declare class AnimationTriggerAst extends AnimationAst {
    name: string;
    states: AnimationStateAst[];
    transitions: AnimationTransitionAst[];
    queryCount: number;
    depCount: number;
    constructor(name: string, states: AnimationStateAst[], transitions: AnimationTransitionAst[]);
    visit(visitor: AnimationAstVisitor, context: any): any;
}
export declare class AnimationStateAst extends AnimationAst {
    name: string;
    style: AnimationStyleAst;
    constructor(name: string, style: AnimationStyleAst);
    visit(visitor: AnimationAstVisitor, context: any): any;
}
export declare class AnimationTransitionAst extends AnimationAst {
    matchers: ((fromState: string, toState: string) => boolean)[];
    animation: AnimationAst;
    locals: {
        [varName: string]: string | number;
    };
    queryCount: number;
    depCount: number;
    constructor(matchers: ((fromState: string, toState: string) => boolean)[], animation: AnimationAst, locals?: {
        [varName: string]: string | number;
    });
    visit(visitor: AnimationAstVisitor, context: any): any;
}
export declare class AnimationSequenceAst extends AnimationAst {
    steps: AnimationAst[];
    constructor(steps: AnimationAst[]);
    visit(visitor: AnimationAstVisitor, context: any): any;
}
export declare class AnimationGroupAst extends AnimationAst {
    steps: AnimationAst[];
    constructor(steps: AnimationAst[]);
    visit(visitor: AnimationAstVisitor, context: any): any;
}
export declare class AnimationAnimateAst extends AnimationAst {
    timings: AnimationTimingAst;
    style: AnimationStyleAst | AnimationKeyframesSequenceAst;
    constructor(timings: AnimationTimingAst, style: AnimationStyleAst | AnimationKeyframesSequenceAst);
    visit(visitor: AnimationAstVisitor, context: any): any;
}
export declare class AnimationStyleAst extends AnimationAst {
    styles: (ɵStyleData | string)[];
    easing: string | undefined;
    offset: number;
    isEmptyStep: boolean;
    constructor(styles: (ɵStyleData | string)[], easing: string | undefined, offset?: number);
    visit(visitor: AnimationAstVisitor, context: any): any;
}
export declare class AnimationKeyframesSequenceAst extends AnimationAst {
    styles: AnimationStyleAst[];
    constructor(styles: AnimationStyleAst[]);
    visit(visitor: AnimationAstVisitor, context: any): any;
}
export declare class AnimationReferenceAst extends AnimationAst {
    animation: AnimationAst;
    defaults: {
        [varName: string]: any;
    };
    constructor(animation: AnimationAst, defaults?: {
        [varName: string]: any;
    });
    visit(visitor: AnimationAstVisitor, context: any): any;
}
export declare class AnimationAnimateChildAst extends AnimationAst {
    animation: AnimationReferenceAst;
    locals: {
        [name: string]: any;
    };
    constructor(animation?: AnimationReferenceAst, locals?: {
        [name: string]: any;
    });
    visit(visitor: AnimationAstVisitor, context: any): any;
}
export declare class AnimationQueryAst extends AnimationAst {
    selector: string;
    multi: boolean;
    includeSelf: boolean;
    animation: AnimationAst;
    constructor(selector: string, multi: boolean, includeSelf: boolean, animation: AnimationAst);
    visit(visitor: AnimationAstVisitor, context: any): any;
}
export declare class AnimationStaggerAst extends AnimationAst {
    timings: AnimateTimings;
    animation: AnimationAst;
    constructor(timings: AnimateTimings, animation: AnimationAst);
    visit(visitor: AnimationAstVisitor, context: any): any;
}
export declare class AnimationTimingAst extends AnimationAst {
    duration: number;
    delay: number;
    easing: string;
    constructor(duration: number, delay?: number, easing?: string);
    visit(visitor: AnimationAstVisitor, context: any): any;
}
export declare class DynamicAnimationTimingAst extends AnimationTimingAst {
    value: string;
    constructor(value: string);
    visit(visitor: AnimationAstVisitor, context: any): any;
}
