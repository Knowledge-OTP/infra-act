(function(angular){
    'use strict';

    angular.module('znk.infra-act.performance')
        .service('PerformanceData', function($q, masteryLevel, StatsSrv, SubScoreSrv, SubjectEnum, TestScoreCategoryEnum, CategoryService) {
            'ngInject';

            var statsLevelsMap = {
                SUBJECT: 1,
                TEST_SCORE: 2,
                SPECIFIC: 4,
                GENERAL: 3
            };

            function _getSubjectId(parentsIds) {
                return parentsIds[parentsIds.length - 1];
            }

            function _isEssayCategory(parentsIds) {
                var subjectId = _getSubjectId(parentsIds);
                return subjectId === SubjectEnum.ESSAY.enum;
            }

            function _calculateCategoryPerformanceData(category) {
                if (!category) {
                    return {};
                }

                var progress, avgTime;

                var totalQuestionsNum = category.totalQuestions;
                if (totalQuestionsNum) {
                    progress = Math.round(category.correct / category.totalQuestions * 100);
                    avgTime = Math.round(category.totalTime / totalQuestionsNum / 1000);
                } else {
                    progress = avgTime = 0;
                }

                return {
                    categoryId: category.id,
                    progress: progress,
                    masteryLevel: masteryLevel.getMasteryLevel(progress),
                    avgTime: avgTime
                };
            }

            function _getStatsKey(id) {
                return 'id_' + id;
            }

            function _getMathAndVerbalPerformanceData() {
                return $q.all([
                    StatsSrv.getLevelStats(statsLevelsMap.TEST_SCORE),
                    StatsSrv.getLevelStats(statsLevelsMap.SPECIFIC)

                ]).then(function (res) {
                    var testScoreStats = res[0] || {};
                    var specificCategoryStats = res[1] || {};

                    var mathStats = testScoreStats[_getStatsKey(TestScoreCategoryEnum.MATH.enum)];
                    var mathSubjectPerformanceData = _calculateCategoryPerformanceData(mathStats);

                    var readingStats = testScoreStats[_getStatsKey(TestScoreCategoryEnum.READING.enum)];
                    var writingStats = testScoreStats[_getStatsKey(TestScoreCategoryEnum.WRITING.enum)];
                    var verbalSubjectPerformanceData = {
                        reading: _calculateCategoryPerformanceData(readingStats),
                        writing: _calculateCategoryPerformanceData(writingStats)
                    };

                    var mathAndVerbalPerformanceData = {};
                        mathAndVerbalPerformanceData[SubjectEnum.MATH.enum] =  mathSubjectPerformanceData;
                        mathAndVerbalPerformanceData[SubjectEnum.VERBAL.enum] =  verbalSubjectPerformanceData;

                    var mathAndVerbalSubScoreData = {};
                        mathAndVerbalSubScoreData [SubjectEnum.MATH.enum] = {};
                        mathAndVerbalSubScoreData [SubjectEnum.VERBAL.enum] = {};

                    var allProm = [];
                    angular.forEach(specificCategoryStats, function (specificCategory) {
                        if (!_isEssayCategory(specificCategory.parentsIds)) {
                            var subjectId = _getSubjectId(specificCategory.parentsIds);
                            var subScoresData = mathAndVerbalSubScoreData[subjectId];
                            var getSpecificCategorySubScoresProm = SubScoreSrv.getSpecificCategorySubScores(specificCategory.id)
                                .then(function (subScores) {
                                    angular.forEach(subScores, function (subScore) {
                                        if (!subScoresData[subScore.id]) {
                                            subScoresData[subScore.id] = angular.copy(subScore);
                                            subScoresData[subScore.id].totalQuestions = 0;
                                            subScoresData[subScore.id].correct = 0;
                                            subScoresData[subScore.id].totalTime = 0;
                                        }

                                        subScoresData[subScore.id].totalQuestions += specificCategory.totalQuestions;
                                        subScoresData[subScore.id].correct += specificCategory.correct;
                                        subScoresData[subScore.id].totalTime += specificCategory.totalTime;
                                    });
                                });
                            allProm.push(getSpecificCategorySubScoresProm);
                        }
                    });

                    return $q.all(allProm).then(function () {
                        angular.forEach(mathAndVerbalSubScoreData, function (subScoresForSubject, subjectId) {
                            var categoryArray = [];
                            angular.forEach(subScoresForSubject, function (subScore) {
                                var subScorePerformance = _calculateCategoryPerformanceData(subScore);
                                categoryArray.push(subScorePerformance);
                            });

                            mathAndVerbalPerformanceData[subjectId].categoryArray = categoryArray;
                        });

                        return mathAndVerbalPerformanceData;
                    });
                });
            }

            function _getEssayPerformanceData() {
                return $q.all([
                    StatsSrv.getLevelStats(statsLevelsMap.TEST_SCORE),
                    StatsSrv.getLevelStats(statsLevelsMap.GENERAL)
                ]).then(function (res) {
                    var testScoreLevelStats = res[0] || {};
                    var generalCategoryLevelStats = res[1] || {};

                    var essayStats = testScoreLevelStats[_getStatsKey(TestScoreCategoryEnum.ESSAY.enum)];
                    var essayGeneralCategoryPerformanceData = _calculateCategoryPerformanceData(essayStats);
                    essayGeneralCategoryPerformanceData.categoryArray = [];

                    angular.forEach(generalCategoryLevelStats, function (generalCategoryStats) {
                        if (_isEssayCategory(generalCategoryStats.parentsIds)) {
                            var generalCategoryPerformance = _calculateCategoryPerformanceData(generalCategoryStats);
                            essayGeneralCategoryPerformanceData.categoryArray.push(generalCategoryPerformance);
                        }
                    });

                    return essayGeneralCategoryPerformanceData;
                });
            }

            function _extendSubjectPerformance(performanceToExtend, allRelevantCategories) {
                var generalCategoriesPerformanceArr = performanceToExtend.categoryArray;
                for (var i = 0; i < generalCategoriesPerformanceArr.length; i++) {
                    var categoryId = generalCategoriesPerformanceArr[i].categoryId;
                    delete allRelevantCategories[categoryId];
                }
                performanceToExtend.noDataItems = allRelevantCategories;
                return performanceToExtend;
            }

            function _addingNotPracticedSubScores(mathAndVerbalSubScore, allSubScoresBySubject) {
                var subjectKeys = Object.keys(allSubScoresBySubject);
                angular.forEach(subjectKeys, function (subjectId) {
                    _extendSubjectPerformance(mathAndVerbalSubScore[subjectId], allSubScoresBySubject[subjectId]);
                });

                return mathAndVerbalSubScore;
            }

            this.getPerformanceData = function () {
                return $q.all([
                    _getMathAndVerbalPerformanceData(),
                    _getEssayPerformanceData(),
                    SubScoreSrv.getAllSubScoresBySubject(),
                    CategoryService.getAllLevel3CategoriesGroupedByLevel1(SubjectEnum.ESSAY.enum)
                ]).then(function (res) {
                    var mathAndVerbalSubScorePerformanceData = res[0];
                    var essayPerformanceData = res[1];
                    var allSubScoresBySubjects = res[2];
                    var allGeneralCategories = angular.copy(res[3]);

                    var performanceData = _addingNotPracticedSubScores(mathAndVerbalSubScorePerformanceData, allSubScoresBySubjects);
                    performanceData[SubjectEnum.ESSAY.enum] = _extendSubjectPerformance(essayPerformanceData, allGeneralCategories);
                    return performanceData;
                });
            };
        });
})(angular);
