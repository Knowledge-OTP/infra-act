(function (angular) {
    'use strict';

    angular.module('znk.infra-act.performance', [
        'znk.infra-act.userGoals',
        'znk.infra.znkTimeline',
        'znk.infra.znkProgressBar'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.performance')
        .config(["TimelineSrvProvider", "SubjectEnumConst", function timelineConfig(TimelineSrvProvider, SubjectEnumConst) {
            'ngInject';
            var keys = {};

            keys[SubjectEnumConst.MATH] = '#75CBE8';
            keys[SubjectEnumConst.READING] = '#F9D41B';
            keys[SubjectEnumConst.WRITING] = '#FF5895';
            keys[SubjectEnumConst.ENGLISH] = '#AF89D2';
            keys[SubjectEnumConst.SCIENCE] = '#51CDBA';

            TimelineSrvProvider.setColors(keys);
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.performance')
        .controller('PerformanceTimelineController',
        ["EstimatedScoreSrv", "UserGoalsService", "SubjectEnum", "$q", "$attrs", "$element", "ExerciseTypeEnum", function (EstimatedScoreSrv, UserGoalsService, SubjectEnum, $q, $attrs, $element, ExerciseTypeEnum) {
            'ngInject';

            var vm = this;
            var estimatedScoresDataProm = EstimatedScoreSrv.getEstimatedScores();
            var getGoalsProm = UserGoalsService.getGoals();
            var inProgressProm = false;
            var subjectEnumToValMap = SubjectEnum.getEnumMap();
            var currentSubjectId;

            // options
            var optionsPerDevice = {
                width: 685,
                height: 150,
                distance: 90,
                upOrDown: 100,
                yUp: 30,
                yDown: 100
            };

            var subjectIdToIndexMap = {
                diagnostic: 'diagnostic'
            };
            subjectIdToIndexMap[ExerciseTypeEnum.TUTORIAL.enum] = 'tutorial';
            subjectIdToIndexMap[ExerciseTypeEnum.GAME.enum] = 'game';
            subjectIdToIndexMap[ExerciseTypeEnum.PRACTICE.enum] = 'practice';
            subjectIdToIndexMap[ExerciseTypeEnum.SECTION.enum] = 'section';

            function _getSummaryData(summeryScore) {
                var x = summeryScore.lineTo.x;
                var y = (summeryScore.lineTo.y < optionsPerDevice.upOrDown) ? summeryScore.lineTo.y + optionsPerDevice.yDown : summeryScore.lineTo.y - optionsPerDevice.yUp;
                var angleDeg;
                if (summeryScore.next) {
                    angleDeg = Math.atan2(summeryScore.lineTo.y - summeryScore.next.y, summeryScore.lineTo.x - summeryScore.next.x) * 180 / Math.PI;
                }

                if (angleDeg && angleDeg < -optionsPerDevice.upOrDown && summeryScore.lineTo.y < optionsPerDevice.upOrDown) {
                    x -= 30;
                }

                return {
                    x: x,
                    y: y,
                    score: summeryScore.score,
                    prevScore: summeryScore.prev.score
                };
            }

            function _getRegularData(lastLineObj) {
                var lastLine = lastLineObj[lastLineObj.length - 1];
                var beforeLast = lastLineObj[lastLineObj.length - 2];
                var x = lastLine.lineTo.x - 13;
                var y = (lastLine.lineTo.y < optionsPerDevice.upOrDown) ? lastLine.lineTo.y + optionsPerDevice.yDown : lastLine.lineTo.y - optionsPerDevice.yUp;
                var angleDeg = Math.atan2(lastLine.lineTo.y - beforeLast.lineTo.y, lastLine.lineTo.x - beforeLast.lineTo.x) * 180 / Math.PI;

                if (angleDeg < -40 || angleDeg > 40) {
                    x += 20;
                }

                return {
                    x: x,
                    y: y,
                    score: lastLine.score,
                    prevScore: beforeLast.score
                };
            }

            function _scrolling() {
                var domElement = $element.children()[0];
                if (domElement.scrollWidth > domElement.clientWidth) {
                    domElement.scrollLeft += domElement.scrollWidth - domElement.clientWidth;
                }
            }

            function _getPromsOrValue() {
                if (!inProgressProm) {
                    inProgressProm = $q.all([estimatedScoresDataProm, getGoalsProm]);
                }
                return (angular.isFunction(inProgressProm)) ? inProgressProm : $q.when(inProgressProm);
            }

            vm.options = {
                colorId: vm.currentSubjectId,
                isMobile: false,
                width: optionsPerDevice.width,
                height: optionsPerDevice.height,
                isSummery: (vm.activeExerciseId) ? vm.activeExerciseId : false,
                type: 'multi',
                isMax: true,
                max: 29,
                min: 0,
                subPoint: 35,
                distance: optionsPerDevice.distance,
                lineWidth: 2,
                numbers: {
                    font: '200 12px Lato',
                    fillStyle: '#4a4a4a'
                },
                onFinish: function (obj) {
                    var summeryScore = obj.data.summeryScore;
                    var scoreData;

                    if (summeryScore) {
                        scoreData = _getSummaryData(summeryScore);
                    } else {
                        scoreData = _getRegularData(obj.data.lastLine);
                    }

                    vm.timelineMinMaxStyle = { 'top': scoreData.y + 'px', 'left': scoreData.x + 'px' };

                    _getPromsOrValue().then(function (results) {
                        var userGoals = results[1];
                        var points = userGoals[subjectEnumToValMap[currentSubjectId]] - scoreData.score;
                        vm.goalPerSubject = scoreData.score;
                        vm.points = (points > 0) ? points : false;
                    });

                    if (scoreData.score && scoreData.prevScore) {
                        if (scoreData.score > scoreData.prevScore) {
                            vm.timelineLinePlus = '+' + (scoreData.score - scoreData.prevScore);
                            vm.isRed = false;
                        } else if (scoreData.score < scoreData.prevScore) {
                            vm.timelineLinePlus = '-' + (scoreData.prevScore - scoreData.score);
                            vm.isRed = true;
                        }
                        vm.onTimelineFinish({ subjectDelta: vm.timelineLinePlus });
                    }

                    _scrolling();

                    vm.toolTipArr = obj.data.lastLine.slice(1);
                }
            };

            function _extendData(dataPerSubject) {
                if (!vm.showTooltips) {
                    return addIconKey(dataPerSubject);
                }

                var newDataArr = [];
                var exerciseResults;
                angular.forEach(dataPerSubject, function (value, index) {
                    // add icon key
                    var type = subjectIdToIndexMap[value.exerciseType];
                    if (index === 0 && type === 'section') {
                        type = 'diagnostic';
                    }
                    value.iconKey = type || false;
                    // add workout name and title
                    if (vm.results && vm.results.exerciseResults) {
                        exerciseResults = vm.results.exerciseResults;
                        for (var i = 0, ii = exerciseResults.length; i < ii; i++) {
                            if (value.exerciseId === exerciseResults[i].exerciseId) {
                                value.workoutTitle = exerciseResults[i].exerciseName + ': ' + exerciseResults[i].exerciseDescription;
                                break;
                            }
                        }
                    }
                    newDataArr.push(value);
                });
                return newDataArr;
            }

            function addIconKey(dataPerSubject) {
                var newDataArr = [];
                angular.forEach(dataPerSubject, function (value, index) {
                    var type = subjectIdToIndexMap[value.exerciseType];
                    if (index === 0 && type === 'section') {
                        type = 'diagnostic';
                    }
                    value.iconKey = type || false;
                    newDataArr.push(value);
                });
                return newDataArr;
            }

            $attrs.$observe('subjectId', function (newVal, oldVal) {
                if (newVal === oldVal) {
                    return;
                }
                vm.currentSubjectId = newVal;
                _getPromsOrValue().then(function (results) {
                    inProgressProm = results;
                    var estimatedScoresData = results[0];
                    vm.animation = true;
                    vm.timelineLinePlus = false;
                    vm.timeLineData = {
                        data: _extendData(estimatedScoresData[vm.currentSubjectId]),
                        id: vm.currentSubjectId
                    };
                    vm.points = 0;
                });
            });
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.performance')
        .directive('performanceTimeline', function performanceTimelineDrv() {
                var directive = {
                    scope: {
                        onTimelineFinish: '&',
                        activeExerciseId: '=?',
                        showInduction: '<?',
                        showTooltips: '<?',
                        results: '<?'
                    },
                    restrict: 'E',
                    templateUrl: 'components/performance/directives/performanceTimeline/performanceTimeline.template.html',
                    controller: 'PerformanceTimelineController',
                    bindToController: true,
                    controllerAs: 'vm'
                };
                return directive;
            }
        );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.performance')
        .service('masteryLevel', ["$filter", function ($filter) {
            'ngInject';

            var translateFilter = $filter('translate');

            this.getMasteryLevel = function (levelProgress) {
                var masteryLevel = '';
                if (levelProgress < 30) {
                    masteryLevel = 'NOVICE';
                } else if (levelProgress >= 30 && levelProgress < 55) {
                    masteryLevel = 'AVERAGE';
                } else if (levelProgress >= 55 && levelProgress < 75) {
                    masteryLevel = 'ADVANCE';
                } else if (levelProgress >= 75 && levelProgress < 95) {
                    masteryLevel = 'EXPERT';
                } else if (levelProgress >= 95 && levelProgress <= 100) {
                    masteryLevel = 'MASTER';
                }
                return translateFilter('PERFORMANCE_ACT.MASTERY_LEVEL.' + masteryLevel);
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.performance')
        .service('PerformanceData', ["StatsSrv", "StatsQuerySrv", "CategoryService", "$q", "StatsLevelEnum", function (StatsSrv, StatsQuerySrv, CategoryService, $q, StatsLevelEnum) {
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
        }]);
})(angular);

angular.module('znk.infra-act.performance').run(['$templateCache', function ($templateCache) {
  $templateCache.put("components/performance/directives/performanceTimeline/performanceTimeline.template.html",
    "<div class=\"performance-timeline znk-scrollbar\" translate-namespace=\"PERFORMANCE_TIMELINE\">\n" +
    "    <div class=\"time-line-wrapper\">\n" +
    "        <div class=\"progress-val\" ng-style=\"vm.timelineMinMaxStyle\" ng-if=\"vm.timeLineData.data.length\">\n" +
    "            <div class=\"goal-wrapper\">{{vm.goalPerSubject}}\n" +
    "                <div class=\"timeline-plus\"\n" +
    "                     ng-if=\"vm.timelineLinePlus && vm.showInduction\"\n" +
    "                     ng-class=\"{ 'red-point': vm.isRed, 'green-point': !vm.isRed }\">\n" +
    "                    {{vm.timelineLinePlus}}\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"progress-title\"\n" +
    "                 ng-style=\"{ visibility: (vm.points) ? 'visiable' : 'hidden' }\"\n" +
    "                 translate=\".POINTS_LEFT\"\n" +
    "                 translate-values=\"{points: {{vm.points}} }\">\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"tool-tip-area\"\n" +
    "             ng-if=\"vm.showTooltips\"\n" +
    "             ng-repeat=\"tooltip in vm.toolTipArr track by $index\"\n" +
    "             ng-class=\"{'last-item':$last === true}\"\n" +
    "             ng-style=\"{'top': $last === true ? (tooltip.lineTo.y+50) +'px' : (tooltip.lineTo.y+60) +'px', 'left': $last === true ? (tooltip.lineTo.x - 11) +'px' : (tooltip.lineTo.x-1)+'px'}\">\n" +
    "            <md-tooltip md-direction=\"top\" class=\"tooltip-box md-whiteframe-2dp\">\n" +
    "                <div class=\"tooltip-content\">\n" +
    "                    <div class=\"exercise-date\">{{tooltip.time | date: 'MMM dd'}}</div>\n" +
    "                    <div class=\"exercise-title\">{{tooltip.workoutTitle}}</div>\n" +
    "                    <div class=\"score-title\" translate-values=\"{subjectName: vm.subjectEnumToValMap[vm.currentSubjectId]}\" translate=\".ESTIMATED_SUBJECT_SCORE\"></div>\n" +
    "                    <div class=\"exercise-score\">{{tooltip.score}}</div>\n" +
    "                </div>\n" +
    "            </md-tooltip>\n" +
    "        </div>\n" +
    "        <canvas znk-timeline timeline-data=\"vm.timeLineData\" timeline-settings=\"vm.options\"></canvas>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);
