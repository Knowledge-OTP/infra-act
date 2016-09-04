(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('essayQuestion', function essayQuestionDirective() {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    scope.vm = {
                        question: questionBuilderCtrl.question
                    };

                    var questionContainerDomElement = angular.element(element[0].querySelector('.question-container'));
                    var paragraphArray = questionBuilderCtrl.question.groupData.paragraphs;

                    for (var i = 0; i < paragraphArray.length; i++) {
                        questionContainerDomElement.append(paragraphArray[i].body.replace(/_/g, ''));
                    }

                    angular.element(element[0].querySelector('.question-content')).append(questionBuilderCtrl.question.content);
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/essayQuestion.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);




