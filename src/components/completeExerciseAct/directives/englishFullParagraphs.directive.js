(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('englishFullParagraphs', function () {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    scope.vm = {
                        question: questionBuilderCtrl.question
                    };

                    angular.element(element[0].querySelector('.paragraph-title')).append(questionBuilderCtrl.question.groupData.name);
                    angular.element(element[0].querySelector('.question-content')).append(questionBuilderCtrl.question.content);

                    var questionContainerDomElement = angular.element(element[0].querySelector('.paragraphs-wrapper'));

                    var paragraphArray = questionBuilderCtrl.question.groupData.paragraphs;


                    for (var i = 0; i < paragraphArray.length; i++) {
                        var peragraphNumber = i + 1;
                        var paragrphsTempalte = '<div class="paragraph-number-title">[ ' + peragraphNumber + ' ]</div>' +
                            '<div class="paragraph">' + paragraphArray[i].body.replace(/_/g, '') + '</div>';
                        questionContainerDomElement.append(paragrphsTempalte);
                    }
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/englishFullParagraphs.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);
