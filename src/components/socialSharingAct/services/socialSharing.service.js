(function (angular) {
    'use strict';

    angular.module('znk.infra-act.socialSharingAct')
        .provider('SocialSharingSrv', function () {
            var _pointsConfig;

            this.setPoints = function (pointsConfig) {
                _pointsConfig = pointsConfig;
            };

            this.$get = function (EstimatedScoreSrv, $log, $q) {
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
            };
        });
})(angular);
