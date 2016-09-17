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
                'correct-icon': 'components/completeExerciseAct/svg/correct-icon.svg',
                'wrong-icon': 'components/completeExerciseAct/svg/wrong-icon.svg'
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
        .directive('imageZoomer', ["$timeout", "$mdDialog", "$document", "$compile", function ($timeout, $mdDialog, $document, $compile) {
            'ngInject';

            function compileFn() {
                function preFn(scope, element) {
                    var MAX_WIDTH = 400;
                    var MAX_HEIGHT = 500;
                    var MIN_SIZE_TO_ZOOM = 200;
                    var zoomableImgElemArr = [];

                    $timeout(function () {
                        var imageElements = element[0].querySelectorAll('img');

                        angular.forEach(imageElements, function (imgElement) {
                            var clickableIconElement = addIconToImage(imgElement);
                            var clickableImageElement = imgElement;
                            addImageHandler(clickableIconElement, imgElement);  // clickable icon
                            addImageHandler(clickableImageElement, imgElement); // clickable image
                        });
                    });


                    function addImageHandler(imgElement, image) {
                        if (_shouldImageBeZoomed(image)) {
                            return;
                        }
                        if (_getImageWidth(image) > 400) {
                            image.style.width = MAX_WIDTH + 'px';
                            image.style.height = 'auto';
                        }
                        image.className = 'img-to-zoom';
                        angular.element(imgElement).on('click', function () {
                            zoomImage(image);
                        });
                        zoomableImgElemArr.push(imgElement);
                    }

                    function zoomImage(image) {
                        DialogController.$inject = ["$scope"];
                        function DialogController($scope) {
                            $scope.closeDialog = function () {
                                $mdDialog.hide();
                            };
                        }

                        var parentEl = angular.element($document.body);
                        $mdDialog.show({
                            clickOutsideToClose: true,
                            parent: parentEl,
                            template: '<div class="zoom-image-modal">' +
                            '<svg-icon ng-click="closeDialog()" name="close-popup"></svg-icon>' +
                            '<md-dialog ng-click="closeDialog()">' +
                            '<md-dialog-content>' +
                            '<img src="' + image.src + '" style="width:' + image.width * 2 + 'px; ' + 'height:' + image.height * 2 + 'px">' +
                            '</md-dialog-content>' +
                            '</md-dialog>' +
                            '</div>',
                            controller: DialogController
                        });
                    }

                    function addIconToImage(image) {
                        if (_shouldImageBeZoomed(image)) {
                            return image;
                        }

                        if (_getImageWidth(image) > MAX_WIDTH) {
                            image.style.width = MAX_WIDTH + 'px';
                            image.style.height = 'auto';
                        }
                        var imageParent = angular.element(image.parentNode);
                        var imageNewParent = angular.element('<div class="zoomable-image-with-icon"></div>');   // wrap img and icon with one div element
                        imageNewParent.css('position', 'relative');
                        imageNewParent.css('margin', '0 auto');
                        imageNewParent.css('textAlign', 'center');
                        imageNewParent.css('width', image.style.width);
                        imageNewParent.css('height', image.style.height);
                        imageNewParent.append(image);
                        imageParent.append(imageNewParent);

                        var svgIconTemplate = '<div class="zoom-icon-wrapper">' +
                            '<svg-icon name="full-screen-icon"></svg-icon>' +
                            '</div>';

                        imageNewParent.append(svgIconTemplate);
                        var iconElement = imageNewParent[0].querySelector('.zoom-icon-wrapper');
                        $compile(iconElement)(scope);
                        return iconElement;
                    }

                    function _shouldImageBeZoomed(image) {
                        return image.style.width === null || _getImageWidth(image) < MIN_SIZE_TO_ZOOM || _getImageHeight(image) < MIN_SIZE_TO_ZOOM || _getImageHeight(image) > MAX_HEIGHT;
                    }

                    function _getImageWidth(image) {
                        return + image.style.width.replace('px', '');
                    }

                    function _getImageHeight(image) {
                        var width = _getImageWidth(image);
                        var height = +image.style.height.replace('px', '');
                        return width > MAX_WIDTH ? (height * MAX_WIDTH) / width : height;
                    }

                    scope.$on('$destroy', function () {
                        for (var i = 0; i < zoomableImgElemArr.length; i++) {
                            angular.element(zoomableImgElemArr[i]).off('click');
                        }
                        zoomableImgElemArr = [];
                    });
                }

                return {
                    post: preFn
                };
            }

            var directive = {
                priority: -1000,
                restrict: 'A',
                scope: {},
                compile: compileFn
            };

            return directive;
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
                        var image = $window.location.protocol + ENV.zinkerzWebsiteBaseUrl + 'wp-content/themes/salient-child/images/share/' + sharingData.shareUrlMap[self.subjectName];
                        var descriptionTranslate = sharingData.isImproved ? 'IMPROVED_TEXT' : 'SHARE_DESCRIPTION';
                        var description = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.' + descriptionTranslate, { pts: sharingData.points, subjectName: self.subjectName });
                        var title = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.SHARE_TITLE');
                        var caption = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.SHARE_CAPTION');
                        var url = ENV.zinkezWebsiteUrl;
                        var ogPrefix = 'og:';
                        var twitterPrefix = 'twitter:';


                        self.shareData = {
                            facebook: {
                                type: 'facebook',
                                facebookurl: url,
                                facebooktitle: title
                            }
                        };
                        self.shareData.facebook[ogPrefix + 'image'] = image;
                        self.shareData.facebook[ogPrefix + 'image:width'] = 484;
                        self.shareData.facebook[ogPrefix + 'image:height'] = 252;
                        self.shareData.facebook[ogPrefix + 'title'] = title;
                        self.shareData.facebook[ogPrefix + 'caption'] = caption;
                        self.shareData.facebook[ogPrefix + 'description'] = description;
                        self.shareData.facebook['fb:app_id'] = ENV.facebookAppId;

                        self.shareData.google = {
                            type: 'google',
                            url: url,
                            title: title,
                            description: description,
                            image: image
                        };


                        self.shareData.google [ogPrefix + 'image'] = image;
                        self.shareData.google [ogPrefix + 'image:width'] = 484;
                        self.shareData.google [ogPrefix + 'image:height'] = 252;
                        self.shareData.google [ogPrefix + 'title'] = title;
                        self.shareData.google [ogPrefix + 'description'] = description;
                        self.shareData.google [ogPrefix + 'url'] = url;

                        self.shareData.twitter = {
                            type: 'twitter',
                            description: description,
                            url: url,
                            title: title
                        };
                        self.shareData.twitter[twitterPrefix + 'card'] = 'summary_large_image';
                        self.shareData.twitter[twitterPrefix + 'description'] = description;
                        self.shareData.twitter[twitterPrefix + 'site'] = '@oded300';
                        self.shareData.twitter[twitterPrefix + 'title'] = title;
                        self.shareData.twitter[twitterPrefix + 'image'] = image;
                        self.shareData.twitter[twitterPrefix + 'url'] = url;
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
        .run(["$timeout", "$translatePartialLoader", function($timeout, $translatePartialLoader){
            'ngInject';

            $timeout(function(){
                $translatePartialLoader.addPart('completeExerciseAct');
            });
        }]);
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
    "\n" +
    "    <social-sharing\n" +
    "        subject-id=\"::$ctrl.currentSubjectId\"\n" +
    "        animate=\"true\">\n" +
    "    </social-sharing>\n" +
    "\n" +
    "    <section>\n" +
    "        <div class=\"test-score-title\">{{::$ctrl.testScoreTitle}}</div>\n" +
    "\n" +
    "        <div class=\"gauge-row-wrapper\">\n" +
    "            <div class=\"overflowWrap\">\n" +
    "                <div class=\"gauge-wrap\">\n" +
    "                    <div class=\"gauge-inner-text\">{{::$ctrl.gaugeSuccessRate}}%\n" +
    "                        <div class=\"success-title\" translate=\".SUCCESS\"></div>\n" +
    "                    </div>\n" +
    "                    <canvas\n" +
    "                        width=\"134px\"\n" +
    "                        height=\"134px\"\n" +
    "                        id=\"doughnut\"\n" +
    "                        class=\"chart chart-doughnut\"\n" +
    "                        chart-options=\"$ctrl.performenceChart.options\"\n" +
    "                        chart-colours=\"$ctrl.performenceChart.colours\"\n" +
    "                        chart-data=\"$ctrl.performenceChart.data\"\n" +
    "                        chart-labels=\"$ctrl.performenceChart.labels\"\n" +
    "                        chart-legend=\"false\">\n" +
    "                    </canvas>\n" +
    "                </div>\n" +
    "                <div class=\"statistics\">\n" +
    "                    <div class=\"stat-row\">\n" +
    "                        <div class=\"stat-val correct\">{{::$ctrl.exerciseResults.correctAnswersNum}}</div>\n" +
    "                        <div class=\"title\" translate=\".CORRECT\"></div>\n" +
    "                        <div class=\"avg-score\"><span translate=\".AVG\"></span>. {{::$ctrl.avgTime.correctAvgTime}} <span translate=\".SEC\"></span> </div>\n" +
    "                    </div>\n" +
    "\n" +
    "                    <div class=\"stat-row\">\n" +
    "                        <div class=\"stat-val wrong\">{{::$ctrl.exerciseResults.wrongAnswersNum}}</div>\n" +
    "                        <div class=\"title\" translate=\".WRONG\"></div>\n" +
    "                        <div class=\"avg-score\"><span translate=\".AVG\"></span>. {{::$ctrl.avgTime.wrongAvgTime}} <span translate=\".SEC\"></span></div>\n" +
    "                    </div>\n" +
    "\n" +
    "                    <div class=\"stat-row\">\n" +
    "                        <div class=\"stat-val skipped\">{{::$ctrl.exerciseResults.skippedAnswersNum}}</div>\n" +
    "                        <div class=\"title\" translate=\".SKIPPED\"></div>\n" +
    "                        <div class=\"avg-score\"><span translate=\".AVG\"></span>. {{::$ctrl.avgTime.skippedAvgTime}}  <span translate=\".SEC\"></span></div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"category-name\">{{$ctrl.categoryName | cutString: 42}}</div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"review-btn-wrapper\">\n" +
    "            <md-button class=\"md-primary znk\"\n" +
    "                       autofocus\n" +
    "                       tabindex=\"1\"\n" +
    "                       md-no-ink\n" +
    "                       ng-cloak\n" +
    "                       ng-click=\"$ctrl.goToSummary()\">\n" +
    "                <span translate=\".REVIEW\"></span>\n" +
    "            </md-button>\n" +
    "        </div>\n" +
    "    </section>\n" +
    "\n" +
    "    <section class=\"time-line-wrapper2\"  ng-class=\"{'seen-summary': $ctrl.seenSummary}\">\n" +
    "\n" +
    "        <div class=\"estimated-score-title\">{{$ctrl.subjectName}} <span translate=\".ESTIMATED_SCORE\"></span> </div>\n" +
    "        <performance-timeline\n" +
    "            on-timeline-finish=\"vm.onTimelineFinish(subjectDelta)\"\n" +
    "            subject-id=\"{{::$ctrl.currentSubjectId}}\"\n" +
    "            active-exercise-id=\"::$ctrl.activeExerciseId\">\n" +
    "        </performance-timeline>\n" +
    "    </section>\n" +
    "\n" +
    "\n" +
    "    <section class=\"proficiency-level-row animate-if\" ng-if=\"!$ctrl.seenSummary\">\n" +
    "        <div class=\"proficiency-title-row\" translate=\".MASTERY_LEVEL\"></div>\n" +
    "        <div class=\"row data-row\">\n" +
    "            <div class=\"subject-level\">\n" +
    "                <div class=\"subject-name\">{{$ctrl.subjectName}}</div>\n" +
    "                <div class=\"subject-progress\">\n" +
    "                    <div class=\"progress\">\n" +
    "                        <div znk-progress-bar progress-width=\"{{$ctrl.performanceData[$ctrl.currentSubjectId].overall.progress}}\" show-progress-value=\"false\"></div>\n" +
    "                        <span class=\"title\" translate=\".MASTERY\"></span>\n" +
    "                    </div>\n" +
    "                    <div class=\"progress-val\">\n" +
    "                        {{$ctrl.performanceData[$ctrl.currentSubjectId].overall.progress}}%\n" +
    "                        <div class=\"progress-perfect\" ng-class=\"{'bad-score': $ctrl.subjectsDelta<0}\" ng-if=\"$ctrl.subjectsDelta != 0\">\n" +
    "                            <span ng-if=\"$ctrl.subjectsDelta > 0\">+</span>\n" +
    "                            {{$ctrl.subjectsDelta | number : 0}}\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"category-level-wrap\">\n" +
    "                <div class=\"category-level\" ng-repeat=\"(key, generalCategory) in $ctrl.generalCategories\">\n" +
    "\n" +
    "                    <div class=\"category-data\">\n" +
    "                        <div class=\"category-level-name\">{{generalCategory.name}} </div>\n" +
    "                        <div znk-progress-bar progress-width=\"{{generalCategory.progress}}\" progress-value=\"{{generalCategory.progress}}\" show-progress-value=\"false\"></div>\n" +
    "                        <div class=\"level\">{{generalCategory.mastery}}</div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </section>\n" +
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
    "             translate-values=\"{ pts: {{vm.showSocialArea.points}}, subjectName: '{{vm.subjectName}}' }\">\n" +
    "        </div>\n" +
    "        <div class=\"social-text\"\n" +
    "             translate=\".IMPROVED_TEXT\"\n" +
    "             ng-switch-when=\"true\"\n" +
    "             translate-values=\"{ pts: {{vm.showSocialArea.points}}, subjectName: '{{vm.subjectName}}' }\">\n" +
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
    "<answer-explanation></answer-explanation>\n" +
    "\n" +
    "<div class=\"question-wrapper english-full-paragraphs-wrapper question-basic-style\">\n" +
    "\n" +
    "    <div class=\"question-container znk-scrollbar\">\n" +
    "        <div class=\"paragraph-title\"></div>\n" +
    "\n" +
    "        <div class=\"paragraphs-wrapper\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\">\n" +
    "        <div class=\"question-content\"></div>\n" +
    "        <answer-builder></answer-builder>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/englishSpecificParagraph.template.html",
    "<answer-explanation></answer-explanation>\n" +
    "\n" +
    "<div class=\"question-wrapper english-specific-paragraph-wrapper question-basic-style\"  translate-namespace=\"ENGLISH_SPECIFIC_PARAGRAPH\">\n" +
    "\n" +
    "    <div class=\"specific-paragraph-view-wrapper\" ng-show=\"vm.view === vm.SPECIFIC_PARAGRAPH\">\n" +
    "        <div class=\"question-container znk-scrollbar\">\n" +
    "            <div class=\"full-passage-link\" ng-bind-html=\"vm.question.groupData.name\" ng-click=\"vm.view = vm.FULL_PASSAGE\"></div>\n" +
    "            <div class=\"paragraph-title\"></div>\n" +
    "            <div class=\"paragraph\"></div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"answer-container znk-scrollbar\">\n" +
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
    "<answer-explanation></answer-explanation>\n" +
    "\n" +
    "<div class=\"question-wrapper writing-question-wrapper question-basic-style\">\n" +
    "\n" +
    "    <div class=\"question-container znk-scrollbar\"></div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\">\n" +
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
    "            <svg-icon class=\"correct-icon\" name=\"correct\"></svg-icon>\n" +
    "            <svg-icon class=\"wrong-icon\" name=\"wrong-icon\"></svg-icon>\n" +
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
    "<div class=\"lecture-question-wrapper\" ng-switch=\"vm.question.typeId\">\n" +
    "    <div class=\"img-wrapper\" ng-switch-when=\"1\">\n" +
    "        <img  ng-src=\"{{vm.question.fileUrl}}\">\n" +
    "    </div>\n" +
    "    <!--<div ng-switch-when=\"1\"> wait for the second type</div> -->\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/mathQuestion.template.html",
    "<answer-explanation></answer-explanation>\n" +
    "\n" +
    "<div class=\"math-question-wrapper\" image-zoomer>\n" +
    "\n" +
    "    <div class=\"question-container\"></div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\">\n" +
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
    "            <svg-icon class=\"wrong-icon\" name=\"wrong-icon\"></svg-icon>\n" +
    "            <div class=\"checkbox-item\" ng-click=\"clickHandler($index)\">\n" +
    "                <div class=\"item-index\">{{$index +  2}}</div>\n" +
    "            </div>\n" +
    "            <div class=\"correct-answer-line\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/readingQuestion.template.html",
    "<answer-explanation></answer-explanation>\n" +
    "\n" +
    "<div class=\"question-wrapper reading-question-wrapper question-basic-style\" image-zoomer>\n" +
    "\n" +
    "    <div class=\"question-container znk-scrollbar\">\n" +
    "        <div class=\"passage-title\">{{::vm.passageTitle}}</div>\n" +
    "        <div class=\"article\">\n" +
    "            <div class=\"article-content\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\">\n" +
    "        <div class=\"question-content\"></div>\n" +
    "        <answer-builder></answer-builder>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/scienceQuestion.template.html",
    "<!--scienceQuestion.template.html-->\n" +
    "<answer-explanation></answer-explanation>\n" +
    "\n" +
    "<div class=\"question-wrapper science-question-wrapper question-basic-style\" image-zoomer>\n" +
    "\n" +
    "    <div class=\"question-container znk-scrollbar\">\n" +
    "        <div class=\"paragraph-title\"></div>\n" +
    "\n" +
    "        <div class=\"paragraphs-wrapper\"></div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\">\n" +
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
    "        <svg-icon class=\"correct-icon-drv\" name=\"correct-icon\"></svg-icon>\n" +
    "        <svg-icon class=\"wrong-icon-drv\" name=\"wrong-icon\"></svg-icon>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/simpleQuestion.template.html",
    "<answer-explanation></answer-explanation>\n" +
    "\n" +
    "<div class=\"question-wrapper simple-question-wrapper question-basic-style\" image-zoomer>\n" +
    "\n" +
    "        <div class=\"answer-container znk-scrollbar\">\n" +
    "            <div class=\"question-content\"></div>\n" +
    "            <custom-answer-builder-act></custom-answer-builder-act>\n" +
    "        </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/writingFullPassage.template.html",
    "<answer-explanation></answer-explanation>\n" +
    "\n" +
    "<answer-explanation></answer-explanation>\n" +
    "\n" +
    "<div class=\"question-wrapper english-full-paragraphs-wrapper question-basic-style\" image-zoomer>\n" +
    "\n" +
    "    <div class=\"question-container znk-scrollbar\">\n" +
    "        <div class=\"paragraph-title\"></div>\n" +
    "\n" +
    "        <div class=\"paragraphs-wrapper\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\">\n" +
    "        <div class=\"question-content\"></div>\n" +
    "        <answer-builder></answer-builder>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/writingQuestion.template.html",
    "<!--writingQuestion.template.html-->\n" +
    "<answer-explanation></answer-explanation>\n" +
    "\n" +
    "<div class=\"question-wrapper writing-question-wrapper question-basic-style\">\n" +
    "\n" +
    "    <div class=\"question-container znk-scrollbar\"></div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\">\n" +
    "        <div class=\"question-content\"></div>\n" +
    "        <answer-builder></answer-builder>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/writingSpecificParagraph.template.html",
    "<answer-explanation></answer-explanation>\n" +
    "\n" +
    "<div class=\"question-wrapper writing-specific-paragraph-wrapper question-basic-style\" translate-namespace=\"WRITING_SPECIFIC_PARAGRAPH\">\n" +
    "\n" +
    "    <div class=\"specific-paragraph-view-wrapper\" ng-show=\"vm.view === vm.SPECIFIC_PARAGRAPH\" image-zoomer>\n" +
    "        <div class=\"question-container znk-scrollbar\">\n" +
    "            <div class=\"full-passage-link\" ng-bind-html=\"vm.question.groupData.name\" ng-click=\"vm.view = vm.FULL_PASSAGE\"></div>\n" +
    "            <div class=\"paragraph-title\"></div>\n" +
    "            <div class=\"paragraph\"></div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"answer-container znk-scrollbar\">\n" +
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
