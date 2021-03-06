(function (angular) {
    'use strict';

    angular.module('znk.infra-act.performance')
        .service('PerformanceData', function (StatsSrv, StatsQuerySrv, CategoryService, $q, StatsLevelEnum) {
            'ngInject';

            var performanceData = {};

            this.getPerformanceData = function () {
                performanceData = {};
                return $q.all([
                    StatsSrv.getStats(),
                    CategoryService.getAllSubscores(),
                    CategoryService.getAllLevelCategories(StatsLevelEnum.LEVEL4.enum)
                ]).then(function (results) {
                    var stats = results[0];
                    var allSubScores = results[1];
                    var allSpecificCategories = angular.copy(results[2]);
                    if (angular.isDefined(stats[StatsLevelEnum.LEVEL1.val]) && angular.isDefined(stats[StatsLevelEnum.LEVEL2.val]) && angular.isDefined(stats[StatsLevelEnum.LEVEL3.val])) {
                        _buildSubjects(stats[StatsLevelEnum.LEVEL1.val]);
                        _buildSubScores(stats[StatsLevelEnum.LEVEL2.val], allSubScores);
                        _buildGeneralCategories(stats[StatsLevelEnum.LEVEL3.val]);
                        _calcSpecificCategory(performanceData, allSpecificCategories, stats[StatsLevelEnum.LEVEL4.val]);
                    }
                    return performanceData;
                });
            };

            function _calcSpecificCategory(_performanceData, allSpecificCategories, specificStats) {
                angular.forEach(specificStats, function (specificCategoryStats, categoryId) {
                    categoryId = specificCategoryStats.id;
                    var categoryParent = specificCategoryStats.parentsIds;
                    var subjectPerformance = _performanceData[categoryParent[categoryParent.length - 1]];
                    if (subjectPerformance) {
                        angular.forEach(subjectPerformance.subScoreArray, function (subscoreObj) {
                            angular.forEach(subscoreObj.categoryArray, function (generalCategoryObj) {
                                if (generalCategoryObj.id === categoryParent[0]) {
                                    if (!generalCategoryObj.specificArray) {
                                        generalCategoryObj.specificArray = [];
                                    }

                                    if (allSpecificCategories[categoryId]) {
                                        generalCategoryObj.specificArray.push({
                                            id: categoryId,
                                            name: allSpecificCategories[categoryId].name,
                                            levelProgress: _getProgressPercentage(specificCategoryStats.totalQuestions, specificCategoryStats.correct),
                                            correct: specificCategoryStats.correct,
                                            wrong: specificCategoryStats.wrong,
                                            totalQuestions: specificCategoryStats.totalQuestions
                                        });
                                    }
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
                    StatsQuerySrv.getWeakestCategoryInLevel(StatsLevelEnum.LEVEL3.enum, null, subjectsObj[subjectkey].id).then(function (weakestCategory) {
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
        });
})(angular);
