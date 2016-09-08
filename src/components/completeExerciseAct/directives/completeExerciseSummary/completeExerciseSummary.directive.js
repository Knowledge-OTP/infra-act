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
        controller: function (CompleteExerciseSrv, SubjectEnum, $q, StatsSrv, CategoryService, TestScoreCategoryEnum, $filter, ExerciseTypeEnum, masteryLevel, ScoringService, SubScoreSrv, PerformanceData, $timeout, HintSrv, UserScreenSharingStateEnum, ScreenSharingSrv, $log) {
            'ngInject';

            var $ctrl = this;
            var PERCENTAGE = 100;
            var translateFilter = $filter('translate');
            var exerciseData = $ctrl.completeExerciseCtrl.getExerciseResult();

            PerformanceData.getPerformanceData().then(function (performanceData) {
                $ctrl.performanceData = performanceData;
                setPerformanceData();
            });

            $timeout(function () {
                HintSrv.triggerHint(HintSrv.hintMap.IN_APP_MESSAGE_WORKOUT_SUMMARY);
            }, 500);


            var screenSharingData;
            var currUserScreenSharingStateChangeCb = function (newUserScreenSharingState) {
                if (newUserScreenSharingState === UserScreenSharingStateEnum.SHARER.enum) {
                    ScreenSharingSrv.getActiveScreenSharingData().then(function (_screenSharingData) {
                        screenSharingData = _screenSharingData;
                        screenSharingData.activeExercise = {
                            exerciseTypeId: exerciseData.exerciseTypeId,
                            exerciseId: exerciseData.exercise.id,
                            activeScreen: 'SUMMARY'
                        };
                        screenSharingData.$save();
                    }).catch(function (err) {
                        $log.error(err);
                    });
                }
            };
            ScreenSharingSrv.registerToCurrUserScreenSharingStateChanges(currUserScreenSharingStateChangeCb);

            function _calcSectionScoring() {
                var resultForScoring = {
                    subjectId: exerciseData.exercise.subjectId,
                    typeId: exerciseData.examData.typeId,
                    questions: exerciseData.exercise.questions,
                    answers: exerciseData.exerciseResult.questionResults.map(function (result) {
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

            function setPerformanceData() {
                var GENERAL_CATEGORIES_STATS = 'level3Categories';
                var questionsArr = exerciseData.exercise.questions;
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

                                if (exerciseData.exerciseTypeId !== ExerciseTypeEnum.SECTION.enum) {
                                    var subScoreObj = categoryMap[generalCategory.parentId];
                                    $ctrl.categoryName = translateFilter('WORKOUTS_WORKOUT_SUMMARY.CATEGORY') + ': ' + subScoreObj.name;
                                }
                            }
                        });
                    }

                    function _calcMasteryDifference() {
                        var SUBJECT_STATS = 'level1Categories';
                        var subjectProgress = statsObj[SUBJECT_STATS];
                        subjectProgress = subjectProgress['id_' + $ctrl.currentSubjectId];

                        var oldSubjectMastery = _calcOldSubjectMastery(subjectProgress);
                        var currentSubjectProgress = $ctrl.performanceData[$ctrl.currentSubjectId].overall.progress;
                        $ctrl.subjectsDelta = currentSubjectProgress - oldSubjectMastery;
                    }

                    function getProgress(generalCategoryObj) {
                        return generalCategoryObj.totalQuestions > 0 ? Math.round((generalCategoryObj.correct * PERCENTAGE) / generalCategoryObj.totalQuestions) : 0;
                    }

                    function _calcOldSubjectMastery(subjectStats) {
                        var totalQuestions = subjectStats.totalQuestions;
                        var numOfTotalCorrectAnswers = subjectStats.correct;

                        var numOfExerciseQuestions = exerciseData.exerciseResult.questionResults.length;
                        var numOfCorrectExerciseAnswers = exerciseData.exerciseResult.correctAnswersNum;

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

            function translateSubjectName(subjectId) {
                var subjectName = translateFilter(angular.uppercase(SubjectEnum.getEnumMap()[subjectId]));
                return subjectName ? subjectName.toLowerCase() : '';
            }

            this.$onInit = function () {
                $ctrl.results = exerciseData.exerciseResult;
                $ctrl.subjectName = translateSubjectName(exerciseData.exercise.subjectId);
                $ctrl.currentSubjectId = exerciseData.exercise.subjectId;
                $ctrl.activeExerciseId = exerciseData.exercise.id;
                $ctrl.avgTime = {
                    correctAvgTime: Math.round($ctrl.results.correctAvgTime / 1000),
                    wrongAvgTime: Math.round($ctrl.results.wrongAvgTime / 1000),
                    skippedAvgTime: Math.round($ctrl.results.skippedAvgTime / 1000)
                };

                if (exerciseData.exerciseTypeId === ExerciseTypeEnum.SECTION.enum) {
                    _calcSectionScoring();
                }

                $ctrl.seenSummary = exerciseData.exerciseResult.seenSummary;

                if (!exerciseData.exerciseResult.seenSummary) {
                    exerciseData.exerciseResult.seenSummary = true;
                    exerciseData.exerciseResult.$save();
                }

                // @todo: translate labels
                $ctrl.gaugeSuccessRate = exerciseData.exercise.questions.length > 0 ? Math.round(($ctrl.results.correctAnswersNum * PERCENTAGE) / exerciseData.exercise.questions.length) : 0;
                $ctrl.performenceChart = {
                    labels: ['Correct', 'Wrong', 'Unanswered'],
                    data: [$ctrl.results.correctAnswersNum, $ctrl.results.wrongAnswersNum, $ctrl.results.skippedAnswersNum],
                    colours: ['#87ca4d', '#ff6766', '#ebebeb'],
                    options: {
                        segmentShowStroke: false,
                        percentageInnerCutout: 85,
                        showTooltips: false,
                        animation: false
                    }
                };
            };

            this.$onDestroy = function () {
                ScreenSharingSrv.unregisterFromCurrUserScreenSharingStateChanges(currUserScreenSharingStateChangeCb);
                if (screenSharingData) {
                    screenSharingData.activeExercise = null;
                    screenSharingData.$save();
                }
            };
        }
    });
})(angular);

