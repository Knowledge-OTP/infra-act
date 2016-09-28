(function () {
    'use strict';

    angular.module('znk.infra-act.examUtility')
        .service('ScoringService',function ($q, SubjectEnum, StorageRevSrv, $log) {
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
        });
})();
