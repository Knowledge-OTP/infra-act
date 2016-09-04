(function (angular) {
    'use strict';

    angular.module('znk.infra-act.examUtility',[]);
})(angular);

(function () {
    'use strict';

    var CROSS_TEST_SCORE_ENUM = {
        0: {name: 'History / Social Studies'},
        1: {name: 'Science'}
    };

    angular.module('znk.infra-act.examUtility')
        .service('ScoringService',["$q", "ExamTypeEnum", "StorageRevSrv", "$log", "SubScoreSrv", function ($q, ExamTypeEnum, StorageRevSrv, $log, SubScoreSrv) {
            'ngInject';

            var keysMapConst = {
                crossTestScore: 'CrossTestScore',
                subScore: 'Subscore',
                miniTest: 'miniTest',
                test: 'test'
            };

            function _getScoreTableProm() {
                return StorageRevSrv.getContent({
                    exerciseType: 'scoretable'
                }).then(function (scoreTable) {
                    if (!scoreTable || !angular.isObject(scoreTable)) {
                        var errMsg = 'ScoringService _getScoreTableProm:' +
                            'no scoreTable or scoreTable is not an object! scoreTable: ' + scoreTable + '}';
                        $log.error(errMsg);
                        return $q.reject(errMsg);
                    }
                    return scoreTable;
                });
            }

            function _isShouldAddToScore(question) {
                return (question.isAnsweredCorrectly && !question.afterAllowedTime);
            }

            function _getRawScore(questionsResults) {
                var score = 0;
                angular.forEach(questionsResults, function (question) {
                    if (_isShouldAddToScore(question)) {
                        score += 1;
                    }
                });
                return score;
            }

            function _isTypeFull(typeId) {
                return ExamTypeEnum.FULL_TEST.enum === typeId;
            }

            function _getScoreTableKeyByTypeId(typeId) {
                return _isTypeFull(typeId) ? keysMapConst.test : keysMapConst.miniTest;
            }

            function _getDataFromTable(scoreTable, key, id, rawScore) {
                var data = angular.copy(scoreTable);
                if (angular.isDefined(key)) {
                    data = data[key];
                }
                if (angular.isDefined(id)) {
                    data = data[id];
                }
                if (angular.isDefined(rawScore)) {
                    data = data[rawScore];
                }
                return data;
            }

            function _mergeSectionsWithResults(sections, sectionsResults) {
                return sections.reduce(function (previousValue, currentValue) {
                    var currentSectionResult = sectionsResults.find(function (sectionResult) {
                        return +sectionResult.exerciseId === currentValue.id;
                    });
                    previousValue.push(angular.extend({}, currentSectionResult, currentValue));
                    return previousValue;
                }, []);
            }

            function _getResultsFn(scoreTable, questionsResults, typeId, id) {
                var rawScore = _getRawScore(questionsResults);
                var key = _getScoreTableKeyByTypeId(typeId);
                return _getDataFromTable(scoreTable, key, id, rawScore);
            }

            function _getTestScoreResultFn(scoreTable, questionsResults, typeId, categoryId) {
                var data = _getResultsFn(scoreTable, questionsResults, typeId, categoryId);
                return {
                    testScore: data
                };
            }

            function _getSectionScoreResultFn(scoreTable, questionsResults, typeId, subjectId) {
                var data = _getResultsFn(scoreTable, questionsResults, typeId, subjectId);
                return {
                    sectionScore: data
                };
            }

            function _getFullExamSubAndCrossScoresFn(scoreTable, sections, sectionsResults) {
                var mergeSections = _mergeSectionsWithResults(sections, sectionsResults);
                var subScoresMap = {};
                var crossTestScoresMap = {};
                var subScoresArrProms = [];
                angular.forEach(mergeSections, function (section) {
                    angular.forEach(section.questionResults, function (questionResult) {
                        var subScoresArrProm = SubScoreSrv.getSpecificCategorySubScores(questionResult.categoryId);
                        subScoresArrProm.then(function (subScoresArr) {
                            if (subScoresArr.length > 0) {
                                angular.forEach(subScoresArr, function (subScore) {
                                    if (!subScoresMap[subScore.id]) {
                                        subScoresMap[subScore.id] = {
                                            raw: 0,
                                            name: subScore.name,
                                            subjectId: section.subjectId
                                        };
                                    }
                                    if (_isShouldAddToScore(questionResult)) {
                                        subScoresMap[subScore.id].raw += 1;
                                    }
                                });
                            }
                            return subScoresArr;
                        });
                        subScoresArrProms.push(subScoresArrProm);
                        var crossTestScoreId = questionResult.crossTestScoreId;
                        if (angular.isDefined(crossTestScoreId) && crossTestScoreId !== null) {
                            if (!crossTestScoresMap[crossTestScoreId]) {
                                crossTestScoresMap[crossTestScoreId] = {
                                    raw: 0,
                                    name: CROSS_TEST_SCORE_ENUM[crossTestScoreId].name
                                };
                            }
                            if (_isShouldAddToScore(questionResult)) {
                                crossTestScoresMap[crossTestScoreId].raw += 1;
                            }
                        }
                    });
                });

                return $q.all(subScoresArrProms).then(function () {
                    angular.forEach(subScoresMap, function (subScore, key) {
                        subScoresMap[key].sum = _getDataFromTable(scoreTable, keysMapConst.subScore, key, subScore.raw);
                    });
                    angular.forEach(crossTestScoresMap, function (crossTestScores, key) {
                        crossTestScoresMap[key].sum = _getDataFromTable(scoreTable, keysMapConst.crossTestScore, key, crossTestScores.raw);
                    });
                    return {
                        subScores: subScoresMap,
                        crossTestScores: crossTestScoresMap
                    };
                });
            }

            // api

            this.isTypeFull = function (typeId) {
                return ExamTypeEnum.FULL_TEST.enum === typeId;
            };

            this.getTestScoreResult = function (questionsResults, typeId, categoryId) {
                return _getScoreTableProm().then(function (scoreTable) {
                    return _getTestScoreResultFn(scoreTable, questionsResults, typeId, categoryId);
                });
            };

            this.getSectionScoreResult = function (questionsResults, typeId, subjectId) {
                return _getScoreTableProm().then(function (scoreTable) {
                    return _getSectionScoreResultFn(scoreTable, questionsResults, typeId, subjectId);
                });
            };

            this.getFullExamSubAndCrossScores = function (sections, sectionsResults) {
                return _getScoreTableProm().then(function (scoreTable) {
                    return _getFullExamSubAndCrossScoresFn(scoreTable, sections, sectionsResults);
                });
            };

            this.rawScoreToScore = function (subjectId, rawScore) {
                return _getScoreTableProm().then(function (scoreTable) {
                    var roundedRawScore = Math.round(rawScore);
                    return _getDataFromTable(scoreTable, keysMapConst.test, subjectId, roundedRawScore);
                });
            };

            this.getTotalScoreResult = function (scoresArr) {
                var totalScores = 0;
                angular.forEach(scoresArr, function (score) {
                    totalScores += score;
                });
                return $q.when(totalScores);
            };
        }]);
})();

