(function (angular) {
    'use strict';

    angular.module('znk.infra-act', [
        "znk.infra-act.completeExerciseAct",
"znk.infra-act.configAct",
"znk.infra-act.examUtility",
"znk.infra-act.exerciseUtilityAct",
"znk.infra-act.performance",
"znk.infra-act.socialSharingAct",
"znk.infra-act.userGoals"
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct', [
        'znk.infra-web-app.completeExercise',
        'znk.infra.znkExercise',
        'znk.infra.contentGetters',
        'znk.infra.estimatedScore',
        'znk.infra-act.exerciseUtilityAct',
        'znk.infra-act.examUtility',
        'znk.infra-act.socialSharingAct',
        'chart.js',
        'znk.infra-act.performance',
        'znk.infra.hint'
    ]);
})(angular);

(function () {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .config(["SvgIconSrvProvider", function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'complete-exercise-correct-icon': 'components/completeExerciseAct/svg/correct-icon.svg',
                'complete-exercise-wrong-icon': 'components/completeExerciseAct/svg/wrong-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);
})();


(function () {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .config(["QuestionTypesSrvProvider", "exerciseTypeConst", "SubjectEnumConst", function (QuestionTypesSrvProvider, exerciseTypeConst, SubjectEnumConst) {
            'ngInject';

            function questionTypeGetter(question) {
                var templatesContants = {
                    SIMPLE_QUESTION: 0,
                    MATH_QUESTION: 1,
                    READING_QUESTION: 2,
                    WRITING_QUESTION: 3,
                    ENGLISH_SPECIFIC_PARAGRAPH: 4,
                    ENGLISH_FULL_PARAGRAPHS: 5,
                    SCIENCE_QUESTION: 6,
                    LECTURE_QUESTION: 7
                };

                // lecture question or simple question.
                if ((angular.isDefined(question.exerciseTypeId) && question.exerciseTypeId === exerciseTypeConst.LECTURE) || (question.groupDataId === null && question.paragraph === null)) {
                    return question.exerciseTypeId === exerciseTypeConst.LECTURE ? templatesContants.LECTURE_QUESTION : templatesContants.SIMPLE_QUESTION;
                }

                switch (question.subjectId) {

                    case SubjectEnumConst.MATH:
                        return templatesContants.MATH_QUESTION;

                    case SubjectEnumConst.READING:
                        return templatesContants.READING_QUESTION;

                    case SubjectEnumConst.WRITING:
                        return templatesContants.WRITING_QUESTION;

                    case SubjectEnumConst.ENGLISH:
                        if (question.paragraph !== null && question.paragraph.length > 0) {
                            return templatesContants.ENGLISH_SPECIFIC_PARAGRAPH;
                        }
                        return templatesContants.ENGLISH_FULL_PARAGRAPHS;
                    case SubjectEnumConst.SCIENCE:
                        return templatesContants.SCIENCE_QUESTION;
                    default:
                        return templatesContants.SIMPLE_QUESTION;
                }
            }

            QuestionTypesSrvProvider.setQuestionTypeGetter(questionTypeGetter);

            var map = {
                0: '<simple-question></simple-question>',
                1: '<math-question></math-question>',
                2: '<reading-question></reading-question>',
                3: '<writing-question></writing-question>',
                4: '<english-specific-paragraph></english-specific-paragraph>',
                5: '<english-full-paragraphs></english-full-paragraphs>',
                6: '<science-question></science-question>',
                7: '<lecture-question></lecture-question>'
            };
            QuestionTypesSrvProvider.setQuestionTypesHtmlTemplate(map);
        }])
        .config(["ZnkExerciseAnswersSrvProvider", "ZnkExerciseSrvProvider", "exerciseTypeConst", function (ZnkExerciseAnswersSrvProvider, ZnkExerciseSrvProvider, exerciseTypeConst) {
            'ngInject';

            function selectAnswerIndexFormatter(answerIndex, question) {
                var isOddQuestion = angular.isUndefined(question.__questionStatus.index % 2) ? false : (question.__questionStatus.index % 2);
                if (isOddQuestion) {
                    var I_CHAR_INDEX = 3;
                    if (answerIndex >= I_CHAR_INDEX) {
                        answerIndex++;//  i char should be skipped
                    }
                    var UPPER_F_ASCII_CODE = 70;
                    var formattedAnswerIndex = String.fromCharCode(UPPER_F_ASCII_CODE + answerIndex);
                    return formattedAnswerIndex;
                }
            }

            ZnkExerciseAnswersSrvProvider.config.selectAnswer.setAnswerIndexFormatter(selectAnswerIndexFormatter);

            var allowedTimeForQuestionByExercise = {};
            allowedTimeForQuestionByExercise[exerciseTypeConst.TUTORIAL] = 1.5 * 60 * 1000;
            allowedTimeForQuestionByExercise[exerciseTypeConst.DRILL] = 40 * 1000;
            allowedTimeForQuestionByExercise[exerciseTypeConst.PRACTICE] = 40 * 1000;
            allowedTimeForQuestionByExercise[exerciseTypeConst.GAME] = 40 * 1000;
            ZnkExerciseSrvProvider.setAllowedTimeForQuestionMap(allowedTimeForQuestionByExercise);
        }]);
})();


(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('article',function articleDirective() {
            'ngInject';

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/article.template.html',
                scope: {
                    contentGetter: '&content',
                    deleteUnderScores: '&'
                },
                link: function(scope, element, attrs) {
                    function stringEndsWith(str, searchString) {
                        return str.indexOf(searchString, str.length - searchString.length) !== -1;
                    }

                    function injectLineNumbersToHtml(htmlString) {
                        var start = false;
                        var htmlParagraphs = htmlString.split(/<\s*p\s*>|<\s*p\s*\/\s*>/gi);
                        var j, i, ln = 0;
                        var res = '';
                        for (j = 0; j < htmlParagraphs.length; ++j) {
                            if (htmlParagraphs[j] === '') {
                                continue;
                            }

                            var htmlLines = htmlParagraphs[j].split(/<\s*br\s*>|<\s*br\s*\/\s*>/gi);
                            for (i = 0; i < htmlLines.length; ++i) {
                                if (htmlLines[i].match('_')) {
                                    htmlLines[i] = '<br><span class=\"indented-line\">' + htmlLines[i].replace('_', '') + '</span>';
                                    start = true;
                                }
                                if (!start) {
                                    continue;
                                }
                                ln += 1;
                                if (ln === 1 || ln % 5 === 0) {
                                    if (stringEndsWith(htmlLines[i], '</p>')) {
                                        var lastTagIndex = htmlLines[i].lastIndexOf('<');
                                        var lastTag = htmlLines[i].substr(lastTagIndex);
                                        var markupStart = htmlLines[i].substr(0, lastTagIndex);
                                        htmlLines[i] = markupStart + '<span class=\"num-article\">' + String(ln) + '</span>' + lastTag;
                                    } else {
                                        htmlLines[i] = htmlLines[i] + '<span class=\"num-article\">' + String(ln) + '</span>';
                                    }
                                }
                                htmlLines[i] = htmlLines[i] + '<br>';
                            }
                            res = res + '<p>' + htmlLines.join('') + '</p>';
                        }
                        return '<div class=\"wrap-num-article\">' + res + '</div>';
                    }

                    function arrayMarkups(contentArr) {
                        var markup = '';

                        angular.forEach(contentArr, function (item) {
                            if (item[attrs.markupField]) {
                                markup += item[attrs.markupField];
                            }
                        });

                        return markup;
                    }

                    var content = scope.contentGetter();

                    if (angular.isArray(content)) {
                        content = arrayMarkups(content);
                    }

                    if (content) {
                        content = content.replace(/font\-family: \'Lato Regular\';/g, 'font-family: Lato;font-weight: 400;');
                        if (scope.deleteUnderScores()) {
                            angular.element(element[0].querySelector('.article-content')).html(content.replace(/_/g, ''));
                        } else {
                            angular.element(element[0].querySelector('.article-content')).html(injectLineNumbersToHtml(content));
                        }
                    }
                }
            };

            return directive;
        });
})(angular);

/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct').component('completeExerciseSummary', {
        templateUrl: 'components/completeExerciseAct/directives/completeExerciseSummary/completeExerciseSummaryDirective.template.html',
        require: {
            completeExerciseCtrl: '^completeExercise'
        },
        controller: ["CompleteExerciseSrv", "SubjectEnum", "$q", "StatsSrv", "CategoryService", "TestScoreCategoryEnum", "$filter", "ExerciseTypeEnum", "masteryLevel", "ScoringService", "PerformanceData", "$timeout", "HintSrv", "UserScreenSharingStateEnum", "ScreenSharingSrv", "$log", "ENV", function (CompleteExerciseSrv, SubjectEnum, $q, StatsSrv, CategoryService, TestScoreCategoryEnum, $filter, ExerciseTypeEnum, masteryLevel, ScoringService, PerformanceData, $timeout, HintSrv, UserScreenSharingStateEnum, ScreenSharingSrv, $log, ENV) {
            'ngInject';

            var $ctrl = this;
            var PERCENTAGE = 100;
            var translateFilter = $filter('translate');

            PerformanceData.getPerformanceData().then(function (performanceData) {
                $ctrl.performanceData = performanceData;
                setPerformanceData();
            });
            if (ENV.appContext === 'student') {
                $timeout(function () {
                    HintSrv.triggerHint(HintSrv.hintMap.IN_APP_MESSAGE_WORKOUT_SUMMARY);
                }, 500);
            }

            var screenSharingData;
            var currUserScreenSharingStateChangeCb = function (newUserScreenSharingState) {
                if (newUserScreenSharingState === UserScreenSharingStateEnum.SHARER.enum) {
                    ScreenSharingSrv.getActiveScreenSharingData().then(function (_screenSharingData) {
                        screenSharingData = _screenSharingData;
                        screenSharingData.activeExercise = {
                            exerciseTypeId: $ctrl.exerciseData.exerciseTypeId,
                            exerciseId: $ctrl.exerciseData.id,
                            activeScreen: 'SUMMARY'
                        };
                        screenSharingData.$save();
                    }).catch(function (err) {
                        $log.error(err);
                    });
                }
            };
            ScreenSharingSrv.registerToCurrUserScreenSharingStateChanges(currUserScreenSharingStateChangeCb);

            function setPerformanceData() {
                var GENERAL_CATEGORIES_STATS = 'level3Categories';
                var questionsArr = $ctrl.exerciseData.questions;
                var statsProm = StatsSrv.getStats();
                var categoryMapProm = CategoryService.getCategoryMap();
                $ctrl.generalCategories = {};

                $q.all([statsProm, categoryMapProm]).then(function (results) {
                    var statsObj = results[0];
                    var categoryMap = results[1];

                    function buildGeneralCategory(question) {
                        CategoryService.getParentCategory(question.categoryId).then(function (generalCategory) {
                            if (generalCategory && !$ctrl.generalCategories[generalCategory.id] && statsObj[GENERAL_CATEGORIES_STATS]['id_' + generalCategory.id]) {
                                var generalCategoryObj = statsObj[GENERAL_CATEGORIES_STATS]['id_' + generalCategory.id];
                                var progress = getProgress(generalCategoryObj);

                                $ctrl.generalCategories[generalCategory.id] = {};
                                $ctrl.generalCategories[generalCategory.id].name = categoryMap[generalCategoryObj.id].name;
                                $ctrl.generalCategories[generalCategory.id].progress = progress;
                                $ctrl.generalCategories[generalCategory.id].mastery = masteryLevel.getMasteryLevel(progress);

                                if ($ctrl.exerciseData.exerciseTypeId !== ExerciseTypeEnum.SECTION.enum) {
                                    var subScoreObj = categoryMap[generalCategory.parentId];
                                    $ctrl.categoryName = translateFilter('COMPLETE_EXERCISE_ACT.COMPLETE_EXERCISE_SUMMARY.CATEGORY') + ': ' + subScoreObj.name;
                                }
                            }
                        });
                    }

                    function _calcMasteryDifference() {
                        var SUBJECT_STATS = 'level1Categories';
                        var subjectProgress = statsObj[SUBJECT_STATS];
                        subjectProgress = subjectProgress['id_' + $ctrl.currentSubjectId];

                        var oldSubjectMastery = _calcOldSubjectMastery(subjectProgress);
                        var currentSubjectProgress = $ctrl.performanceData[$ctrl.currentSubjectId].progress;
                        $ctrl.subjectsDelta = currentSubjectProgress - oldSubjectMastery;
                    }

                    function getProgress(generalCategoryObj) {
                        return generalCategoryObj.totalQuestions > 0 ? Math.round((generalCategoryObj.correct * PERCENTAGE) / generalCategoryObj.totalQuestions) : 0;
                    }

                    function _calcOldSubjectMastery(subjectStats) {
                        var totalQuestions = subjectStats.totalQuestions;
                        var numOfTotalCorrectAnswers = subjectStats.correct;

                        var numOfExerciseQuestions = $ctrl.exerciseResults.questionResults.length;
                        var numOfCorrectExerciseAnswers = $ctrl.exerciseResults.correctAnswersNum;

                        var oldNumOfTotalQuestions = totalQuestions - numOfExerciseQuestions;
                        var oldNumOfCorrectAnswers = numOfTotalCorrectAnswers - numOfCorrectExerciseAnswers;

                        return _calcAvgPercentage(oldNumOfCorrectAnswers, oldNumOfTotalQuestions);
                    }

                    function _calcAvgPercentage(num, total) {
                        return Math.round((num / total) * 100);
                    }

                    for (var i = 0; i < questionsArr.length; i++) {
                        buildGeneralCategory(questionsArr[i]);
                    }
                    _calcMasteryDifference();
                });
            }

            function _calcSectionScoring() {
                var resultForScoring = {
                    subjectId: $ctrl.exerciseData.subjectId,
                    typeId: $ctrl.exerciseData.examData.typeId,
                    questions: $ctrl.exerciseData.questions,
                    answers: $ctrl.exerciseResults.questionResults.map(function (result) {
                        return {
                            userAnswerId: result.questionId,
                            isAnswerCorrectly: result.isAnsweredCorrectly
                        };
                    })
                };
                ScoringService.getScoreSectionResult(resultForScoring).then(function (scoreObj) {
                    $ctrl.testScoreTitle = translateFilter('WORKOUTS_WORKOUT_SUMMARY.TEST_TITLE') + scoreObj.scoreSection;
                });
            }

            function translateSubjectName(subjectId) {
                var subjectName = translateFilter(angular.uppercase(SubjectEnum.getEnumMap()[subjectId]));
                return subjectName ? subjectName.toLowerCase() : '';
            }

            this.$onInit = function () {
                $ctrl.exerciseData = $ctrl.completeExerciseCtrl.getExerciseContent();
                $ctrl.exerciseResults = $ctrl.completeExerciseCtrl.getExerciseResult();
                $ctrl.subjectName = translateSubjectName($ctrl.exerciseData.subjectId);
                $ctrl.currentSubjectId = $ctrl.exerciseData.subjectId;
                $ctrl.activeExerciseId = $ctrl.exerciseData.id;
                $ctrl.avgTime = {
                    correctAvgTime: Math.round($ctrl.exerciseResults.correctAvgTime / 1000),
                    wrongAvgTime: Math.round($ctrl.exerciseResults.wrongAvgTime / 1000),
                    skippedAvgTime: Math.round($ctrl.exerciseResults.skippedAvgTime / 1000)
                };

                if ($ctrl.exerciseData.exerciseTypeId === ExerciseTypeEnum.SECTION.enum) {
                    _calcSectionScoring();
                }

                $ctrl.seenSummary = $ctrl.exerciseResults.seenSummary;

                if (!$ctrl.exerciseResults.seenSummary) {
                    $ctrl.exerciseResults.seenSummary = true;
                    $ctrl.exerciseResults.$save();
                }

                // @todo: translate labels
                $ctrl.gaugeSuccessRate = $ctrl.exerciseData.questions.length > 0 ? Math.round(($ctrl.exerciseResults.correctAnswersNum * PERCENTAGE) / $ctrl.exerciseData.questions.length) : 0;
                $ctrl.performenceChart = {
                    labels: ['Correct', 'Wrong', 'Unanswered'],
                    data: [$ctrl.exerciseResults.correctAnswersNum, $ctrl.exerciseResults.wrongAnswersNum, $ctrl.exerciseResults.skippedAnswersNum],
                    colours: ['#87ca4d', '#ff6766', '#ebebeb'],
                    options: {
                        segmentShowStroke: false,
                        percentageInnerCutout: 85,
                        showTooltips: false,
                        animation: false
                    }
                };

                this.goToSummary = function () {
                    this.completeExerciseCtrl.changeViewState(CompleteExerciseSrv.VIEW_STATES.EXERCISE);
                };
            };

            this.$onDestroy = function () {
                ScreenSharingSrv.unregisterFromCurrUserScreenSharingStateChanges(currUserScreenSharingStateChangeCb);
                if (screenSharingData) {
                    screenSharingData.activeExercise = null;
                    screenSharingData.$save();
                }
            };
        }]
    });
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('customAnswerBuilderAct', ["ZnkExerciseViewModeEnum", "AnswerTypeEnum", function (ZnkExerciseViewModeEnum, AnswerTypeEnum) {
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
        }]);
})(angular);


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

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('englishSpecificParagraph', function () {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    scope.vm = {
                        question: questionBuilderCtrl.question,
                        SPECIFIC_PARAGRAPH: 1,
                        FULL_PASSAGE: 2
                    };
                    scope.vm.view = scope.vm.SPECIFIC_PARAGRAPH;

                    var paragraph = questionBuilderCtrl.question.paragraph.replace(/_/g, '');
                    angular.element(element[0].querySelector('.paragraph')).append(paragraph);
                    angular.element(element[0].querySelector('.paragraph-title')).append(questionBuilderCtrl.question.paragraphTitle);
                    angular.element(element[0].querySelector('.question-content')).append(questionBuilderCtrl.question.content);
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/englishSpecificParagraph.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);

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





(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('freeTextAnswer', ["ZnkExerciseViewModeEnum", "$timeout", function (ZnkExerciseViewModeEnum, $timeout) {
            'ngInject';

            return {
                templateUrl: 'components/completeExerciseAct/templates/freeTextAnswer.template.html',
                require: ['^ngModel', '^answerBuilder'],
                scope: {},
                link: function (scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0];
                    var answerBuilderCtrl = ctrls[1];
                    var userAnswerValidation = /^[0-9\/\.]{0,4}$/;

                    scope.d = {};

                    scope.d.userAnswer = '';  // stores the current userAnswer
                    scope.d.userAnswerGetterSetter = function (newUserAnswer) {
                        if (arguments.length && _isAnswerValid(newUserAnswer)) {
                            scope.d.userAnswer = newUserAnswer;
                            return scope.d.userAnswer;
                        }
                        return scope.d.userAnswer;
                    };

                    function _isAnswerValid(answerToCheck) {
                        return userAnswerValidation.test(answerToCheck);
                    }

                    var MODE_ANSWER_ONLY = ZnkExerciseViewModeEnum.ONLY_ANSWER.enum,
                        MODE_REVIEW = ZnkExerciseViewModeEnum.REVIEW.enum,
                        MODE_MUST_ANSWER = ZnkExerciseViewModeEnum.MUST_ANSWER.enum;

                    scope.clickHandler = function () {
                        ngModelCtrl.$setViewValue(scope.d.userAnswer);
                        updateViewByCorrectAnswers(scope.d.userAnswer);
                    };

                    function updateViewByCorrectAnswers(userAnswer) {
                        var correctAnswers = answerBuilderCtrl.question.correctAnswerText;
                        var viewMode = answerBuilderCtrl.getViewMode();
                        scope.correctAnswer = correctAnswers[0].content;

                        if (viewMode === MODE_ANSWER_ONLY || viewMode === MODE_MUST_ANSWER) {
                            scope.d.userAnswer = angular.isDefined(userAnswer) ? userAnswer : '';
                            scope.showCorrectAnswer = false;
                        } else {
                            if (angular.isUndefined(userAnswer)) {
                                // unanswered question
                                scope.userAnswerStatus = 'neutral';
                                scope.showCorrectAnswer = viewMode === MODE_REVIEW;
                            } else {
                                if (_isAnsweredCorrectly(userAnswer, correctAnswers)) {
                                    scope.userAnswerStatus = 'correct';
                                } else {
                                    scope.userAnswerStatus = 'wrong';
                                }
                                scope.showCorrectAnswer = true;
                                scope.d.userAnswer = userAnswer;
                            }
                        }
                    }

                    function _isAnsweredCorrectly(userAnswer, correctAnswers) {
                        for (var i = 0; i < correctAnswers.length; i++) {
                            if (userAnswer === correctAnswers[i].content) {
                                return true;
                            }
                        }
                        return false;
                    }

                    ngModelCtrl.$render = function () {
                        //  skip one digest cycle in order to let the answers time to be compiled
                        $timeout(function () {
                            updateViewByCorrectAnswers(ngModelCtrl.$viewValue);
                        });
                    };

                    ngModelCtrl.$render();
                }
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('lectureQuestion', function () {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    scope.vm = {
                        question: questionBuilderCtrl.question
                    };
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/lectureQuestion.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('mathQuestion', function () {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    var content = questionBuilderCtrl.question.content;
                    var answerContentElement = angular.element(element[0].querySelector('.answer-content'));
                    answerContentElement.append(content);

                    var questionContainerElement = angular.element(element[0].querySelector('.question-container'));
                    var paragraphsArray = questionBuilderCtrl.question.groupData.paragraphs;
                    for (var i = 0; i < paragraphsArray.length; i++) {
                        questionContainerElement.append(paragraphsArray[i].body);
                    }
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/mathQuestion.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('rateAnswer', ["ZnkExerciseViewModeEnum", function (ZnkExerciseViewModeEnum) {
            'ngInject';

            return {
                templateUrl: 'components/completeExerciseAct/templates/rateAnswer.template.html',
                require: ['^answerBuilder', '^ngModel'],
                scope: {},
                link: function link(scope, element, attrs, ctrls) {
                    var domElement = element[0];

                    var answerBuilder = ctrls[0];
                    var ngModelCtrl = ctrls[1];

                    var viewMode = answerBuilder.getViewMode();
                    var ANSWER_WITH_RESULT_MODE = ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum,
                        REVIEW_MODE = ZnkExerciseViewModeEnum.REVIEW.enum;
                    var INDEX_OFFSET = 2;

                    scope.d = {};
                    scope.d.itemsArray = new Array(11);
                    var answers = answerBuilder.question.correctAnswerText;

                    var domItemsArray;

                    var destroyWatcher = scope.$watch(
                        function () {
                            return element[0].querySelectorAll('.item-repeater');
                        },
                        function (val) {
                            if (val) {
                                destroyWatcher();
                                domItemsArray = val;

                                if (viewMode === REVIEW_MODE) {
                                    scope.clickHandler = angular.noop;
                                    updateItemsByCorrectAnswers(scope.d.answers);
                                } else {
                                    scope.clickHandler = clickHandler;
                                }

                                ngModelCtrl.$render = function () {
                                    updateItemsByCorrectAnswers();
                                };
                                ngModelCtrl.$render();
                            }
                        }
                    );

                    function clickHandler(index) {
                        if (answerBuilder.canUserAnswerBeChanged()) {
                            return;
                        }

                        ngModelCtrl.$setViewValue(index);
                        updateItemsByCorrectAnswers();
                    }

                    function updateItemsByCorrectAnswers() {
                        var oldSelectedElement = angular.element(domElement.querySelector('.selected'));
                        oldSelectedElement.removeClass('selected');

                        var selectedAnswerId = ngModelCtrl.$viewValue;

                        var newSelectedElement = angular.element(domItemsArray[selectedAnswerId]);
                        newSelectedElement.addClass('selected');

                        var lastElemIndex = answers.length - 1;

                        if ((viewMode === ANSWER_WITH_RESULT_MODE && angular.isNumber(selectedAnswerId)) || viewMode === REVIEW_MODE) {
                            for (var i = 0; i < lastElemIndex; i++) {
                                angular.element(domItemsArray[answers[i].id - INDEX_OFFSET]).addClass('correct');
                            }
                            angular.element(domItemsArray[answers[lastElemIndex].id - INDEX_OFFSET]).addClass('correct-edge');
                        }

                        if (angular.isNumber(selectedAnswerId) && (viewMode === REVIEW_MODE || viewMode === ANSWER_WITH_RESULT_MODE)) {
                            if (selectedAnswerId >= answers[0].id - INDEX_OFFSET && selectedAnswerId <= answers[lastElemIndex].id - INDEX_OFFSET) {
                                angular.element(domItemsArray[selectedAnswerId]).addClass('selected-correct');
                            } else {
                                angular.element(domItemsArray[selectedAnswerId]).addClass('selected-wrong');
                            }
                        }
                    }
                }
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('readingQuestion', ["articleSrv", function (articleSrv) {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    scope.vm = {
                        question: questionBuilderCtrl.question
                    };

                    var content = articleSrv.numberLines(questionBuilderCtrl.question.groupData.paragraphs);
                    content = content.replace(/font-family:Lato Light;/g, 'font-family: Lato;font-weight: 300;');
                    var articleLinesElement = angular.element('<div class=\"wrap-num-article\"></div>');
                    var articleContentElement = angular.element(element[0].querySelector('.article-content'));
                    // content.replace(/font\-family:\'Lato Light\';/g, 'font-family: Lato;font-weight: 400;');

                    articleLinesElement.append(content);
                    articleContentElement.append(articleLinesElement);

                    angular.element(element[0].querySelector('.paragraph-title')).append(questionBuilderCtrl.question.paragraphTitle);
                    angular.element(element[0].querySelector('.question-content')).append(questionBuilderCtrl.question.content);
                    scope.vm.passageTitle = scope.vm.question.passageTitle;
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/readingQuestion.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('scienceQuestion', function () {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    scope.vm = {
                        question: questionBuilderCtrl.question
                    };

                    angular.element(element[0].querySelector('.paragraph-title')).append(questionBuilderCtrl.question.paragraphTitle);
                    angular.element(element[0].querySelector('.question-content')).append(questionBuilderCtrl.question.content);

                    var questionContainerDomElement = angular.element(element[0].querySelector('.paragraphs-wrapper'));

                    var paragraphArray = questionBuilderCtrl.question.groupData.paragraphs;

                    for (var i = 0; i < paragraphArray.length; i++) {
                        var paragraph = paragraphArray[i].body.replace(/_/g, '');
                        questionContainerDomElement.append(paragraph);
                    }
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/scienceQuestion.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('selectAnswer', ["$timeout", "ZnkExerciseViewModeEnum", "ZnkExerciseAnswersSrv", "ZnkExerciseEvents", "$document", function ($timeout, ZnkExerciseViewModeEnum, ZnkExerciseAnswersSrv, ZnkExerciseEvents, $document) {
            'ngInject';

            return {
                templateUrl: 'components/completeExerciseAct/templates/selectAnswer.template.html',
                require: ['^answerBuilder', '^ngModel'],
                restrict: 'E',
                scope: {},
                link: function (scope, element, attrs, ctrls) {
                    var answerBuilder = ctrls[0];
                    var ngModelCtrl = ctrls[1];
                    var questionIndex = answerBuilder.question.__questionStatus.index;
                    var currentSlide = answerBuilder.getCurrentIndex();    // current question/slide in the viewport
                    var body = $document[0].body;


                    var MODE_ANSWER_WITH_QUESTION = ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum,
                        MODE_ANSWER_ONLY = ZnkExerciseViewModeEnum.ONLY_ANSWER.enum,
                        MODE_REVIEW = ZnkExerciseViewModeEnum.REVIEW.enum,
                        MODE_MUST_ANSWER = ZnkExerciseViewModeEnum.MUST_ANSWER.enum;
                    var keyMap = {};

                    scope.d = {};

                    scope.d.answers = answerBuilder.question.answers;

                    scope.d.click = function (answer) {
                        var viewMode = answerBuilder.getViewMode();
                        if ((!isNaN(parseInt(ngModelCtrl.$viewValue, 10)) && viewMode === MODE_ANSWER_WITH_QUESTION) || viewMode === MODE_REVIEW) {
                            return;
                        }
                        ngModelCtrl.$setViewValue(answer.id);
                        updateAnswersFollowingSelection(viewMode);
                    };

                    function keyboardHandler(key) {
                        key = String.fromCharCode(key.keyCode).toUpperCase();
                        if (angular.isDefined(keyMap[key])) {
                            scope.d.click(scope.d.answers[keyMap[key]]);
                        }
                    }

                    if (questionIndex === currentSlide) {
                        body.addEventListener('keydown', keyboardHandler);
                    }

                    scope.$on(ZnkExerciseEvents.QUESTION_CHANGED, function (event, value, prevValue, currQuestion) {
                        var _currentSlide = currQuestion.__questionStatus.index;
                        if (questionIndex !== _currentSlide) {
                            body.removeEventListener('keydown', keyboardHandler);
                        } else {
                            body.addEventListener('keydown', keyboardHandler);
                        }
                    });


                    scope.d.getIndexChar = function (answerIndex) {
                        var key = ZnkExerciseAnswersSrv.selectAnswer.getAnswerIndex(answerIndex, answerBuilder.question);
                        keyMap[key] = answerIndex;
                        return key;
                    };

                    function updateAnswersFollowingSelection() {
                        var selectedAnswerId = ngModelCtrl.$viewValue;
                        var correctAnswerId = answerBuilder.question.correctAnswerId;
                        var $answers = angular.element(element[0].querySelectorAll('.answer'));
                        for (var i = 0; i < $answers.length; i++) {
                            var $answerElem = angular.element($answers[i]);
                            if (!$answerElem || !$answerElem.scope || !$answerElem.scope()) {
                                continue;
                            }

                            var answer = $answerElem.scope().answer;
                            var classToAdd,
                                classToRemove;

                            if (answerBuilder.getViewMode() === MODE_ANSWER_ONLY || answerBuilder.getViewMode() === MODE_MUST_ANSWER) {
                                // dont show correct / wrong indication
                                classToRemove = 'answered';
                                classToAdd = selectedAnswerId === answer.id ? 'answered' : 'neutral';
                            } else {
                                // the rest of the optional states involve correct / wrong indications
                                if (angular.isUndefined(selectedAnswerId)) {
                                    // unanswered question
                                    if (answerBuilder.getViewMode() === MODE_REVIEW) {
                                        classToAdd = correctAnswerId === answer.id ? 'answered-incorrect' : 'neutral';
                                    }
                                } else if (selectedAnswerId === answer.id) {
                                    // this is the selected answer
                                    classToAdd = correctAnswerId === answer.id ? 'correct' : 'wrong';
                                } else {
                                    // this is the correct answer but the user didn't select it
                                    classToAdd = answer.id === correctAnswerId ? 'answered-incorrect' : 'neutral';
                                }
                            }
                            $answerElem.removeClass(classToRemove);
                            $answerElem.addClass(classToAdd);
                        }
                    }

                    ngModelCtrl.$render = function () {
                        //  skip one digest cycle in order to let the answers time to be compiled
                        $timeout(function () {
                            updateAnswersFollowingSelection();
                        });
                    };
                    //  ng model controller render function not triggered in case render function was set
                    //  after the model value was changed
                    ngModelCtrl.$render();

                    scope.$on('exercise:viewModeChanged', function () {
                        ngModelCtrl.$render();
                    });

                    scope.$on('$destroy', function () {
                        body.removeEventListener('keydown', keyboardHandler);
                    });
                }
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('simpleQuestion', function simpleQuestionDirective() {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    var content = questionBuilderCtrl.question.content.replace(/_/g, '');
                    var questionContentElement = angular.element(element[0].querySelector('.question-content'));
                    questionContentElement.append(content);
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/simpleQuestion.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .controller('SocialSharingController',
            ["SocialSharingSrv", "$filter", "SubjectEnum", "ENV", "$window", function (SocialSharingSrv, $filter, SubjectEnum, ENV, $window) {
                'ngInject';

                var self = this;
                var translateFilter = $filter('translate');
                self.showSocialArea = false;

                var subjectMap = {};
                subjectMap[SubjectEnum.MATH.enum] = 'math';
                subjectMap[SubjectEnum.ENGLISH.enum] = 'english';
                subjectMap[SubjectEnum.READING.enum] = 'reading';
                subjectMap[SubjectEnum.SCIENCE.enum] = 'science';
                subjectMap[SubjectEnum.WRITING.enum] = 'writing';

                // return if subjectId is in excludeArr
                if (self.excludeArr && angular.isArray(self.excludeArr)) {
                    for (var i = 0, ii = self.excludeArr.length; i < ii; i++) {
                        if (self.subjectId === self.excludeArr[i]) {
                            return;
                        }
                    }
                }

                SocialSharingSrv.getSharingData(self.subjectId).then(function (sharingData) {
                    self.showSocialArea = sharingData;

                    if (sharingData) {
                        self.subjectName = subjectMap[self.subjectId];
                        var image = $window.location.protocol + ENV.zinkerzWebsiteBaseUrl + 'images/share/' + sharingData.shareUrlMap[self.subjectName];
                        var descriptionTranslate = sharingData.isImproved ? 'IMPROVED_TEXT' : 'SHARE_DESCRIPTION';
                        var description = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.' + descriptionTranslate, { pts: sharingData.points, subjectName: self.subjectName });
                        var title = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.SHARE_TITLE');
                        var caption = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.SHARE_CAPTION');
                        var hashtags = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.SHARE_HASHTAGS');
                        var shareUrl =  $window.location.protocol + ENV.zinkezWebsiteUrl;

                        self.shareData = {};                        
                        self.shareData.facebook = {
                            type: 'facebook',
                            display: 'popup',
                            link: shareUrl,
                            picture: image,
                            caption: caption,
                            description: description,
                            app_id: ENV.facebookAppId,
                            name: title
                        };

                        self.shareData.google = {
                            url: shareUrl,
                        };

                        self.shareData.twitter = {
                            type: 'twitter',
                            url: shareUrl,
                            text: description,
                            hashtags: hashtags
                        };
                    }
                });
            }]);
})(angular);

(function(angular){
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('socialSharing',function(){
            'ngInject';

            var directive = {
                scope: {
                    subjectId: '=',
                    excludeArr: '=?',
                    animate: '=?'
                },
                restrict: 'E',
                templateUrl: 'components/completeExerciseAct/directives/socialSharing/socialSharing.template.html',
                controller: 'SocialSharingController',
                bindToController: true,
                controllerAs: 'vm'
            };

            return directive;
        });
})(angular);

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

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('writingQuestion', function () {
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
                templateUrl: 'components/completeExerciseAct/templates/writingQuestion.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('writingSpecificParagraph', function () {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    scope.vm = {
                        question: questionBuilderCtrl.question,
                        SPECIFIC_PARAGRAPH: 1,
                        FULL_PASSAGE: 2
                    };
                    scope.vm.view = scope.vm.SPECIFIC_PARAGRAPH;

                    var paragraph = questionBuilderCtrl.question.paragraph.replace(/_/g, '');
                    var paragraphDomElement = angular.element(element[0].querySelector('.paragraph'));
                    var paragraphTitleDomElement = angular.element(element[0].querySelector('.paragraph-title'));
                    var questionContentDomElement = angular.element(element[0].querySelector('.question-content'));

                    paragraphDomElement.append(paragraph);
                    paragraphTitleDomElement.append(questionBuilderCtrl.question.paragraphTitle);
                    questionContentDomElement.append(questionBuilderCtrl.question.content);
                    var paragraphsArray = scope.vm.question.groupData.paragraphs;
                    var fullPassageElement = angular.element(element[0].querySelector('.full-passage'));
                    for (var i = 0; i < paragraphsArray.length; i++) {
                        fullPassageElement.append('<div class="paragraph-number-title">[' + (i + 1) + ']</div>');
                        fullPassageElement.append(paragraphsArray[i].body);
                    }
                }
                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/writingSpecificParagraph.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .service('articleSrv',function () {
            'ngInject';

            this.numberLines = function (content) {
                if (angular.isArray(content)) {
                    content = _arrayMarkups(content);
                }
                content = content.replace(/font\-family: \'Lato Regular\';/g, 'font-family: Lato;font-weight: 400;');

                var start = false;
                var htmlParagraphs = content.split(/<\s*p\s*>|<\s*p\s*\/\s*>/gi);
                var j, i, ln = 0;
                var res = '';
                for (j = 0; j < htmlParagraphs.length; ++j) {
                    if (htmlParagraphs[j] === '') {
                        continue;
                    }

                    var htmlLines = htmlParagraphs[j].split(/<\s*br\s*>|<\s*br\s*\/\s*>/gi);
                    for (i = 0; i < htmlLines.length; ++i) {
                        if (htmlLines[i].match('_')) {
                            htmlLines[i] = '<br><span class=\"indented-line\">' + htmlLines[i].replace('_', '') + '</span>';
                            start = true;
                        }
                        if (!start) {
                            continue;
                        }
                        if (htmlLines[i].match('#')) {
                            htmlLines[i] = htmlLines[i].replace('#', '');
                            continue;
                        }
                        ln += 1;
                        if (ln === 1 || ln % 5 === 0) {
                            if (_stringEndsWith(htmlLines[i], '</p>')) {
                                var lastTagIndex = htmlLines[i].lastIndexOf('<');
                                var lastTag = htmlLines[i].substr(lastTagIndex);
                                var markupStart = htmlLines[i].substr(0, lastTagIndex);
                                htmlLines[i] = markupStart + '<span class=\"num-article\">' + String(ln) + '</span>' + lastTag;
                            } else {
                                htmlLines[i] = htmlLines[i] + '<span class=\"num-article\">' + String(ln) + '</span>';
                            }
                        }
                        htmlLines[i] = htmlLines[i] + '<br>';
                    }
                    res = res + '<p>' + htmlLines.join('') + '</p>';
                }
                return res;
            };

            function _arrayMarkups(contentArr) {
                var markup = '';

                angular.forEach(contentArr, function (item) {
                    if (item.body) {
                        markup += item.body;
                    }
                });

                return markup;
            }

            function _stringEndsWith(str, searchString) {
                return str.indexOf(searchString, str.length - searchString.length) !== -1;
            }
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .service('completeExerciseActSrv', ["$q", "$log", "ExerciseTypeEnum", "ExerciseResultSrv", "ExamSrv", function ($q, $log, ExerciseTypeEnum, ExerciseResultSrv, ExamSrv) {
            'ngInject';

            this.mergedTestScoresIfCompleted = function (exam, examResult, questionsData, resultsData) {
                if (!exam || !questionsData || !resultsData || !examResult) {
                    var errMsg = 'completeExerciseActSrv combinedSections:' +
                        'one or more of the arguments is missing!';
                    $log.error(errMsg, 'arguments:', arguments);
                    return $q.reject(errMsg);
                }
                resultsData = angular.copy(resultsData);
                questionsData = angular.copy(questionsData);
                var examId = exam.id;
                var subjectId = questionsData.subjectId;
                var currentSectionId = questionsData.id;
                var sectionResults = examResult.sectionResults;
                var sectionProms = [];
                var getOtherSections = exam.sections.filter(function (section) {
                    return section.subjectId === subjectId && currentSectionId !== section.id;
                });
                angular.forEach(getOtherSections, function (sectionBySubject) {
                    var sectionKey = sectionResults[sectionBySubject.id];
                    if (sectionKey) {
                        var exerciseResultProm = ExerciseResultSrv.getExerciseResult(ExerciseTypeEnum.SECTION.enum, sectionBySubject.id, examId, null, true);
                        var examSectionProm = ExamSrv.getExamSection(sectionBySubject.id);
                        sectionProms.push(exerciseResultProm);
                        sectionProms.push(examSectionProm);
                    }
                });
                if (sectionProms.length === 0) {
                    return $q.when(false);
                }
                return $q.all(sectionProms).then(function (results) {
                    var lengthResults = 0;
                    angular.forEach(results, function (result, index) {
                        if (result.isComplete) {
                            questionsData.questions = questionsData.questions.concat(results[index + 1].questions);
                            resultsData.questionResults = resultsData.questionResults.concat(result.questionResults);
                            lengthResults += 2;
                        }
                    });
                    if (results.length !== lengthResults) {
                        return $q.when(false);
                    }
                    return {
                        questionsData: questionsData,
                        resultsData: resultsData
                    };
                });
            };
        }]);
})(angular);

angular.module('znk.infra-act.completeExerciseAct').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/completeExerciseAct/directives/completeExerciseSummary/completeExerciseSummaryDirective.template.html",
    "<div class=\"base-complete-exercise-container\"\n" +
    "     translate-namespace=\"COMPLETE_EXERCISE_ACT.COMPLETE_EXERCISE_SUMMARY\"\n" +
    "     subject-id-to-attr-drv=\"$ctrl.currentSubjectId\">\n" +
    "\n" +
    "    <complete-exercise-header></complete-exercise-header>\n" +
    "    <div class=\"complete-exercise-summary-wrapper\">\n" +
    "        <social-sharing\n" +
    "            subject-id=\"::$ctrl.currentSubjectId\"\n" +
    "            animate=\"true\">\n" +
    "        </social-sharing>\n" +
    "\n" +
    "        <div class=\"section\">\n" +
    "            <div class=\"test-score-title\">{{::$ctrl.testScoreTitle}}</div>\n" +
    "            <div class=\"gauge-row-wrapper\">\n" +
    "                <div class=\"overflowWrap\">\n" +
    "                    <div class=\"gauge-wrap\">\n" +
    "                        <div class=\"gauge-inner-text\">{{::$ctrl.gaugeSuccessRate}}%\n" +
    "                            <div class=\"success-title\" translate=\".SUCCESS\"></div>\n" +
    "                        </div>\n" +
    "                        <canvas\n" +
    "                            width=\"134px\"\n" +
    "                            height=\"134px\"\n" +
    "                            id=\"doughnut\"\n" +
    "                            class=\"chart chart-doughnut\"\n" +
    "                            chart-options=\"$ctrl.performenceChart.options\"\n" +
    "                            chart-colours=\"$ctrl.performenceChart.colours\"\n" +
    "                            chart-data=\"$ctrl.performenceChart.data\"\n" +
    "                            chart-labels=\"$ctrl.performenceChart.labels\"\n" +
    "                            chart-legend=\"false\">\n" +
    "                        </canvas>\n" +
    "                    </div>\n" +
    "                    <div class=\"statistics\">\n" +
    "                        <div class=\"stat-row\">\n" +
    "                            <div class=\"stat-val correct\">{{::$ctrl.exerciseResults.correctAnswersNum}}</div>\n" +
    "                            <div class=\"title\" translate=\".CORRECT\"></div>\n" +
    "                            <div class=\"avg-score\"><span translate=\".AVG\"></span>. {{::$ctrl.avgTime.correctAvgTime}}\n" +
    "                                <span translate=\".SEC\"></span></div>\n" +
    "                        </div>\n" +
    "\n" +
    "                        <div class=\"stat-row\">\n" +
    "                            <div class=\"stat-val wrong\">{{::$ctrl.exerciseResults.wrongAnswersNum}}</div>\n" +
    "                            <div class=\"title\" translate=\".WRONG\"></div>\n" +
    "                            <div class=\"avg-score\"><span translate=\".AVG\"></span>. {{::$ctrl.avgTime.wrongAvgTime}}\n" +
    "                                <span translate=\".SEC\"></span></div>\n" +
    "                        </div>\n" +
    "\n" +
    "                        <div class=\"stat-row\">\n" +
    "                            <div class=\"stat-val skipped\">{{::$ctrl.exerciseResults.skippedAnswersNum}}</div>\n" +
    "                            <div class=\"title\" translate=\".SKIPPED\"></div>\n" +
    "                            <div class=\"avg-score\"><span translate=\".AVG\"></span>. {{::$ctrl.avgTime.skippedAvgTime}}\n" +
    "                                <span translate=\".SEC\"></span></div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "\n" +
    "                <div class=\"category-name\">{{$ctrl.categoryName | cutString: 42}}</div>\n" +
    "            </div>\n" +
    "            <div class=\"review-btn-wrapper\">\n" +
    "            <md-button class=\"md-primary znk\"\n" +
    "                       aria-label=\"{{'COMPLETE_EXERCISE_ACT.COMPLETE_EXERCISE_SUMMARY.REVIEW' | translate}}\"\n" +
    "                       tabindex=\"1\"\n" +
    "                       md-no-ink\n" +
    "                       ng-cloak\n" +
    "                       ng-click=\"$ctrl.goToSummary()\">\n" +
    "                <span translate=\".REVIEW\"></span>\n" +
    "            </md-button>\n" +
    "        </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"section time-line-wrapper2\" ng-class=\"{'seen-summary': $ctrl.seenSummary}\">\n" +
    "\n" +
    "            <div class=\"estimated-score-title\">{{$ctrl.subjectName}} <span translate=\".ESTIMATED_SCORE\"></span></div>\n" +
    "            <performance-timeline\n" +
    "                on-timeline-finish=\"vm.onTimelineFinish(subjectDelta)\"\n" +
    "                subject-id=\"{{::$ctrl.currentSubjectId}}\"\n" +
    "                show-induction=\"true\"\n" +
    "                active-exercise-id=\"::$ctrl.activeExerciseId\">\n" +
    "            </performance-timeline>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"section proficiency-level-row animate-if\" ng-if=\"!$ctrl.seenSummary\">\n" +
    "            <div class=\"proficiency-title-row\" translate=\".MASTERY_LEVEL\"></div>\n" +
    "            <div class=\"row data-row\">\n" +
    "                <div class=\"subject-level\">\n" +
    "                    <div class=\"subject-name\">{{$ctrl.subjectName}}</div>\n" +
    "                    <div class=\"subject-progress\">\n" +
    "                        <div class=\"progress\">\n" +
    "                            <div znk-progress-bar\n" +
    "                                 progress-width=\"{{$ctrl.performanceData[$ctrl.currentSubjectId].overall.progress}}\"\n" +
    "                                 show-progress-value=\"false\"></div>\n" +
    "                            <span class=\"title\" translate=\".MASTERY\"></span>\n" +
    "                        </div>\n" +
    "                        <div class=\"progress-val\">\n" +
    "                            {{$ctrl.performanceData[$ctrl.currentSubjectId].overall.progress}}%\n" +
    "                            <div class=\"progress-perfect\" ng-class=\"{'bad-score': $ctrl.subjectsDelta<0}\"\n" +
    "                                 ng-if=\"$ctrl.subjectsDelta != 0\">\n" +
    "                                <span ng-if=\"$ctrl.subjectsDelta > 0\">+</span>\n" +
    "                                {{$ctrl.subjectsDelta | number : 0}}\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"category-level-wrap\">\n" +
    "                    <div class=\"category-level\" ng-repeat=\"(key, generalCategory) in $ctrl.generalCategories\">\n" +
    "\n" +
    "                        <div class=\"category-data\">\n" +
    "                            <div class=\"category-level-name\">{{generalCategory.name}}</div>\n" +
    "                            <div znk-progress-bar progress-width=\"{{generalCategory.progress}}\"\n" +
    "                                 progress-value=\"{{generalCategory.progress}}\" show-progress-value=\"false\"></div>\n" +
    "                            <div class=\"level\">{{generalCategory.mastery}}</div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/directives/socialSharing/socialSharing.template.html",
    "<div class=\"social-sharing-drv-container\"\n" +
    "     ng-class=\"[vm.showSocialArea.background, vm.animate ? 'social-sharing-drv-container-animate' : '']\"\n" +
    "     ng-if=\"vm.showSocialArea\"\n" +
    "     translate-namespace=\"SOCIAL_SHARING_CONTAINER_DRV\">\n" +
    "    <div class=\"decor\" ng-class=\"vm.showSocialArea.banner1\"></div>\n" +
    "    <div class=\"share-main-container\" ng-switch on=\"vm.showSocialArea.isImproved\">\n" +
    "        <div class=\"social-sharing-title\" translate=\".TITLE\"></div>\n" +
    "        <div class=\"social-text\"\n" +
    "             translate=\".POINTS_TEXT\"\n" +
    "             ng-switch-when=\"false\"\n" +
    "             translate-values=\"{ pts: {{vm.showSocialArea.realPoints}}, subjectName: '{{vm.subjectName}}' }\">\n" +
    "        </div>\n" +
    "        <div class=\"social-text\"\n" +
    "             translate=\".IMPROVED_TEXT\"\n" +
    "             ng-switch-when=\"true\"\n" +
    "             translate-values=\"{ pts: {{vm.showSocialArea.realPoints}}, subjectName: '{{vm.subjectName}}' }\">\n" +
    "        </div>\n" +
    "        <social-share-btn-drv share-data=\"vm.shareData\"></social-share-btn-drv>\n" +
    "    </div>\n" +
    "    <div class=\"decor\" ng-class=\"vm.showSocialArea.banner2\"></div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/svg/correct-icon.svg",
    "<svg version=\"1.1\"\n" +
    "     class=\"correct-icon-svg\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 188.5 129\">\n" +
    "<style type=\"text/css\">\n" +
    "	.correct-icon-svg .st0 {\n" +
    "        fill: none;\n" +
    "        stroke: #231F20;\n" +
    "        stroke-width: 15;\n" +
    "        stroke-linecap: round;\n" +
    "        stroke-linejoin: round;\n" +
    "        stroke-miterlimit: 10;\n" +
    "    }\n" +
    "    .correct-icon-svg {\n" +
    "        width: 100%;\n" +
    "        height: auto;\n" +
    "    }\n" +
    "</style>\n" +
    "<g>\n" +
    "	<line class=\"st0\" x1=\"7.5\" y1=\"62\" x2=\"67\" y2=\"121.5\"/>\n" +
    "	<line class=\"st0\" x1=\"67\" y1=\"121.5\" x2=\"181\" y2=\"7.5\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/svg/wrong-icon.svg",
    "<svg version=\"1.1\"\n" +
    "     class=\"wrong-icon-svg\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 126.5 126.5\"\n" +
    "     style=\"enable-background:new 0 0 126.5 126.5;\"\n" +
    "     xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	.wrong-icon-svg .st0 {\n" +
    "        fill: none;\n" +
    "        stroke: #231F20;\n" +
    "        stroke-width: 15;\n" +
    "        stroke-linecap: round;\n" +
    "        stroke-linejoin: round;\n" +
    "        stroke-miterlimit: 10;\n" +
    "    }\n" +
    "</style>\n" +
    "<g>\n" +
    "	<line class=\"st0\" x1=\"119\" y1=\"7.5\" x2=\"7.5\" y2=\"119\"/>\n" +
    "	<line class=\"st0\" x1=\"7.5\" y1=\"7.5\" x2=\"119\" y2=\"119\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/article.template.html",
    "<div class=\"article-line-numbers\"></div>\n" +
    "    <div class=\"article-content\"></div>\n" +
    "\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/customAnswerBuilderAct.template.html",
    "<div class=\"instructions-title-wrapper\" ng-if=\"d.showFreeTextInstructions\" translate-namespace=\"CUSTOM_ANSWER_BUILDER_ACT\">\n" +
    "    <div class=\"instructions-title\">\n" +
    "        <span translate=\".FREE_TEXT_INSTRUCTIONS\"></span>\n" +
    "        <div class=\"svg-wrapper\">\n" +
    "            <svg-icon name=\"info-icon\"></svg-icon>\n" +
    "            <md-tooltip md-direction=\"top\" class=\"free-text-instructions-tooltip\">\n" +
    "                <span translate=\".FREE_TEXT_INSTRUCTIONS_TOOLTIP\"></span>\n" +
    "                <div class=\"arrow-down\"></div>\n" +
    "            </md-tooltip>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"note-title\" translate=\".FREE_TEXT_NOTICE\"></div>\n" +
    "</div>\n" +
    "<answer-builder> </answer-builder>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/englishFullParagraphs.template.html",
    "<div class=\"question-wrapper english-full-paragraphs-wrapper question-basic-style\">\n" +
    "\n" +
    "    <div class=\"question-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"question\">\n" +
    "        <div class=\"paragraph-title\"></div>\n" +
    "\n" +
    "        <div class=\"paragraphs-wrapper\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"answer\">\n" +
    "        <div class=\"question-content\"></div>\n" +
    "        <answer-builder></answer-builder>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/englishSpecificParagraph.template.html",
    "<div class=\"question-wrapper english-specific-paragraph-wrapper question-basic-style\"  translate-namespace=\"ENGLISH_SPECIFIC_PARAGRAPH\">\n" +
    "\n" +
    "    <div class=\"specific-paragraph-view-wrapper\" ng-show=\"vm.view === vm.SPECIFIC_PARAGRAPH\">\n" +
    "        <div class=\"question-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"question\">\n" +
    "            <div class=\"full-passage-link\" ng-bind-html=\"vm.question.groupData.name\" ng-click=\"vm.view = vm.FULL_PASSAGE\"></div>\n" +
    "            <div class=\"paragraph-title\"></div>\n" +
    "            <div class=\"paragraph\"></div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"answer-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"answer\">\n" +
    "            <div class=\"question-content\"></div>\n" +
    "            <answer-builder></answer-builder>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"full-passage-view-wrapper znk-scrollbar\" ng-show=\"vm.view === vm.FULL_PASSAGE\">\n" +
    "\n" +
    "        <div class=\"passage-title\">\n" +
    "            <div ng-bind-html=\"vm.question.groupData.name\"></div>\n" +
    "            <div class=\"back-to-question-link\" ng-click=\"vm.view = vm.SPECIFIC_PARAGRAPH\">\n" +
    "                <i class=\"material-icons chevron-left\">chevron_left</i>\n" +
    "                <div class=\"back-to-question\" translate=\".BACK_TO_QUESTION\"></div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"full-passage\" ng-repeat=\"paragraph in ::vm.question.groupData.paragraphs\">\n" +
    "            <div class=\"paragraph-number-title\">[{{::$index + 1}}]</div>\n" +
    "            <div article content=\"::paragraph.body\"  markup-field=\"body\" delete-under-scores=\"true\"></div>\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/essayQuestion.template.html",
    "<div class=\"question-wrapper writing-question-wrapper question-basic-style\">\n" +
    "\n" +
    "    <div class=\"question-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"question\"></div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"answer\">\n" +
    "        <div class=\"question-content\"></div>\n" +
    "        <answer-builder></answer-builder>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/freeTextAnswer.template.html",
    "<div class=\"free-text-answer-wrapper\"\n" +
    "     ng-switch=\"showCorrectAnswer\"\n" +
    "     translate-namespace=\"FREE_TEXT_ANSWER\">\n" +
    "\n" +
    "    <div ng-switch-when=\"true\" class=\"answer-status-wrapper\" ng-class=\"userAnswerStatus\">\n" +
    "        <div class=\"answer-status\">\n" +
    "            <div class=\"user-answer\">{{d.userAnswer}}</div>\n" +
    "            <svg-icon class=\"correct-icon\" name=\"complete-exercise-correct-icon\"></svg-icon>\n" +
    "            <svg-icon class=\"wrong-icon\" name=\"complete-exercise-wrong-icon\"></svg-icon>\n" +
    "        </div>\n" +
    "        <div class=\"correct-answer\">\n" +
    "            <span translate=\".CORRECT_ANSWER\"></span>\n" +
    "            <span>{{correctAnswer}}</span>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div  ng-switch-when=\"false\" class=\"input-wrapper\">\n" +
    "        <input ng-model-options=\"{ getterSetter: true }\" ng-model=\"d.userAnswerGetterSetter\">\n" +
    "        <div class=\"arrow-wrapper\" ng-click=\"clickHandler()\">\n" +
    "            <svg-icon name=\"arrow-icon\"></svg-icon>\n" +
    "            <div class=\"svg-back\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/lectureQuestion.template.html",
    "<div class=\"lecture-question-wrapper\" ng-switch=\"vm.question.typeId\" znk-exercise-draw-container canvas-name=\"lecture\">\n" +
    "    <div class=\"img-wrapper\" ng-switch-when=\"1\">\n" +
    "        <img  ng-src=\"{{vm.question.fileUrl}}\">\n" +
    "    </div>\n" +
    "    <!--<div ng-switch-when=\"1\"> wait for the second type</div> -->\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/mathQuestion.template.html",
    "<div class=\"math-question-wrapper\" image-zoomer>\n" +
    "\n" +
    "    <div class=\"question-container\" znk-exercise-draw-container canvas-name=\"question\"></div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"answer\">\n" +
    "        <div class=\"answer-content\"></div>\n" +
    "        <custom-answer-builder-act></custom-answer-builder-act>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/rateAnswer.template.html",
    "<div class=\"rate-answer-wrapper\">\n" +
    "    <div class=\"checkbox-items-wrapper\" >\n" +
    "        <div class=\"item-repeater\" ng-repeat=\"item in d.itemsArray track by $index\">\n" +
    "            <svg-icon class=\"correct-icon\" name=\"correct-icon\"></svg-icon>\n" +
    "            <svg-icon class=\"wrong-icon\" name=\"complete-exercise-wrong-icon\"></svg-icon>\n" +
    "            <div class=\"checkbox-item\" ng-click=\"clickHandler($index)\">\n" +
    "                <div class=\"item-index\">{{$index +  2}}</div>\n" +
    "            </div>\n" +
    "            <div class=\"correct-answer-line\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/readingQuestion.template.html",
    "<div class=\"question-wrapper reading-question-wrapper question-basic-style\" image-zoomer>\n" +
    "\n" +
    "    <div class=\"question-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"question\">\n" +
    "        <div class=\"passage-title\">{{::vm.passageTitle}}</div>\n" +
    "        <div class=\"article\">\n" +
    "            <div class=\"article-content\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"answer\">\n" +
    "        <div class=\"question-content\"></div>\n" +
    "        <answer-builder></answer-builder>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/scienceQuestion.template.html",
    "<div class=\"question-wrapper science-question-wrapper question-basic-style\" image-zoomer>\n" +
    "\n" +
    "    <div class=\"question-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"question\">\n" +
    "        <div class=\"paragraph-title\"></div>\n" +
    "\n" +
    "        <div class=\"paragraphs-wrapper\"></div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"answer\">\n" +
    "        <div class=\"question-content\"></div>\n" +
    "        <answer-builder></answer-builder>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/selectAnswer.template.html",
    "<div ng-repeat=\"answer in ::d.answers track by answer.id\"\n" +
    "     class=\"answer\"\n" +
    "     ng-click=\"d.click(answer)\"\n" +
    "     tabindex=\"-1\">\n" +
    "    <div class=\"content-wrapper\">\n" +
    "        <div class=\"answer-index-wrapper\">\n" +
    "            <span class=\"index-char\">{{::d.getIndexChar($index)}}</span>\n" +
    "        </div>\n" +
    "        <markup content=\"answer.content\" type=\"md\" class=\"content\"></markup>\n" +
    "        <svg-icon class=\"correct-icon-drv\" name=\"complete-exercise-correct-icon\"></svg-icon>\n" +
    "        <svg-icon class=\"wrong-icon-drv\" name=\"complete-exercise-wrong-icon\"></svg-icon>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/simpleQuestion.template.html",
    "<div class=\"question-wrapper simple-question-wrapper question-basic-style\" image-zoomer>\n" +
    "\n" +
    "        <div class=\"answer-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"answer\">\n" +
    "            <div class=\"question-content\"></div>\n" +
    "            <custom-answer-builder-act></custom-answer-builder-act>\n" +
    "        </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/writingFullPassage.template.html",
    "<div class=\"question-wrapper english-full-paragraphs-wrapper question-basic-style\" image-zoomer>\n" +
    "\n" +
    "    <div class=\"question-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"question\">\n" +
    "        <div class=\"paragraph-title\"></div>\n" +
    "\n" +
    "        <div class=\"paragraphs-wrapper\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"answer\">\n" +
    "        <div class=\"question-content\"></div>\n" +
    "        <answer-builder></answer-builder>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/writingQuestion.template.html",
    "<div class=\"question-wrapper writing-question-wrapper question-basic-style\">\n" +
    "\n" +
    "    <div class=\"question-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"question\"></div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"answer\">\n" +
    "        <div class=\"question-content\"></div>\n" +
    "        <answer-builder></answer-builder>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/writingSpecificParagraph.template.html",
    "<div class=\"question-wrapper writing-specific-paragraph-wrapper question-basic-style\" translate-namespace=\"WRITING_SPECIFIC_PARAGRAPH\">\n" +
    "\n" +
    "    <div class=\"specific-paragraph-view-wrapper\" ng-show=\"vm.view === vm.SPECIFIC_PARAGRAPH\" image-zoomer>\n" +
    "        <div class=\"question-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"question\">\n" +
    "            <div class=\"full-passage-link\" ng-bind-html=\"vm.question.groupData.name\" ng-click=\"vm.view = vm.FULL_PASSAGE\"></div>\n" +
    "            <div class=\"paragraph-title\"></div>\n" +
    "            <div class=\"paragraph\"></div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"answer-container znk-scrollbar\" znk-exercise-draw-container canvas-name=\"answer\">\n" +
    "            <div class=\"question-content\"></div>\n" +
    "            <answer-builder></answer-builder>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"full-passage-view-wrapper \" ng-show=\"vm.view === vm.FULL_PASSAGE\" image-zoomer>\n" +
    "\n" +
    "        <div class=\"passage-title\">\n" +
    "            <div ng-bind-html=\"vm.question.groupData.name\"></div>\n" +
    "            <div class=\"back-to-question-link\" ng-click=\"vm.view = vm.SPECIFIC_PARAGRAPH\">\n" +
    "                <i class=\"material-icons chevron-left\">chevron_left</i>\n" +
    "                <div class=\"back-to-question\" translate=\".BACK_TO_QUESTION\"></div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"full-passage-wrapper znk-scrollbar\">\n" +
    "            <div class=\"full-passage\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.configAct', []);
})(angular);

(function () {
    'use strict';

    angular.module('znk.infra-act.configAct')
        .decorator('CategoryService', ["$delegate", "SubjectEnum", function ($delegate, SubjectEnum) {
            'ngInject';

            $delegate.getAllSubscores = function () {
                return $delegate.getCategoryMap().then(function (categories) {
                    var subScoreObj = {};
                    for (var prop in categories) {
                        if (_isSubScore(categories[prop].parentId)) {
                            subScoreObj[categories[prop].id] = categories[prop];
                        }
                    }
                    return subScoreObj;
                });
            };

            function _isSubScore(id) {
                return SubjectEnum.MATH.enum === id || SubjectEnum.READING.enum === id ||
                    SubjectEnum.WRITING.enum === id || SubjectEnum.ENGLISH.enum === id ||
                    SubjectEnum.SCIENCE.enum === id;
            }

            return $delegate;
        }]);
})();

(function () {
    'use strict';

    angular.module('znk.infra-act.configAct')
        .decorator('EstimatedScoreSrv', ["$delegate", "ScoringService", "SubjectEnum", function ($delegate, ScoringService, SubjectEnum) {
            'ngInject';

            var decoratedEstimatedScoreSrv = $delegate;

            decoratedEstimatedScoreSrv.getCompositeScore = function () {
                return $delegate.getLatestEstimatedScore().then(function (estimatedScores) {
                    var scoresArr = [];
                    angular.forEach(estimatedScores, function (estimatesScoreForSubject, subjectId) {
                        if (+subjectId !== SubjectEnum.WRITING.enum) {
                            scoresArr.push(estimatesScoreForSubject.score || 0);
                        }
                    });
                    return ScoringService.getScoreCompositeResult(scoresArr);
                });
            };

            return decoratedEstimatedScoreSrv;
        }]);
})();

(function () {
    'use strict';

    angular.module('znk.infra-act.configAct')
        .decorator('SubjectEnum', ["$delegate", function ($delegate) {
            'ngInject';

            var relevantSubjects = ['ENGLISH', 'MATH', 'READING', 'SCIENCE', 'WRITING'];
            angular.forEach($delegate, function (value, key) {
                if (relevantSubjects.indexOf(key) === -1) {
                    delete $delegate[key];
                }
            });
            return $delegate;
        }]);
})();

angular.module('znk.infra-act.configAct').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.examUtility',[]);
})(angular);

(function () {
    'use strict';

    angular.module('znk.infra-act.examUtility')
        .service('ScoringService',["$q", "SubjectEnum", "StorageRevSrv", "$log", function ($q, SubjectEnum, StorageRevSrv, $log) {
            'ngInject';

            var subScoreTestIdArr = {
                261: 'mechanics',
                262: 'rhetoricalSkills',
                263: 'interAlg',
                264: 'preAlg',
                265: 'planeGeom',
                266: 'arts',
                267: 'socStudies'
            };
            var ExamTypeEnum = {
                0: 'test',
                1: 'miniTest'
            };
            var subScoreMap;
            var scoreTable = {};

            function initialScoreObj() {
                return {
                    scoreSection: 0,
                    sumAnswerCorrect: 0,
                    scoreSubTotal: 0,
                    subScoresArr: []
                };
            }
            //   convert each subjectId to it's name as it's written in the scoreTable file
            function convertIdToName(subjectId) {
                var nameForScoreTable;
                switch (subjectId) {
                    case SubjectEnum.ENGLISH.enum: // 5
                        nameForScoreTable = SubjectEnum.ENGLISH.val;
                        break;
                    case SubjectEnum.READING.enum:
                        nameForScoreTable = SubjectEnum.READING.val;
                        break;
                    case SubjectEnum.WRITING.enum:
                        nameForScoreTable = SubjectEnum.WRITING.val;
                        break;
                    case SubjectEnum.SCIENCE.enum:
                        nameForScoreTable = SubjectEnum.SCIENCE.val;
                        break;
                    default: // case SubjectEnum.MATH.enum:
                        nameForScoreTable = SubjectEnum.MATH.val;
                        break;
                }
                return nameForScoreTable;
            }
            // calculate the sum of the score and adjust it according to the scoreTable file.
            function sumScores(resultsObj, computeSubScore, scoreObj) {
                var scoreSumTemp;
                angular.forEach(resultsObj.questions, function (value, key) {
                    scoreSumTemp = 0;
                    var isSubScoreWithIdExist = false;
                    if (resultsObj.answers[key].isAnswerCorrectly && !resultsObj.answers[key].afterAllowedTime) {
                        scoreObj.sumAnswerCorrect += 1;
                        scoreSumTemp = 1;
                    }
                    var curSubId = resultsObj.subjectId;
                    if (computeSubScore === true && curSubId !== SubjectEnum.SCIENCE.enum && curSubId !== SubjectEnum.WRITING.enum) {
                        var subScoresElm = Object.keys(scoreObj.subScoresArr);
                        if (subScoreMap.hasOwnProperty(value.categoryId)) { // for the sub score
                            var categoryIdCur = subScoreMap[value.categoryId];
                            for (var i = 0; i < subScoresElm.length; i++) {
                                var subScoreItemValue = scoreObj.subScoresArr[subScoresElm[i]];
                                if (subScoreItemValue.categoryId === categoryIdCur) {
                                    // if the category exist in the scoreObj subScoresArr array then
                                    // increase the amount
                                    if (resultsObj.answers[key].isAnswerCorrectly && !resultsObj.answers[key].afterAllowedTime) {
                                        subScoreItemValue.scoreSum++;
                                    }
                                    isSubScoreWithIdExist = true;
                                    break;
                                }
                            }
                            if (isSubScoreWithIdExist === false) {
                                scoreObj.subScoresArr.push({
                                    categoryId: categoryIdCur,
                                    scoreSum: scoreSumTemp,
                                    subjectId: resultsObj.subjectId
                                });
                            }
                        }
                    }
                });
                return scoreObj;
            }

            function getScoreTable() {
                return StorageRevSrv.getContent({
                    exerciseType: 'scoretable'
                });
            }

            // return the score section result
            this.getScoreSectionResult = function (resultsObj) {
                return getScoreTable().then(function (data) {
                    scoreTable = data;

                    var scoreObj = initialScoreObj();
                    scoreObj = sumScores(resultsObj, false, scoreObj);
                    var shortNameCtg = (convertIdToName(resultsObj.subjectId));
                    var curSubId = resultsObj.subjectId;
                    var curAns = scoreObj.sumAnswerCorrect;
                    var curType = ExamTypeEnum[resultsObj.typeId];
                    scoreObj.scoreSection = scoreTable[shortNameCtg][curType][curAns];
                    if (curSubId === SubjectEnum.WRITING.enum) {
                        scoreObj.scoreSection *= 3;
                    }
                    return scoreObj;
                }, function (reason) {
                    return reason;
                });
            };
            // return the sub score results
            this.getSubScoreResult = function (resultsObj) {
                var proms = [getScoreTable(),
                    StorageRevSrv.getContent({
                        exerciseType: 'sub_score_map'
                    })
                ];
                return $q.all(proms).then(function (resultsProm) {
                    scoreTable = resultsProm[0];
                    subScoreMap = resultsProm[1];
                    var scoreObj = initialScoreObj();
                    scoreObj = sumScores(resultsObj, true, scoreObj);

                    angular.forEach(scoreObj.subScoresArr, function (value) {
                        var subScoreName = subScoreTestIdArr[value.categoryId];
                        var shortNameCtg = (convertIdToName(resultsObj.subjectId));
                        var curAns = scoreObj.sumAnswerCorrect;
                        if (angular.isDefined(scoreTable[shortNameCtg][subScoreName])) {
                            value.scoreSum = scoreTable[shortNameCtg][subScoreName][curAns];

                            scoreObj.scoreSubTotal += value.scoreSum;
                        }
                    });
                    return scoreObj;
                });
            };

            this.getScoreCompositeResult = function (scoreResultsArr) {
                var sumScoreResultsArr = 0,
                    i;
                var scoreObj = initialScoreObj();
                for (i = 0; i < scoreResultsArr.length; i++) {
                    sumScoreResultsArr += scoreResultsArr[i];
                }
                scoreObj.compositeScoreResults = Math.round((sumScoreResultsArr / i));
                return $q.when(scoreObj);
            };

            this.rawScoreToScore = function (subjectId, rawScore) {
                return getScoreTable().then(function (scoreTableData) {
                    if (angular.isUndefined(subjectId)) {
                        $log.error('scoringSrv:rawScoreToScore: subject id was not provided');
                    }
                    if (angular.isUndefined(rawScore)) {
                        $log.error('scoringSrv:rawScoreToScore: raw score was not provided');
                    }

                    var subjectName = convertIdToName(subjectId);
                    var roundedRawScore = Math.round(rawScore);
                    var FULL_TEST_TYPE = ExamTypeEnum[0];
                    var scoreForRawScore = scoreTableData &&
                        scoreTableData[subjectName] &&
                        scoreTableData[subjectName][FULL_TEST_TYPE] &&
                        scoreTableData[subjectName][FULL_TEST_TYPE][roundedRawScore];

                    if (angular.isUndefined(scoreForRawScore)) {
                        $log.error('scoringSrv:rawScoreToScore: raw score was not found');
                        return 0;
                    }

                    var isWritingSubject = subjectId === SubjectEnum.WRITING.enum;
                    return isWritingSubject ? scoreForRawScore * 3 : scoreForRawScore;
                });
            };
        }]);
})();

angular.module('znk.infra-act.examUtility').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.exerciseUtilityAct', []);
})(angular);

(function(angular){
    'use strict';

    angular.module('znk.infra-act.exerciseUtilityAct')
        .service('TestScoreCategoryEnum',["EnumSrv", function(EnumSrv) {
            'ngInject';

            var testScoreCategoryEnum = new EnumSrv.BaseEnum([
                ['MATH', 9, 'math'],
                ['READING', 10, 'reading'],
                ['WRITING', 11, 'writing'],
                ['ESSAY', 12, 'essay']
            ]);
            return testScoreCategoryEnum;
        }]);
})(angular);

angular.module('znk.infra-act.exerciseUtilityAct').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.performance', [
        'znk.infra-act.userGoals',
        'znk.infra.znkTimeline',
        'znk.infra.znkProgressBar'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.performance')
        .config(["TimelineSrvProvider", "SubjectEnumConst", function timelineConfig(TimelineSrvProvider, SubjectEnumConst) {
            'ngInject';
            var keys = {};

            keys[SubjectEnumConst.MATH] = '#75CBE8';
            keys[SubjectEnumConst.READING] = '#F9D41B';
            keys[SubjectEnumConst.WRITING] = '#FF5895';
            keys[SubjectEnumConst.ENGLISH] = '#AF89D2';
            keys[SubjectEnumConst.SCIENCE] = '#51CDBA';

            TimelineSrvProvider.setColors(keys);
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.performance')
        .controller('PerformanceTimelineController',
            ["EstimatedScoreSrv", "UserGoalsService", "SubjectEnum", "$q", "$attrs", "$element", "ExerciseTypeEnum", function (EstimatedScoreSrv, UserGoalsService, SubjectEnum, $q, $attrs, $element, ExerciseTypeEnum) {
                'ngInject';

                var vm = this;
                var estimatedScoresDataProm = EstimatedScoreSrv.getEstimatedScores();
                var getGoalsProm = UserGoalsService.getGoals();
                var inProgressProm = false;
                var subjectEnumToValMap = SubjectEnum.getEnumMap();
                var currentSubjectId;

                // options
                var optionsPerDevice = {
                    width: 705,
                    height: 150,
                    distance: 90,
                    upOrDown: 100,
                    yUp: 30,
                    yDown: 100
                };

                var subjectIdToIndexMap = {
                    diagnostic: 'diagnostic'
                };
                subjectIdToIndexMap[ExerciseTypeEnum.TUTORIAL.enum] = 'tutorial';
                subjectIdToIndexMap[ExerciseTypeEnum.GAME.enum] = 'game';
                subjectIdToIndexMap[ExerciseTypeEnum.PRACTICE.enum] = 'practice';
                subjectIdToIndexMap[ExerciseTypeEnum.SECTION.enum] = 'section';

                function _getSummaryData(summeryScore) {
                    var x = summeryScore.lineTo.x;
                    var y = (summeryScore.lineTo.y < optionsPerDevice.upOrDown) ? summeryScore.lineTo.y + optionsPerDevice.yDown : summeryScore.lineTo.y - optionsPerDevice.yUp;
                    var angleDeg;
                    if (summeryScore.next) {
                        angleDeg = Math.atan2(summeryScore.lineTo.y - summeryScore.next.y, summeryScore.lineTo.x - summeryScore.next.x) * 180 / Math.PI;
                    }

                    if (angleDeg && angleDeg < -optionsPerDevice.upOrDown && summeryScore.lineTo.y < optionsPerDevice.upOrDown) {
                        x -= 30;
                    }

                    return {
                        x: x,
                        y: y,
                        score: summeryScore.score,
                        prevScore: summeryScore.prev.score
                    };
                }

                function _getRegularData(lastLineObj) {
                    var lastLine = lastLineObj[lastLineObj.length - 1];
                    var beforeLast = lastLineObj[lastLineObj.length - 2];
                    var x = lastLine.lineTo.x - 13;
                    var y = (lastLine.lineTo.y < optionsPerDevice.upOrDown) ? lastLine.lineTo.y + optionsPerDevice.yDown : lastLine.lineTo.y - optionsPerDevice.yUp;
                    var angleDeg = Math.atan2(lastLine.lineTo.y - beforeLast.lineTo.y, lastLine.lineTo.x - beforeLast.lineTo.x) * 180 / Math.PI;

                    if (angleDeg < -40 || angleDeg > 40) {
                        x += 20;
                    }

                    return {
                        x: x,
                        y: y,
                        score: lastLine.score,
                        prevScore: beforeLast.score
                    };
                }

                function _scrolling() {
                    var domElement = $element.children()[0];
                    if (domElement.scrollWidth > domElement.clientWidth) {
                        domElement.scrollLeft += domElement.scrollWidth - domElement.clientWidth;
                    }
                }

                function _getPromsOrValue() {
                    if (!inProgressProm) {
                        inProgressProm = $q.all([estimatedScoresDataProm, getGoalsProm]);
                    }
                    return (angular.isFunction(inProgressProm)) ? inProgressProm : $q.when(inProgressProm);
                }

                vm.options = {
                    colorId: vm.currentSubjectId,
                    isMobile: false,
                    width: optionsPerDevice.width,
                    height: optionsPerDevice.height,
                    isSummery: (vm.activeExerciseId) ? vm.activeExerciseId : false,
                    type: 'multi',
                    isMax: true,
                    max: 29,
                    min: 0,
                    subPoint: 35,
                    distance: optionsPerDevice.distance,
                    lineWidth: 2,
                    numbers: {
                        font: '200 12px Lato',
                        fillStyle: '#4a4a4a'
                    },
                    onFinish: function (obj) {
                        var summeryScore = obj.data.summeryScore;
                        var scoreData;

                        if (summeryScore) {
                            scoreData = _getSummaryData(summeryScore);
                        } else {
                            scoreData = _getRegularData(obj.data.lastLine);
                        }

                        vm.timelineMinMaxStyle = {'top': scoreData.y + 'px', 'left': scoreData.x + 'px'};

                        _getPromsOrValue().then(function (results) {
                            var userGoals = results[1];
                            var points = userGoals[subjectEnumToValMap[currentSubjectId]] - scoreData.score;
                            vm.goalPerSubject = scoreData.score;
                            vm.points = (points > 0) ? points : false;
                        });

                        if (scoreData.score && scoreData.prevScore) {
                            if (scoreData.score > scoreData.prevScore) {
                                vm.timelineLinePlus = '+' + (scoreData.score - scoreData.prevScore);
                                vm.isRed = false;
                            } else if (scoreData.score < scoreData.prevScore) {
                                vm.timelineLinePlus = '-' + (scoreData.prevScore - scoreData.score);
                                vm.isRed = true;
                            }
                            vm.onTimelineFinish({subjectDelta: vm.timelineLinePlus});
                        }

                        _scrolling();
                    }
                };

                function addIconKey(dataPerSubject) {
                    var newDataArr = [];
                    angular.forEach(dataPerSubject, function (value, index) {
                        var type = subjectIdToIndexMap[value.exerciseType];
                        if (index === 0 && type === 'section') {
                            type = 'diagnostic';
                        }
                        value.iconKey = type || false;
                        newDataArr.push(value);
                    });
                    return newDataArr;
                }

                $attrs.$observe('subjectId', function (newVal, oldVal) {
                    if (newVal === oldVal) {
                        return;
                    }
                    currentSubjectId = newVal;
                    _getPromsOrValue().then(function (results) {
                        inProgressProm = results;
                        var estimatedScoresData = results[0];
                        vm.animation = true;
                        vm.timelineLinePlus = false;
                        vm.timeLineData = {
                            data: addIconKey(estimatedScoresData[currentSubjectId]),
                            id: currentSubjectId
                        };
                        vm.points = 0;
                    });
                });
            }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.performance')
        .directive('performanceTimeline', function performanceTimelineDrv() {
                var directive = {
                    scope: {
                        onTimelineFinish: '&',
                        activeExerciseId: '=?',
                        showInduction: '<?'
                    },
                    restrict: 'E',
                    templateUrl: 'components/performance/directives/performanceTimeline/performanceTimeline.template.html',
                    controller: 'PerformanceTimelineController',
                    bindToController: true,
                    controllerAs: 'vm'
                };
                return directive;
            }
        );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.performance')
        .service('masteryLevel', ["$filter", function ($filter) {
            'ngInject';

            var translateFilter = $filter('translate');

            this.getMasteryLevel = function (levelProgress) {
                var masteryLevel = '';
                if (levelProgress < 30) {
                    masteryLevel = 'NOVICE';
                } else if (levelProgress >= 30 && levelProgress < 55) {
                    masteryLevel = 'AVERAGE';
                } else if (levelProgress >= 55 && levelProgress < 75) {
                    masteryLevel = 'ADVANCE';
                } else if (levelProgress >= 75 && levelProgress < 95) {
                    masteryLevel = 'EXPERT';
                } else if (levelProgress >= 95 && levelProgress <= 100) {
                    masteryLevel = 'MASTER';
                }
                return translateFilter('PERFORMANCE_ACT.MASTERY_LEVEL.' + masteryLevel);
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.performance')
        .service('PerformanceData', ["StatsSrv", "StatsQuerySrv", "CategoryService", "$q", function (StatsSrv, StatsQuerySrv, CategoryService, $q) {
            'ngInject';

            var SUBJECTS = 'level1Categories';
            var SUBSCORS = 'level2Categories';
            var GENERAL_CATEGORYS = 'level3Categories';
            var SPECIFIC_CATEGORYS = 'level4Categories';
            var GENERAL_CATEGORY_LEVEL = 3;
            var SPECIFIC_CATEGORY_LEVEL = 4;
            var performanceData = {};

            var promArray = [
                StatsSrv.getStats(),
                CategoryService.getAllSubscores(),
                CategoryService.getAllLevelCategories(SPECIFIC_CATEGORY_LEVEL)];
            this.getPerformanceData = function () {
                performanceData = {};
                return $q.all(promArray).then(function (results) {
                    var stats = results[0];
                    var allSubScores = results[1];
                    var allSpecificCategories = angular.copy(results[2]);
                    if (angular.isDefined(stats[SUBJECTS]) && angular.isDefined(stats[SUBSCORS]) && angular.isDefined(stats[GENERAL_CATEGORYS])) {
                        _buildSubjects(stats[SUBJECTS]);
                        _buildSubScores(stats[SUBSCORS], allSubScores);
                        _buildGeneralCategories(stats[GENERAL_CATEGORYS]);
                        _calcSpecificCategory(performanceData, allSpecificCategories, stats[SPECIFIC_CATEGORYS]);
                    }
                    return performanceData;
                });
            };

            function _calcSpecificCategory(_performanceData, allSpecificCategories, specificStats) {
                angular.forEach(specificStats, function (specificCategoryStats, categoryId) {
                    categoryId = categoryId.replace('id_', '');
                    var categoryParent = specificCategoryStats.parentsIds;
                    var subjectPerformance = _performanceData[categoryParent[categoryParent.length - 1]];
                    if (subjectPerformance) {
                        angular.forEach(subjectPerformance.subScoreArray, function (subscoreObj) {
                            angular.forEach(subscoreObj.categoryArray, function (generalCategoryObj) {
                                if (generalCategoryObj.id === categoryParent[0]) {
                                    if (!generalCategoryObj.specificArray) {
                                        generalCategoryObj.specificArray = [];
                                    }

                                    generalCategoryObj.specificArray.push({
                                        id: categoryId,
                                        name: allSpecificCategories[categoryId].name,
                                        levelProgress: _getProgressPercentage(specificCategoryStats.totalQuestions, specificCategoryStats.correct),
                                        correct: specificCategoryStats.correct,
                                        wrong: specificCategoryStats.wrong,
                                        totalQuestions: specificCategoryStats.totalQuestions
                                    });
                                }
                            });
                        });
                    }
                });
            }

            function _buildSubjects(subjectsObj) {
                var subjectsKeys = Object.keys(subjectsObj);

                angular.forEach(subjectsKeys, function (subjectkey) {
                    var subjectData = {};

                    subjectData.subScoreArray = [];
                    performanceData[subjectsObj[subjectkey].id] = subjectData;
                    subjectData.overall = {
                        progress: _getProgressPercentage(subjectsObj[subjectkey].totalQuestions, subjectsObj[subjectkey].correct),
                        avgTime: _getAvgTime(subjectsObj[subjectkey].totalQuestions, subjectsObj[subjectkey].totalTime)
                    };
                    StatsQuerySrv.getWeakestCategoryInLevel(GENERAL_CATEGORY_LEVEL, null, subjectsObj[subjectkey].id).then(function (weakestCategory) {
                        if (angular.isDefined(weakestCategory) && angular.isDefined(weakestCategory.totalQuestions) && angular.isDefined(weakestCategory.correct)) {
                            subjectData.weakestCategory = {
                                progress: _getProgressPercentage(weakestCategory.totalQuestions, weakestCategory.correct),
                                id: weakestCategory.id
                            };
                        }
                    });
                });
            }

            function _buildSubScores(subScoreObj, allSubScores) {
                function _addNotPracitecedSubScores(_subScoreObj, _allSubScores) {
                    var allSubScoreKeys = Object.keys(_allSubScores);
                    angular.forEach(allSubScoreKeys, function (subScore) {
                        var subScoreId = 'id_' + allSubScores[subScore].id;      // firebase format
                        if (angular.isUndefined(_subScoreObj[subScoreId]) && angular.isDefined(performanceData[allSubScores[subScore].parentId])) {      // this sub score not practiced yet by the user
                            var notPracticedSubScore = {
                                subScoreId: allSubScores[subScore].id,
                                parentsIds: [allSubScores[subScore].parentId]
                            };
                            performanceData[allSubScores[subScore].parentId].subScoreArray.push(notPracticedSubScore);
                        }
                    });
                }

                _addNotPracitecedSubScores(subScoreObj, allSubScores);

                var subScoreKeys = Object.keys(subScoreObj);
                angular.forEach(subScoreKeys, function (subScoreKey) {
                    var subScoreData = {};

                    subScoreData.levelProgress = _getProgressPercentage(subScoreObj[subScoreKey].totalQuestions, subScoreObj[subScoreKey].correct);
                    subScoreData.avgTime = _getAvgTime(subScoreObj[subScoreKey].totalQuestions, subScoreObj[subScoreKey].totalTime);
                    subScoreData.subScoreId = subScoreObj[subScoreKey].id;
                    subScoreData.categoryArray = [];

                    var subjectId = subScoreObj[subScoreKey].parentsIds[0];
                    if (angular.isDefined(performanceData[subjectId])) {
                        performanceData[subjectId].subScoreArray.push(subScoreData);
                    }
                });
            }

            function _buildGeneralCategories(generalObj) {
                var generalCategoryKeys = Object.keys(generalObj);

                angular.forEach(generalCategoryKeys, function (generalCategoryKey) {
                    var SUBJECT_ID = generalObj[generalCategoryKey].parentsIds[1];
                    var SUB_SCORE_ID = generalObj[generalCategoryKey].parentsIds[0];
                    var generalCategoryData = {};

                    generalCategoryData.levelProgress = _getProgressPercentage(generalObj[generalCategoryKey].totalQuestions, generalObj[generalCategoryKey].correct);
                    generalCategoryData.avgTime = _getAvgTime(generalObj[generalCategoryKey].totalQuestions, generalObj[generalCategoryKey].totalTime);
                    generalCategoryData.id = generalObj[generalCategoryKey].id;
                    _setCategoryToCategoryArray(performanceData[SUBJECT_ID], SUB_SCORE_ID, generalCategoryData);   // (subject object, sub score id, general category object)
                });

                function _setCategoryToCategoryArray(subjectObj, subScoreId, generalCategory) {
                    for (var i = 0; i < subjectObj.subScoreArray.length; i++) {
                        if (angular.isDefined(subjectObj.subScoreArray[i]) && subjectObj.subScoreArray[i].subScoreId === subScoreId) {
                            subjectObj.subScoreArray[i].categoryArray.push(generalCategory);
                        }
                    }
                }
            }

            function _getProgressPercentage(totalQuestions, correctAnswers) {
                return totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
            }

            function _getAvgTime(totalQuestions, totalTime) {
                return totalQuestions > 0 ? Math.round((totalTime / 1000) / totalQuestions) : 0;
            }
        }]);
})(angular);

angular.module('znk.infra-act.performance').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/performance/directives/performanceTimeline/performanceTimeline.template.html",
    "<div class=\"performance-timeline znk-scrollbar\" translate-namespace=\"PERFORMANCE_TIMELINE\">\n" +
    "    <div class=\"time-line-wrapper\">\n" +
    "        <div class=\"progress-val\" ng-style=\"vm.timelineMinMaxStyle\" ng-if=\"vm.timeLineData.data.length\">\n" +
    "            <div class=\"goal-wrapper\">{{vm.goalPerSubject}}\n" +
    "                <div class=\"timeline-plus\"\n" +
    "                     ng-if=\"vm.timelineLinePlus && vm.showInduction\"\n" +
    "                     ng-class=\"{ 'red-point': vm.isRed, 'green-point': !vm.isRed }\">\n" +
    "                    {{vm.timelineLinePlus}}\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"progress-title\"\n" +
    "                 ng-style=\"{ visibility: (vm.points) ? 'visiable' : 'hidden' }\"\n" +
    "                 translate=\".POINTS_LEFT\"\n" +
    "                 translate-values=\"{points: {{vm.points}} }\">\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <canvas znk-timeline timeline-data=\"vm.timeLineData\" timeline-settings=\"vm.options\"></canvas>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.socialSharingAct', [
        'znk.infra-act.configAct'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.socialSharingAct')
        .config(["EstimatedScoreSrvProvider", "SubjectEnumConst", "EstimatedScoreEventsHandlerSrvProvider", "exerciseTypeConst", function estimatedScoreConfig(EstimatedScoreSrvProvider, SubjectEnumConst,
                                              EstimatedScoreEventsHandlerSrvProvider, exerciseTypeConst) {

            rawScoreToScoreFnGetter.$inject = ["ScoringService"];
            var subjectsRawScoreEdges = {};
            subjectsRawScoreEdges[SubjectEnumConst.ENGLISH] = {
                min: 0,
                max: 75
            };
            subjectsRawScoreEdges[SubjectEnumConst.MATH] = {
                min: 0,
                max: 60
            };
            subjectsRawScoreEdges[SubjectEnumConst.READING] = {
                min: 0,
                max: 40
            };
            subjectsRawScoreEdges[SubjectEnumConst.SCIENCE] = {
                min: 0,
                max: 40
            };
            subjectsRawScoreEdges[SubjectEnumConst.WRITING] = {
                min: 0,
                max: 10
            };

            EstimatedScoreSrvProvider.setSubjectsRawScoreEdges(subjectsRawScoreEdges);

            EstimatedScoreSrvProvider.setMinMaxDiagnosticScore(-Infinity, Infinity);

            function rawScoreToScoreFnGetter(ScoringService) {
                'ngInject';

                return function (subjectId, rawScore) {
                    return ScoringService.rawScoreToScore(subjectId, rawScore);
                };
            }

            EstimatedScoreSrvProvider.setRawScoreToRealScoreFn(rawScoreToScoreFnGetter);

            var diagnosticScoringMap = {
                1: [4, 4, 3, 3],
                2: [5, 5, 4, 4],
                3: [6, 6, 5, 5],
                4: [7, 7, 6, 6],
                5: [10, 10, 7, 7]
            };
            EstimatedScoreEventsHandlerSrvProvider.setDiagnosticScoring(diagnosticScoringMap);

            var defaultRawPointsForExercise = [1, 0, 0, 0];
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.SECTION, defaultRawPointsForExercise);
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.TUTORIAL, defaultRawPointsForExercise);
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.GAME, defaultRawPointsForExercise);
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.PRACTICE, defaultRawPointsForExercise);
            var drillRawPointsForExercise = [0.2, 0, 0, 0];
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.DRILL, drillRawPointsForExercise);
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.socialSharingAct')
        .config(["SocialSharingSrvProvider", function(SocialSharingSrvProvider){
            SocialSharingSrvProvider.setPoints({
                25: {
                    background: 'background-lowest',
                    banner1: 'summary-congrats-banner-600-1',
                    banner2: 'summary-congrats-banner-600-2',
                    shareUrlMap: {
                        math: 'ACT-FB-share-post-math-25.png',
                        english: 'ACT-FB-share-post-english-25.png',
                        reading: 'ACT-FB-share-post-reading-25.png',
                        science: 'ACT-FB-share-post-science-25.png',
                        writing: 'ACT-FB-share-post-writing-25.png'
                    }
                },
                28: {
                    background: 'background-middle-1',
                    banner1: 'summary-congrats-banner-650-1',
                    banner2: 'summary-congrats-banner-650-2',
                    shareUrlMap: {
                        math: 'ACT-FB-share-post-math-28.png',
                        english: 'ACT-FB-share-post-english-28.png',
                        reading: 'ACT-FB-share-post-reading-28.png',
                        science: 'ACT-FB-share-post-science-28.png',
                        writing: 'ACT-FB-share-post-writing-28.png'
                    }
                },
                30: {
                    background: 'background-middle-2',
                    banner1: 'summary-congrats-banner-700-1',
                    banner2: 'summary-congrats-banner-700-2',
                    shareUrlMap: {
                        math: 'ACT-FB-share-post-math-30.png',
                        english: 'ACT-FB-share-post-english-30.png',
                        reading: 'ACT-FB-share-post-reading-30.png',
                        science: 'ACT-FB-share-post-science-30.png',
                        writing: 'ACT-FB-share-post-writing-30.png'
                    }
                },
                33: {
                    background: 'background-highest',
                    banner1: 'summary-congrats-banner-750-1',
                    banner2: 'summary-congrats-banner-750-2',
                    shareUrlMap: {
                        math: 'ACT-FB-share-post-math-25.png',
                        english: 'ACT-FB-share-post-english-33.png',
                        reading: 'ACT-FB-share-post-reading-33.png',
                        science: 'ACT-FB-share-post-science-33.png',
                        writing: 'ACT-FB-share-post-writing-33.png'
                    }
                },
                improved: {
                    background: 'background-improved',
                    banner1: 'summary-congrats-banner-improved-1',
                    banner2: 'summary-congrats-banner-improved-2',
                    shareUrlMap: {
                        math: 'ACT-FB-share-post-math-improved.png',
                        english: 'ACT-FB-share-post-english-improved.png',
                        reading: 'ACT-FB-share-post-reading-improved.png',
                        science: 'ACT-FB-share-post-science-improved.png',
                        writing: 'ACT-FB-share-post-writing-improved.png'
                    }
                }
            });
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.socialSharingAct')
        .provider('SocialSharingSrv', function () {
            var _pointsConfig;

            this.setPoints = function (pointsConfig) {
                _pointsConfig = pointsConfig;
            };

            this.$get = ["EstimatedScoreSrv", "$log", "$q", function (EstimatedScoreSrv, $log, $q) {
                'ngInject';

                var socialSharingSrvObj = {};

                function _getBiggestScore(currentScore) {
                    var biggestScore = 0;
                    angular.forEach(currentScore, function (val) {
                        if (val.score > biggestScore) {
                            biggestScore = val.score;
                        }
                    });
                    return biggestScore;
                }

                function _getConfigRange(config) {
                    var configArr = Object.keys(config).filter(function (num) {
                        var keyNum = +num;
                        return (angular.isNumber(keyNum) && !isNaN(keyNum));
                    });
                    var lowestNum = Math.min.apply(null, configArr);
                    var highestNum = Math.max.apply(null, configArr);
                    return {
                        lowestNum: lowestNum,
                        highestNum: highestNum
                    };
                }

                function _isOutOfRange(rangeObj, scoresArr) {
                    var scoresArrCopy = angular.copy(scoresArr);
                    scoresArrCopy.pop();
                    return scoresArrCopy.filter(function (scoreVal) {
                        return (scoreVal.score >= rangeObj.highestNum);
                    });
                }

                function _getCurScore(config, curScore, lastScore, biggestScore, alreadyInArray, outOfRangeArr) {
                    var calcScore = false;
                    // if curScore is larger then lastScore, see if there's a match
                    if (biggestScore === curScore && !alreadyInArray && outOfRangeArr.length === 0) {
                        angular.forEach(config, function (val, key) {
                            var keyNum = +key;
                            if (angular.isObject(val) && !angular.isArray(val)) {
                                if (curScore >= keyNum) {
                                    calcScore = angular.extend(val, {points: keyNum, isImproved: false});
                                }
                            } else {
                                $log.error('SocialSharingSrv _getCurScore: val in config must be an object! key: ' + keyNum);
                            }
                        });
                    }

                    // if no match from config, see if there's an improvement
                    if (!calcScore && lastScore && config.improved && curScore >= biggestScore && curScore > lastScore) {
                        calcScore = angular.extend(config.improved, {points: (curScore - lastScore), isImproved: true});
                    }

                    return calcScore;
                }


                function _calcScores(scoresArr) {
                    if (scoresArr.length === 0) {
                        return false;
                    }
                    var curScore = scoresArr[scoresArr.length - 1].score;
                    var lastScore = scoresArr[scoresArr.length - 2] ? scoresArr[scoresArr.length - 2].score : void(0);
                    var biggestScore = _getBiggestScore(scoresArr);
                    var rangeObj = _getConfigRange(_pointsConfig);
                    var highestScoreIndex = scoresArr.findIndex(function (scoreVal) {
                        return scoreVal.score >= curScore;
                    });
                    var outOfRangeArr = _isOutOfRange(rangeObj, scoresArr);
                    var alreadyInArray = highestScoreIndex !== (scoresArr.length - 1);
                    return _getCurScore(_pointsConfig, curScore, lastScore, biggestScore, alreadyInArray, outOfRangeArr);
                }

                socialSharingSrvObj.getSharingData = function (subjectId) {
                    if (!_pointsConfig) {
                        $log.error('SocialSharingSrv getSharingData: points should be configured in config phase!');
                        return $q.when(false);
                    }
                    return EstimatedScoreSrv.getEstimatedScores().then(function (scoresMap) {
                        var scoresArr = scoresMap[subjectId];
                        if (!scoresArr) {
                            $log.error('SocialSharingSrv getSharingData: no match of subjectId in scores obj! subjectId: ' + subjectId);
                            return $q.reject(false);
                        }
                        // remove diagnostic
                        scoresArr.splice(0, 1);
                        return _calcScores(scoresArr);
                    });
                }
                ;

                return socialSharingSrvObj;
            }];
        });
})(angular);

angular.module('znk.infra-act.socialSharingAct').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.userGoals', [
        'znk.infra.auth'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.userGoals')
        .service('UserGoalsService', ["StorageFirebaseAdapter", "StorageSrv", "ENV", "$q", "AuthService", function (StorageFirebaseAdapter, StorageSrv, ENV, $q, AuthService) {
            'ngInject';

            var fbAdapter = new StorageFirebaseAdapter(ENV.fbDataEndPoint);
            var config = {
                variables: {
                    uid: AuthService.getAuth().uid
                }
            };
            var storage = new StorageSrv(fbAdapter, config);
            var goalsPath = StorageSrv.variables.appUserSpacePath + '/goals';
            var defaultSubjectScore = 25;
            var self = this;

            this.getGoals = function () {
                return storage.get(goalsPath).then(function (userGoals) {
                    if (angular.equals(userGoals, {})) {
                        userGoals = _defaultUserGoals();
                    }
                    return userGoals;
                });
            };

            this.setGoals = function (newGoals) {
                if (arguments.length && angular.isDefined(newGoals)) {
                    return storage.set(goalsPath, newGoals);
                }
                return storage.get(goalsPath).then(function (userGoals) {
                    if (!userGoals.goals) {
                        userGoals.goals = {
                            isCompleted: false,
                            english: defaultSubjectScore,
                            math: defaultSubjectScore,
                            writing: defaultSubjectScore,
                            reading: defaultSubjectScore,
                            science: defaultSubjectScore,
                            compositeScore: defaultSubjectScore
                        };
                    }
                    return userGoals;
                });
            };

            this.calcCompositeScore = function (userSchools, save) {
                // The calculation for composite score in ACT:
                // 1. For each school in US, we have min & max score
                // 2. Calc the average score for each school and set it for each subject goal

                return this.getGoals().then(function (userGoals) {
                    var minSchoolScore = 20,
                        maxSchoolScore = 25,
                        avgScores = [];

                    angular.forEach(userSchools, function (school) {
                        var school25th = isNaN(school.total25th) ? minSchoolScore : school.total25th;
                        var school75th = isNaN(school.total75th) ? maxSchoolScore : school.total75th;
                        avgScores.push((school25th * 0.25) + (school75th * 0.75));
                    });

                    var avgSchoolsScore;
                    if (avgScores.length) {
                        avgSchoolsScore = avgScores.reduce(function (a, b) {
                            return a + b;
                        });
                        avgSchoolsScore = Math.round(avgSchoolsScore / avgScores.length);
                    } else {
                        avgSchoolsScore = defaultSubjectScore;
                    }

                    userGoals = {
                        isCompleted: false,
                        english: avgSchoolsScore || defaultSubjectScore,
                        math: avgSchoolsScore || defaultSubjectScore,
                        writing: avgSchoolsScore || defaultSubjectScore,
                        reading: avgSchoolsScore || defaultSubjectScore,
                        science: avgSchoolsScore || defaultSubjectScore
                    };

                    userGoals.compositeScore = averageSubjectsGoal(userGoals);
                    var prom = save ? self.setGoals(userGoals) : $q.when(userGoals);
                    return prom;
                });
            };

            function _defaultUserGoals() {
                return {
                    isCompleted: false,
                    english: defaultSubjectScore,
                    math: defaultSubjectScore,
                    writing: defaultSubjectScore,
                    reading: defaultSubjectScore,
                    science: defaultSubjectScore,
                    compositeScore: defaultSubjectScore
                };
            }

            function averageSubjectsGoal(goals) {
                // retrun the avg of 4 subject goals
                var math = goals.math || defaultSubjectScore;
                var english = goals.english || defaultSubjectScore;
                var reading = goals.reading || defaultSubjectScore;
                var science = goals.science || defaultSubjectScore;
                return Math.round((math + english + reading + science) / 4);
            }
        }]);
})(angular);

angular.module('znk.infra-act.userGoals').run(['$templateCache', function($templateCache) {

}]);
