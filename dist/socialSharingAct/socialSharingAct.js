(function (angular) {
    'use strict';

    angular.module('znk.infra-act.socialSharingAct', [
        'znk.infra-act.configAct'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.socialSharingAct')
        .config(["EstimatedScoreSrvProvider", "SubjectEnumConst", "EstimatedScoreEventsHandlerSrvProvider", "exerciseTypeConst", function estimatedScoreConfig(EstimatedScoreSrvProvider, SubjectEnumConst,EstimatedScoreEventsHandlerSrvProvider, exerciseTypeConst) {
            'ngInject';

            rawScoreToScoreFnGetter.$inject = ["ScoringService"];
            eventProcessControl.$inject = ["SubjectEnum"];
            var subjectsRawScoreEdges = {};
            subjectsRawScoreEdges[SubjectEnumConst.VERBAL] = {
                min: 0,
                max: 80
            };
            subjectsRawScoreEdges [SubjectEnumConst.MATH] = {
                min: 0,
                max: 58
            };

            EstimatedScoreSrvProvider.setSubjectsRawScoreEdges(subjectsRawScoreEdges);

            EstimatedScoreSrvProvider.setMinMaxDiagnosticScore(-Infinity, Infinity);

            function rawScoreToScoreFnGetter(ScoringService) {
                'ngInject';//jshint ignore:line

                return function (subjectId, rawScore) {
                    return ScoringService.rawScoreToScore(subjectId, rawScore);
                };
            }

            EstimatedScoreSrvProvider.setRawScoreToRealScoreFn(rawScoreToScoreFnGetter);

            var diagnosticScoringMap = {
                1: [55, 55, 45, 45],
                2: [65, 65, 50, 50],
                3: [75, 75, 55, 55],
                4: [85, 85, 65, 65],
                5: [95, 95, 75, 75]
            };
            EstimatedScoreEventsHandlerSrvProvider.setDiagnosticScoring(diagnosticScoringMap);

            var defaultRawPointsForExercise = [1, 0, 0, 0];
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.SECTION, defaultRawPointsForExercise);
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.TUTORIAL, defaultRawPointsForExercise);
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.PRACTICE, defaultRawPointsForExercise);

            function eventProcessControl(SubjectEnum) {
                'ngInject';//jshint ignore:line

                return function (exerciseType, exercise) {
                    return exercise.subjectId !== SubjectEnum.ESSAY.enum;
                };
            }

            EstimatedScoreEventsHandlerSrvProvider.setEventProcessControl(eventProcessControl);
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.socialSharingAct')
        .config(["SocialSharingSrvProvider", function(SocialSharingSrvProvider){
            SocialSharingSrvProvider.setPoints({
                600: {
                    background: 'background-lowest',
                    banner1: 'summary-congrats-banner-600-1',
                    banner2: 'summary-congrats-banner-600-1',
                    shareUrlMap: {
                        math: 'ACT-FB-share-post-math-600.png',
                        verbal: 'ACT-FB-share-post-verbal-600.png'
                    }
                },
                650: {
                    background: 'background-middle-1',
                    banner1: 'summary-congrats-banner-650-1',
                    banner2: 'summary-congrats-banner-650-1',
                    shareUrlMap: {
                        math: 'ACT-FB-share-post-math-650.png',
                        verbal: 'ACT-FB-share-post-verbal-650.png'
                    }
                },
                700: {
                    background: 'background-middle-2',
                    banner1: 'summary-congrats-banner-700-1',
                    banner2: 'summary-congrats-banner-700-1',
                    shareUrlMap: {
                        math: 'ACT-FB-share-post-math-700.png',
                        verbal: 'ACT-FB-share-post-verbal-700.png'
                    }
                },
                750: {
                    background: 'background-highest',
                    banner1: 'summary-congrats-banner-750-1',
                    banner2: 'summary-congrats-banner-750-1',
                    shareUrlMap: {
                        math: 'ACT-FB-share-post-math-750.png',
                        verbal: 'ACT-FB-share-post-verbal-750.png'
                    }
                },
                improved: {
                    background: 'background-improved',
                    banner1: 'summary-congrats-banner-improved-1',
                    banner2: 'summary-congrats-banner-improved-2',
                    shareUrlMap: {
                        math: 'ACT-FB-share-post-math-improved.png',
                        verbal: 'ACT-FB-share-post-verbal-improved.png'
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