(function(angular){
    'use strict';

    angular.module('znk.infra-act.examUtility')
        .service('SubScoreSrv', ["CategoryService", "$q", "StorageRevSrv", "SubjectEnum", function(CategoryService, $q, StorageRevSrv, SubjectEnum) {
            'ngInject';

            function _getSubScoreCategoryData() {
                return StorageRevSrv.getContent({
                    exerciseId: null,
                    exerciseType: 'subscoreCategory'
                });
            }

            function _getSubScoreData(subScoreId) {
                return _getSubScoreCategoryData().then(function (subScoresCategoryData) {
                    return subScoresCategoryData[subScoreId];
                });
            }

            this.getSpecificCategorySubScores = function (specificCategoryId) {
                return CategoryService.getCategoryData(specificCategoryId).then(function (specificCategoryData) {
                    var allProm = [];
                    var subScoreKeys = ['subScore1Id', 'subScore2Id'];
                    angular.forEach(subScoreKeys, function (subScoreKey) {
                        var subScoreId = specificCategoryData[subScoreKey];
                        if (subScoreId || subScoreId === 0) {
                            allProm.push(_getSubScoreData(subScoreId));
                        }
                    });
                    return $q.all(allProm);
                });
            };

            this.getAllSubScoresBySubject = (function () {
                var getAllSubjectScoresBySubjectProm;
                return function () {
                    function _getMathOrVerbalSubjectIdIfCategoryNotEssay(category) {
                        return CategoryService.getSubjectIdByCategory(category).then(function (subjectId) {
                            if (subjectId === SubjectEnum.MATH.enum || subjectId === SubjectEnum.VERBAL.enum) {
                                return subjectId;
                            }
                        });
                    }

                    if (!getAllSubjectScoresBySubjectProm) {
                        var allSubScoresProm = _getSubScoreCategoryData();
                        var allSpecificCategoriesProm = CategoryService.getAllLevel4Categories();

                        getAllSubjectScoresBySubjectProm = $q.all([allSubScoresProm, allSpecificCategoriesProm]).then(function (res) {
                            var allSubScores = res[0];
                            var allSpecificCategories = res[1];
                            var subScorePerSubject = {};
                            subScorePerSubject[SubjectEnum.MATH.enum] = {};
                            subScorePerSubject[SubjectEnum.VERBAL.enum] = {};
                            var specificCategoryKeys = Object.keys(allSpecificCategories);
                            var promArray = [];
                            var subScoreKeys = ['subScore1Id', 'subScore2Id'];

                            angular.forEach(specificCategoryKeys, function (specificCategoryId) {
                                var specificCategory = allSpecificCategories[specificCategoryId];
                                var prom = _getMathOrVerbalSubjectIdIfCategoryNotEssay(specificCategory).then(function (subjectId) {
                                    if (angular.isDefined(subjectId)) {
                                        angular.forEach(subScoreKeys, function (subScoreKey) {
                                            var subScoreId = specificCategory[subScoreKey];
                                            if (subScoreId !== null && angular.isUndefined(subScorePerSubject[subjectId][subScoreKey])) {
                                                subScorePerSubject[subjectId][subScoreId] = allSubScores[subScoreId];
                                            }
                                        });
                                    }
                                });
                                promArray.push(prom);
                            });

                            return $q.all(promArray).then(function () {
                                return subScorePerSubject;
                            });
                        });
                    }

                    return getAllSubjectScoresBySubjectProm;
                };
            })();

            this.getSubScoreData = _getSubScoreData;
        }]);
})(angular);

angular.module('znk.infra-act.examUtility').run(['$templateCache', function($templateCache) {

}]);
