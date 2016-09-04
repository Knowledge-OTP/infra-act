(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('customAnswerBuilderAct', function (ZnkExerciseViewModeEnum, AnswerTypeEnum) {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, ctrls) {
                    var questionBuilderCtrl = ctrls[0];
                    var ngModelCtrl = ctrls[1];
                    var viewMode = questionBuilderCtrl.getViewMode();
                    var question = questionBuilderCtrl.question;

                    scope.d = {};
                    var isFreeTextAnswer = question.answerTypeId === AnswerTypeEnum.FREE_TEXT_ANSWER.enum;
                    var isAnswerWithResultMode = viewMode === ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum;
                    var isReviewMode = viewMode === ZnkExerciseViewModeEnum.REVIEW.enum;
                    var isUserNotAnswered = angular.isUndefined(ngModelCtrl.$viewValue);
                    if (isFreeTextAnswer && isUserNotAnswered && !isReviewMode) {
                        scope.d.showFreeTextInstructions = true;
                        if (isAnswerWithResultMode) {
                            ngModelCtrl.$viewChangeListeners.push(function () {
                                scope.d.showFreeTextInstructions = false;
                            });
                        }
                    }
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/customAnswerBuilderAct.template.html',
                restrict: 'E',
                require: ['^questionBuilder', '^ngModel'],
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);

