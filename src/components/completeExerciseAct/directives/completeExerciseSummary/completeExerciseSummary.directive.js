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
        controller: function (CompleteExerciseSrv, SubjectEnum, $q, StatsSrv, CategoryService, TestScoreCategoryEnum, $filter, masteryLevel, SubScoreSrv, PerformanceData) {
            'ngInject';

            var translateFilter = $filter('translate');
            var $ctrl = this;
            var performanceDataProm = PerformanceData.getPerformanceData();
            function _initSuccessGauge() {
                var exerciseResult = $ctrl.completeExerciseCtrl.getExerciseResult();
                var exerciseContent = $ctrl.completeExerciseCtrl.getExerciseContent();

                $ctrl.performanceChart = {};
                $ctrl.performanceChart.gaugeSettings = {
                    labels: ['Correct', 'Wrong', 'Unanswered'],
                    data: [
                        exerciseResult.correctAnswersNum,
                        exerciseResult.wrongAnswersNum,
                        exerciseResult.skippedAnswersNum
                    ],
                    colours: ['#87ca4d', '#ff6766', '#ebebeb'],
                    options: {
                        segmentShowStroke: false,
                        percentageInnerCutout: 85,
                        showTooltips: false,
                        animation: false
                    }
                };

                var totalQuestionsNum = exerciseContent.questions.length;
                var totalCorrectNum = exerciseResult.correctAnswersNum || 0;
                $ctrl.performanceChart.successRate = parseInt(totalCorrectNum / totalQuestionsNum * 100);
            }

            function _initStats() {
                var exerciseResult = $ctrl.completeExerciseCtrl.getExerciseResult();
                // var exerciseContent = $ctrl.completeExerciseCtrl.getExerciseContent();

                $ctrl.statsTime = {};
                var avgTimePropToConvertToSeconds = ['correct', 'wrong', 'skipped'];
                avgTimePropToConvertToSeconds.forEach(function (avgTimeProp) {
                    var avgTimePropInResultObj = avgTimeProp + 'AvgTime';
                    $ctrl.statsTime[avgTimePropInResultObj] = parseInt(exerciseResult[avgTimePropInResultObj] / 1000);
                });
            }

            var _calcMasteryStats = (function(){
                function _calcAvgPercentage(num, total) {
                    return Math.round((num / total) * 100);
                }

                function _calcOldTestScoreMastery(testScoreStats) {
                    var exerciseResult = $ctrl.completeExerciseCtrl.getExerciseResult();

                    var totalQuestions = testScoreStats.totalQuestions;
                    var numOfTotalCorrectAnswers = testScoreStats.correct;

                    var numOfExerciseQuestions = exerciseResult.questionResults.length;
                    var numOfCorrectExerciseAnswers = exerciseResult.correctAnswersNum;

                    var oldNumOfTotalQuestions = totalQuestions - numOfExerciseQuestions;
                    var oldNumOfCorrectAnswers = numOfTotalCorrectAnswers - numOfCorrectExerciseAnswers;

                    return _calcAvgPercentage(oldNumOfCorrectAnswers, oldNumOfTotalQuestions);
                }

                function _isAnsweredCorrectly(questionId) {
                    var questionResult = $ctrl.completeExerciseCtrl.getExerciseResult().questionResults;
                    return questionResult.some(function (element, index, array) {
                        var result = array[index];
                        return questionId === result.questionId && result.isAnsweredCorrectly;
                    });
                }

                function _updateRawMastery(practicedCategory, question) {
                    var categoryId = practicedCategory.id;
                    if (angular.isUndefined($ctrl.categoryMastery[categoryId])) {
                        $ctrl.categoryMastery[categoryId] = {};
                        $ctrl.categoryMastery[categoryId].questionCount = 0;
                        $ctrl.categoryMastery[categoryId].correctAnswersNum = 0;
                        $ctrl.categoryMastery[categoryId].name = practicedCategory.name;
                    }
                    $ctrl.categoryMastery[categoryId].questionCount++;
                    $ctrl.categoryMastery[categoryId].correctAnswersNum += _isAnsweredCorrectly(question.id) ? 1 : 0;
                }

                function _setSubScoreMastery(questions) {
                    var promArr = [];
                    angular.forEach(questions, function (question) {
                        var prom = SubScoreSrv.getSpecificCategorySubScores(question.categoryId).then(function (subScoredArr) {
                            if (subScoredArr.length > 0) {  // there are questions that not related to any sub score.
                                angular.forEach(subScoredArr, function (subScore) {
                                    _updateRawMastery(subScore, question);
                                });
                            }
                        });
                        promArr.push(prom);
                    });
                    return promArr;
                }

                function _setGeneralMastery(questions) {
                    var promArr = [];
                    angular.forEach(questions, function (question) {
                        var categoryId = question.categoryId;
                        var prom = CategoryService.getParentCategory(categoryId).then(function (generalCategory) {
                            _updateRawMastery(generalCategory, question);
                        });
                        promArr.push(prom);
                    });
                    return promArr;
                }

                function _getCategoryProgressById(categoriesArray, categoryId) {
                    for (var i = 0; i < categoriesArray.length; i++) {
                        if (+categoriesArray[i].categoryId === +categoryId) {
                            return categoriesArray[i].progress;
                        }
                    }
                }

                function _calcCategoryMastery(categoryRawMastery) {
                    var subjectId = $ctrl.completeExerciseCtrl.getExerciseContent().subjectId;

                    performanceDataProm.then(function (performanceData) {
                        var subScoresKeys = Object.keys(categoryRawMastery);
                        var subScoresArray = performanceData[subjectId].categoryArray;

                        angular.forEach(subScoresKeys, function (subScoreKey) {
                            var progress = _getCategoryProgressById(subScoresArray, subScoreKey);
                            categoryRawMastery[subScoreKey].progress = progress;
                            categoryRawMastery[subScoreKey].mastery = masteryLevel.getMasteryLevel(progress);
                        });
                    });
                }

                return function () {
                    var exerciseCategoryId = $ctrl.completeExerciseCtrl.getExerciseContent().categoryId;

                    var TEST_SCORE = 2;

                    $ctrl.testScoreMastery = {};
                    $q.all([
                        StatsSrv.getLevelStats(TEST_SCORE),
                        CategoryService.getCategoryLevel2Parent(exerciseCategoryId)
                    ])
                        .then(function (res) {
                            var testScoreStats = res[0];
                            var testScoreCategory = res[1];

                            var testScoreName = TestScoreCategoryEnum.getValByEnum(testScoreCategory.id);
                            testScoreName = angular.uppercase(testScoreName);
                            $ctrl.testScoreMastery.testScorename = translateFilter('COMPLETE_EXERCISE_ACT.COMPLETE_EXERCISE_SUMMARY.' + testScoreName);

                            var TEST_SCORE_ID = 'id_' + testScoreCategory.id;
                            testScoreStats = testScoreStats[TEST_SCORE_ID];
                            $ctrl.testScoreMastery.progress = _calcAvgPercentage(testScoreStats.correct, testScoreStats.totalQuestions);
                            $ctrl.testScoreMastery.mastery = masteryLevel.getMasteryLevel($ctrl.testScoreMastery.progress);

                            var oldTestScoreMastery = _calcOldTestScoreMastery(testScoreStats);
                            $ctrl.testScoreDelta = $ctrl.testScoreMastery.progress - oldTestScoreMastery;
                        });

                    $ctrl.categoryMastery = {};

                    var exerciseContent = $ctrl.completeExerciseCtrl.getExerciseContent();
                    var _questions = exerciseContent .questions;
                    var promArr;
                    if (exerciseContent .subjectId !== SubjectEnum.ESSAY.enum) {
                        promArr = _setSubScoreMastery(_questions);
                    } else {
                        promArr = _setGeneralMastery(_questions);
                    }
                    $q.all(promArr).then(function () {
                        _calcCategoryMastery($ctrl.categoryMastery);
                    });
                };
            })();

            this.$onInit = function () {
                _initSuccessGauge();

                _initStats();

                _calcMasteryStats();

                this.exerciseResult = $ctrl.completeExerciseCtrl.getExerciseResult();
                this.exerciseContent = $ctrl.completeExerciseCtrl.getExerciseContent();
                this.isEssaySubject = this.exerciseContent.subjectId === SubjectEnum.ESSAY.enum;

                if(!this.exerciseResult.seenSummary){
                    this.notSeenSummary = true;
                    this.exerciseResult.seenSummary = true;
                    this.exerciseResult.$save();
                }

                this.goToSummary = function () {
                    this.completeExerciseCtrl.changeViewState(CompleteExerciseSrv.VIEW_STATES.EXERCISE);
                };
            };
        }
    });
})(angular);

