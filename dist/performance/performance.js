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

            TimelineSrvProvider.setColors({
                [SubjectEnumConst.MATH]: '#75CBE8',
                [SubjectEnumConst.READING]: '#F9D41B',
                [SubjectEnumConst.WRITING]: '#FF5895',
                [SubjectEnumConst.ENGLISH]: '#AF89D2',
                [SubjectEnumConst.SCIENCE]: '#51CDBA'
            });
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.performance')
        .controller('PerformanceTimelineController',
            ["EstimatedScoreSrv", "UserGoalsService", "SubjectEnum", "$q", "$attrs", "$element", "ExerciseTypeEnum", function (EstimatedScoreSrv, UserGoalsService, SubjectEnum, $q, $attrs, $element, ExerciseTypeEnum) {
                'ngInject';

                var vm = this;
                var estimatedScoresDataProm = EstimatedScoreSrv.getEstimatedScoresData();
                var getGoalsProm = UserGoalsService.getGoals();
                var inProgressProm = false;
                var subjectEnumToValMap = SubjectEnum.getEnumMap();
                var currentSubjectId;

                // options
                var optionsPerDevice = {
                    width: 705,
                    height: 150,
                    distance: 90,
                    upOrDown: 100,
                    yUp: 30,
                    yDown: 100
                };

                var subjectIdToIndexMap = {
                    diagnostic: 'diagnostic'
                };
                subjectIdToIndexMap [ExerciseTypeEnum.TUTORIAL.enum] = 'tutorial';
                subjectIdToIndexMap [ExerciseTypeEnum.PRACTICE.enum] = 'practice';
                subjectIdToIndexMap [ExerciseTypeEnum.SECTION.enum] = 'section';

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

                        vm.timelineMinMaxStyle = {'top': scoreData.y + 'px', 'left': scoreData.x + 'px'};

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
                            vm.onTimelineFinish({subjectDelta: vm.timelineLinePlus});
                        }

                        _scrolling();
                    }
                };

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
                    currentSubjectId = newVal;
                    _getPromsOrValue().then(function (results) {
                        inProgressProm = results;
                        var estimatedScoresData = results[0];
                        vm.animation = true;
                        vm.timelineLinePlus = false;
                        vm.timeLineData = {
                            data: addIconKey(estimatedScoresData[currentSubjectId]),
                            id: currentSubjectId
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
                        activeExerciseId: '=?'
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
        .run(["$timeout", "$translatePartialLoader", function($timeout, $translatePartialLoader){
            'ngInject';

            $timeout(function(){
                $translatePartialLoader.addPart('performance');
            });
        }]);
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

(function(angular){
    'use strict';

    angular.module('znk.infra-act.performance')
        .service('PerformanceData', ["$q", "masteryLevel", "StatsSrv", "SubScoreSrv", "SubjectEnum", "TestScoreCategoryEnum", "CategoryService", function($q, masteryLevel, StatsSrv, SubScoreSrv, SubjectEnum, TestScoreCategoryEnum, CategoryService) {
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
        }]);
})(angular);

angular.module('znk.infra-act.performance').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/performance/directives/performanceTimeline/performanceTimeline.template.html",
    "<div class=\"performance-timeline znk-scrollbar\" translate-namespace=\"PERFORMANCE_TIMELINE\">\n" +
    "    <div class=\"time-line-wrapper\">\n" +
    "        <div class=\"progress-val\" ng-style=\"vm.timelineMinMaxStyle\" ng-if=\"vm.timeLineData.data.length\">\n" +
    "            <div class=\"goal-wrapper\">{{vm.goalPerSubject}}\n" +
    "                <div class=\"timeline-plus\"\n" +
    "                     ng-if=\"vm.timelineLinePlus\"\n" +
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
    "        <canvas znk-timeline timeline-data=\"vm.timeLineData\" timeline-settings=\"vm.options\"></canvas>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);
