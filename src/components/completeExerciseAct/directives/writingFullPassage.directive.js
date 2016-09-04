(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('writingFullPassage', function () {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    scope.vm = {
                        question: questionBuilderCtrl.question
                    };

                    var paragraphArray = questionBuilderCtrl.question.groupData.paragraphs;
                    var paragraphTitleDomElement = angular.element(element[0].querySelector('.paragraph-title'));
                    var questionContainerDomElement = angular.element(element[0].querySelector('.question-content'));
                    var paragraphsWrapperDomElement = angular.element(element[0].querySelector('.paragraphs-wrapper'));

                    paragraphTitleDomElement.append(questionBuilderCtrl.question.groupData.name);
                    questionContainerDomElement.append(questionBuilderCtrl.question.content);

                    for (var i = 0; i < paragraphArray.length; i++) {
                        var paragraphNumber = i + 1;
                        var paragrphTitleTempalte = '<div class="paragraph-number-title"> [ ' + paragraphNumber + ' ] </div>'; // paragraph title
                        paragraphsWrapperDomElement.append(paragrphTitleTempalte);

                        var paragraphElement = angular.element('<div class="paragraph"></div>');

                        paragraphElement.append(paragraphArray[i].body.replace(/_/g, ''));       // paragraph content
                        paragraphsWrapperDomElement.append(paragraphElement);
                    }
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/writingFullPassage.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);
