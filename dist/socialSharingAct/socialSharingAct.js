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
            var subjectsRawScoreEdges = {
                'ENGLISH': {
                    min: 0,
                    max: 75
                },
                'MATH': {
                    min: 0,
                    max: 60
                },
                'READING': {
                    min: 0,
                    max: 40
                },
                'SCIENCE': {
                    min: 0,
                    max: 40
                },
                'WRITING': {
                    min: 0,
                    max: 10
                }
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
                    return EstimatedScoreSrv.getEstimatedScoresData().then(function (scoresMap) {
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
