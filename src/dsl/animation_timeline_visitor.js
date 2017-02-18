/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationStyles } from '@angular/core/index';
import { copyStyles, normalizeStyles, parseTimeExpression } from '../common/util';
import { visitAnimationNode } from './animation_dsl_visitor';
import * as meta from './animation_metadata';
import { createTimelineInstruction } from './animation_timeline_instruction';
/**
 * @param {?} ast
 * @param {?=} startingStyles
 * @param {?=} finalStyles
 * @return {?}
 */
export function buildAnimationKeyframes(ast, startingStyles = {}, finalStyles = {}) {
    const /** @type {?} */ normalizedAst = Array.isArray(ast) ? meta.sequence(/** @type {?} */ (ast)) : (ast);
    return new AnimationTimelineVisitor().buildKeyframes(normalizedAst, startingStyles, finalStyles);
}
export class AnimationTimelineContext {
    /**
     * @param {?} errors
     * @param {?} timelines
     * @param {?=} initialTimeline
     */
    constructor(errors, timelines, initialTimeline = null) {
        this.errors = errors;
        this.timelines = timelines;
        this.previousNode = ({});
        this.subContextCount = 0;
        this.currentTimeline = initialTimeline || new TimelineBuilder(0);
        timelines.push(this.currentTimeline);
    }
    /**
     * @return {?}
     */
    createSubContext() {
        const /** @type {?} */ context = new AnimationTimelineContext(this.errors, this.timelines, this.currentTimeline.fork());
        context.previousNode = this.previousNode;
        context.currentAnimateTimings = this.currentAnimateTimings;
        this.subContextCount++;
        return context;
    }
    /**
     * @param {?=} newTime
     * @return {?}
     */
    transformIntoNewTimeline(newTime = 0) {
        this.currentTimeline = this.currentTimeline.fork(newTime);
        this.timelines.push(this.currentTimeline);
        return this.currentTimeline;
    }
    /**
     * @param {?} time
     * @return {?}
     */
    incrementTime(time) {
        this.currentTimeline.forwardTime(this.currentTimeline.duration + time);
    }
}
function AnimationTimelineContext_tsickle_Closure_declarations() {
    /** @type {?} */
    AnimationTimelineContext.prototype.currentTimeline;
    /** @type {?} */
    AnimationTimelineContext.prototype.currentAnimateTimings;
    /** @type {?} */
    AnimationTimelineContext.prototype.previousNode;
    /** @type {?} */
    AnimationTimelineContext.prototype.subContextCount;
    /** @type {?} */
    AnimationTimelineContext.prototype.errors;
    /** @type {?} */
    AnimationTimelineContext.prototype.timelines;
}
export class AnimationTimelineVisitor {
    /**
     * @param {?} ast
     * @param {?} startingStyles
     * @param {?} finalStyles
     * @return {?}
     */
    buildKeyframes(ast, startingStyles, finalStyles) {
        const /** @type {?} */ context = new AnimationTimelineContext([], []);
        context.currentTimeline.setStyles(startingStyles);
        visitAnimationNode(this, ast, context);
        const /** @type {?} */ normalizedFinalStyles = copyStyles(finalStyles, true);
        // this is a special case for when animate(TIME) is used (without any styles)
        // thus indicating to create an animation arc between the final keyframe and
        // the destination styles. When this occurs we need to ensure that the styles
        // that are missing on the finalStyles map are set to AUTO
        if (Object.keys(context.currentTimeline.getFinalKeyframe()).length == 0) {
            context.currentTimeline.properties.forEach(prop => {
                const /** @type {?} */ val = normalizedFinalStyles[prop];
                if (val == null) {
                    normalizedFinalStyles[prop] = meta.AUTO_STYLE;
                }
            });
        }
        context.currentTimeline.setStyles(normalizedFinalStyles);
        const /** @type {?} */ timelineInstructions = [];
        context.timelines.forEach(timeline => {
            // this checks to see if an actual animation happened
            if (timeline.hasStyling()) {
                timelineInstructions.push(timeline.buildKeyframes());
            }
        });
        if (timelineInstructions.length == 0) {
            timelineInstructions.push(createTimelineInstruction([], 0, 0, ''));
        }
        return timelineInstructions;
    }
    /**
     * @param {?} ast
     * @param {?} context
     * @return {?}
     */
    visitState(ast, context) {
        // these values are not visited in this AST
    }
    /**
     * @param {?} ast
     * @param {?} context
     * @return {?}
     */
    visitTransition(ast, context) {
        // these values are not visited in this AST
    }
    /**
     * @param {?} ast
     * @param {?} context
     * @return {?}
     */
    visitSequence(ast, context) {
        const /** @type {?} */ subContextCount = context.subContextCount;
        if (context.previousNode.type == 6 /* Style */) {
            context.currentTimeline.forwardFrame();
            context.currentTimeline.snapshotCurrentStyles();
        }
        ast.steps.forEach(s => visitAnimationNode(this, s, context));
        // this means that some animation function within the sequence
        // ended up creating a sub timeline (which means the current
        // timeline cannot overlap with the contents of the sequence)
        if (context.subContextCount > subContextCount) {
            context.transformIntoNewTimeline();
        }
        context.previousNode = ast;
    }
    /**
     * @param {?} ast
     * @param {?} context
     * @return {?}
     */
    visitGroup(ast, context) {
        const /** @type {?} */ innerTimelines = [];
        let /** @type {?} */ furthestTime = context.currentTimeline.currentTime;
        ast.steps.forEach(s => {
            const /** @type {?} */ innerContext = context.createSubContext();
            visitAnimationNode(this, s, innerContext);
            furthestTime = Math.max(furthestTime, innerContext.currentTimeline.currentTime);
            innerTimelines.push(innerContext.currentTimeline);
        });
        // this operation is run after the AST loop because otherwise
        // if the parent timeline's collected styles were updated then
        // it would pass in invalid data into the new-to-be forked items
        innerTimelines.forEach(timeline => context.currentTimeline.mergeTimelineCollectedStyles(timeline));
        context.transformIntoNewTimeline(furthestTime);
        context.previousNode = ast;
    }
    /**
     * @param {?} ast
     * @param {?} context
     * @return {?}
     */
    visitAnimate(ast, context) {
        const /** @type {?} */ timings = ast.timings.hasOwnProperty('duration') ? (ast.timings) :
            parseTimeExpression(/** @type {?} */ (ast.timings), context.errors);
        context.currentAnimateTimings = timings;
        if (timings.delay) {
            context.incrementTime(timings.delay);
            context.currentTimeline.snapshotCurrentStyles();
        }
        const /** @type {?} */ astType = ast.styles ? ast.styles.type : -1;
        if (astType == 5 /* KeyframeSequence */) {
            this.visitKeyframeSequence(/** @type {?} */ (ast.styles), context);
        }
        else {
            context.incrementTime(timings.duration);
            if (astType == 6 /* Style */) {
                this.visitStyle(/** @type {?} */ (ast.styles), context);
            }
        }
        context.currentAnimateTimings = null;
        context.previousNode = ast;
    }
    /**
     * @param {?} ast
     * @param {?} context
     * @return {?}
     */
    visitStyle(ast, context) {
        // this is a special case when a style() call is issued directly after
        // a call to animate(). If the clock is not forwarded by one frame then
        // the style() calls will be merged into the previous animate() call
        // which is incorrect.
        if (!context.currentAnimateTimings &&
            context.previousNode.type == 4 /* Animate */) {
            context.currentTimeline.forwardFrame();
        }
        const /** @type {?} */ normalizedStyles = normalizeStyles(new AnimationStyles(ast.styles));
        const /** @type {?} */ easing = context.currentAnimateTimings && context.currentAnimateTimings.easing;
        if (easing) {
            normalizedStyles['easing'] = easing;
        }
        context.currentTimeline.setStyles(normalizedStyles);
        context.previousNode = ast;
    }
    /**
     * @param {?} ast
     * @param {?} context
     * @return {?}
     */
    visitKeyframeSequence(ast, context) {
        const /** @type {?} */ MAX_KEYFRAME_OFFSET = 1;
        const /** @type {?} */ limit = ast.steps.length - 1;
        const /** @type {?} */ firstKeyframe = ast.steps[0];
        let /** @type {?} */ offsetGap = 0;
        const /** @type {?} */ containsOffsets = firstKeyframe.styles.find(styles => styles['offset'] >= 0);
        if (!containsOffsets) {
            offsetGap = MAX_KEYFRAME_OFFSET / limit;
        }
        const /** @type {?} */ startTime = context.currentTimeline.duration;
        const /** @type {?} */ duration = context.currentAnimateTimings.duration;
        const /** @type {?} */ innerContext = context.createSubContext();
        const /** @type {?} */ innerTimeline = innerContext.currentTimeline;
        innerTimeline.easing = context.currentAnimateTimings.easing;
        ast.steps.forEach((step, i) => {
            const /** @type {?} */ normalizedStyles = normalizeStyles(new AnimationStyles(step.styles));
            const /** @type {?} */ offset = containsOffsets ? (normalizedStyles['offset']) :
                (i == limit ? MAX_KEYFRAME_OFFSET : i * offsetGap);
            innerTimeline.forwardTime(offset * duration);
            innerTimeline.setStyles(normalizedStyles);
        });
        // this will ensure that the parent timeline gets all the styles from
        // the child even if the new timeline below is not used
        context.currentTimeline.mergeTimelineCollectedStyles(innerTimeline);
        // we do this because the window between this timeline and the sub timeline
        // should ensure that the styles within are exactly the same as they were before
        context.transformIntoNewTimeline(startTime + duration);
        context.previousNode = ast;
    }
}
export class TimelineBuilder {
    /**
     * @param {?} startTime
     * @param {?=} _globalTimelineStyles
     */
    constructor(startTime, _globalTimelineStyles = null) {
        this.startTime = startTime;
        this._globalTimelineStyles = _globalTimelineStyles;
        this.duration = 0;
        this.easing = '';
        this._keyframes = new Map();
        this._styleSummary = {};
        this._backFill = {};
        this._localTimelineStyles = Object.create(this._backFill, {});
        if (!this._globalTimelineStyles) {
            this._globalTimelineStyles = this._localTimelineStyles;
        }
        this._loadKeyframe();
    }
    /**
     * @return {?}
     */
    hasStyling() { return this._keyframes.size > 1; }
    /**
     * @return {?}
     */
    get currentTime() { return this.startTime + this.duration; }
    /**
     * @param {?=} currentTime
     * @return {?}
     */
    fork(currentTime = 0) {
        return new TimelineBuilder(currentTime || this.currentTime, this._globalTimelineStyles);
    }
    /**
     * @return {?}
     */
    _loadKeyframe() {
        this._currentKeyframe = this._keyframes.get(this.duration);
        if (!this._currentKeyframe) {
            this._currentKeyframe = Object.create(this._backFill, {});
            this._keyframes.set(this.duration, this._currentKeyframe);
        }
    }
    /**
     * @return {?}
     */
    forwardFrame() {
        this.duration++;
        this._loadKeyframe();
    }
    /**
     * @param {?} time
     * @return {?}
     */
    forwardTime(time) {
        this.duration = time;
        this._loadKeyframe();
    }
    /**
     * @param {?} prop
     * @param {?} value
     * @return {?}
     */
    _updateStyle(prop, value) {
        if (prop != 'easing') {
            this._localTimelineStyles[prop] = value;
            this._globalTimelineStyles[prop] = value;
            this._styleSummary[prop] = { time: this.currentTime, value };
        }
    }
    /**
     * @param {?} styles
     * @return {?}
     */
    setStyles(styles) {
        Object.keys(styles).forEach(prop => {
            if (prop !== 'offset') {
                const /** @type {?} */ val = styles[prop];
                this._currentKeyframe[prop] = val;
                if (prop !== 'easing' && !this._localTimelineStyles[prop]) {
                    this._backFill[prop] = this._globalTimelineStyles[prop] || meta.AUTO_STYLE;
                }
                this._updateStyle(prop, val);
            }
        });
        Object.keys(this._localTimelineStyles).forEach(prop => {
            if (!this._currentKeyframe.hasOwnProperty(prop)) {
                this._currentKeyframe[prop] = this._localTimelineStyles[prop];
            }
        });
    }
    /**
     * @return {?}
     */
    snapshotCurrentStyles() { copyStyles(this._localTimelineStyles, false, this._currentKeyframe); }
    /**
     * @return {?}
     */
    getFinalKeyframe() { return this._keyframes.get(this.duration); }
    /**
     * @return {?}
     */
    get properties() {
        const /** @type {?} */ properties = [];
        for (let /** @type {?} */ prop in this._currentKeyframe) {
            properties.push(prop);
        }
        return properties;
    }
    /**
     * @param {?} timeline
     * @return {?}
     */
    mergeTimelineCollectedStyles(timeline) {
        Object.keys(timeline._styleSummary).forEach(prop => {
            const /** @type {?} */ details0 = this._styleSummary[prop];
            const /** @type {?} */ details1 = timeline._styleSummary[prop];
            if (!details0 || details1.time > details0.time) {
                this._updateStyle(prop, details1.value);
            }
        });
    }
    /**
     * @return {?}
     */
    buildKeyframes() {
        const /** @type {?} */ finalKeyframes = [];
        // special case for when there are only start/destination
        // styles but no actual animation animate steps...
        if (this.duration == 0) {
            const /** @type {?} */ targetKeyframe = this.getFinalKeyframe();
            const /** @type {?} */ firstKeyframe = copyStyles(targetKeyframe, true);
            firstKeyframe['offset'] = 0;
            finalKeyframes.push(firstKeyframe);
            const /** @type {?} */ lastKeyframe = copyStyles(targetKeyframe, true);
            lastKeyframe['offset'] = 1;
            finalKeyframes.push(lastKeyframe);
        }
        else {
            this._keyframes.forEach((keyframe, time) => {
                const /** @type {?} */ finalKeyframe = copyStyles(keyframe, true);
                finalKeyframe['offset'] = time / this.duration;
                finalKeyframes.push(finalKeyframe);
            });
        }
        return createTimelineInstruction(finalKeyframes, this.duration, this.startTime, this.easing);
    }
}
function TimelineBuilder_tsickle_Closure_declarations() {
    /** @type {?} */
    TimelineBuilder.prototype.duration;
    /** @type {?} */
    TimelineBuilder.prototype.easing;
    /** @type {?} */
    TimelineBuilder.prototype._currentKeyframe;
    /** @type {?} */
    TimelineBuilder.prototype._keyframes;
    /** @type {?} */
    TimelineBuilder.prototype._styleSummary;
    /** @type {?} */
    TimelineBuilder.prototype._localTimelineStyles;
    /** @type {?} */
    TimelineBuilder.prototype._backFill;
    /** @type {?} */
    TimelineBuilder.prototype.startTime;
    /** @type {?} */
    TimelineBuilder.prototype._globalTimelineStyles;
}
//# sourceMappingURL=animation_timeline_visitor.js.map