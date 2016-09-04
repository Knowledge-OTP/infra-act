(function (angular) {
    'use strict';

    angular.module('znk.infra-act', [
        "znk.infra-act.auth",
"znk.infra-act.completeExerciseAct",
"znk.infra-act.configSat",
"znk.infra-act.examUtility",
"znk.infra-act.exerciseUtilityAct",
"znk.infra-act.performance",
"znk.infra-act.socialSharingAct",
"znk.infra-act.userGoals"
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.auth', [
        'firebase'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.auth')
        .service('AuthService', ["$window", "$firebaseAuth", "ENV", "$q", "$timeout", "$rootScope", "$http", "$log", "$injector", function ($window, $firebaseAuth, ENV, $q, $timeout, $rootScope, $http, $log, $injector) {
            'ngInject';

            var refAuthDB = new $window.Firebase(ENV.fbGlobalEndPoint, ENV.firebaseAppScopeName);
            var refDataDB = new $window.Firebase(ENV.fbDataEndPoint, ENV.firebaseAppScopeName);
            var fbAuth = $firebaseAuth(refAuthDB);

            var self = this;
            this.saveRegistration = function (registration, login) {
                var registerInProgress = true;
                var dfd = $q.defer();
                this.logout(true);

                var timeoutPromise = $timeout(function () {
                    if (registerInProgress) {
                        dfd.reject('timeout');
                    }
                }, ENV.promiseTimeOut);

                registration.profile = {};

                fbAuth.$createUser(registration).then(function () {
                    registerInProgress = false;
                    $timeout.cancel(timeoutPromise);

                    if (login) {
                        self.login({
                            email: registration.email,
                            password: registration.password
                        }).then(function (loginData) {
                            self.registerFirstLogin();
                            dfd.resolve(loginData);
                        }, function (err) {
                            dfd.reject(err);
                        });
                    } else {
                        dfd.resolve();
                    }
                }, function (error) {
                    $timeout.cancel(timeoutPromise);
                    dfd.reject(error);
                });
                return dfd.promise;
            };

            function _dataLogin() {
                var postUrl = ENV.backendEndpoint + 'firebase/token';
                var authData = refAuthDB.getAuth();
                var postData = {
                    email: authData.password ? authData.password.email : '',
                    uid: authData.uid,
                    fbDataEndPoint: ENV.fbDataEndPoint,
                    fbEndpoint: ENV.fbGlobalEndPoint,
                    auth: ENV.dataAuthSecret,
                    token: authData.token
                };

                return $http.post(postUrl, postData).then(function (token) {
                    var defer = $q.defer();
                    refDataDB.authWithCustomToken(token.data, function (error, userAuthData) {
                        if (error) {
                            defer.reject(error);
                        }
                        $log.debug('authSrv::login(): uid=' + userAuthData.uid);
                        defer.resolve(userAuthData);
                    });
                    return defer.promise;
                });
            }

            function _$onAuth(data) {
                var _loginAuthData = data;

                if (_loginAuthData) {
                    return _dataLogin(_loginAuthData).then(function () {
                        $rootScope.$broadcast('auth:login', _loginAuthData);
                    });
                }
                $rootScope.$broadcast('auth:logout');
                return $q.when();
            }

            this.login = function (loginData) {
                var deferred = $q.defer();

                fbAuth.$unauth();

                fbAuth.$authWithPassword(loginData).then(function (authData) {
                    $log.debug('authSrv::login(): uid=' + authData.uid);
                    _$onAuth(authData).then(function () {
                        deferred.resolve(authData);
                    });
                }).catch(function (err) {
                    self.logout();
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            this.logout = function () {
                $rootScope.$broadcast('auth:beforeLogout');
                fbAuth.$unauth();

                var actAuth = $firebaseAuth(refDataDB);
                actAuth.$unauth();
            };

            this.forgotPassword = function (forgotPasswordData) {
                return fbAuth.$resetPassword(forgotPasswordData);
            };

            this.changePassword = function (changePasswordData) {
                var authData = this.getAuth();
                if (authData && authData.password) {
                    changePasswordData.email = authData.password.email;
                    return fbAuth.$changePassword(changePasswordData);
                }
                return $q.reject();
            };

            this.getAuth = function () {
                return refAuthDB.getAuth();
            };

            this.createAuthWithCustomToken = function (refDB, token) {
                var deferred = $q.defer();
                refDB.authWithCustomToken(token, function (error, userData) {
                    if (error) {
                        deferred.reject(error);
                    }
                    $log.debug('createAuthWithCustomToken: uid=' + userData.uid);
                    deferred.resolve(userData);
                });
                return deferred.promise;
            };

            this.userDataForAuthAndDataFb = function (data) {
                var proms = [
                    this.createAuthWithCustomToken(refAuthDB, data.authToken),
                    this.createAuthWithCustomToken(refDataDB, data.dataToken)
                ];
                return $q.all(proms);
            };

            this.registerFirstLogin = function () {
                var ActStorageSrv = $injector.get('ActStorageSrv');
                var StorageSrv = $injector.get('StorageSrv');
                var firstLoginPath = 'firstLogin/' + StorageSrv.variables.uid;
                return ActStorageSrv.get(firstLoginPath).then(function (userFirstLoginTime) {
                    if (angular.equals(userFirstLoginTime, {})) {
                        ActStorageSrv.set(firstLoginPath, Date.now());
                    }
                });
            };
        }]);
})(angular);

angular.module('znk.infra-act.auth').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct', [
        'znk.infra-web-app.completeExercise',
        'znk.infra.znkExercise',
        'znk.infra.contentGetters',
        'znk.infra.estimatedScore',
        'znk.infra-act.exerciseUtilityAct',
        'znk.infra-act.examUtility',
        'znk.infra-act.socialSharingAct',
        'chart.js',
        'znk.infra-act.performance'
    ]);
})(angular);

(function () {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .config(["SvgIconSrvProvider", function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'correct-icon': 'components/completeExerciseAct/svg/correct-icon.svg',
                'wrong-icon': 'components/completeExerciseAct/svg/wrong-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);
})();


(function () {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .config(["QuestionTypesSrvProvider", "exerciseTypeConst", "CategoryServiceProvider", "TestScoreCategoryEnumProvider", function (QuestionTypesSrvProvider, exerciseTypeConst, CategoryServiceProvider, TestScoreCategoryEnumProvider) {
            'ngInject';

            function questionTypeGetter(question) {
                var templatesContants = {
                    SIMPLE_QUESTION: 0,
                    MATH_QUESTION: 1,
                    WRITING_SPECIFIC_PARAGRAPH: 2,
                    WRITING_FULL_PASSAGE: 3,
                    READING_QUESTION: 4,
                    ESSAY_QUESTION: 5,
                    LECTURE_QUESTION: 6
                };

                // lecture question or simple question.
                if ((angular.isDefined(question.exerciseTypeId) && question.exerciseTypeId === exerciseTypeConst.LECTURE) || (question.groupDataId === null && question.paragraph === null)) {
                    return question.exerciseTypeId === exerciseTypeConst.LECTURE ? templatesContants.LECTURE_QUESTION : templatesContants.SIMPLE_QUESTION;
                }

                var categoryService = CategoryServiceProvider.$get();
                var TestScoreCategoryEnum = TestScoreCategoryEnumProvider.$get();

                return categoryService.getCategoryLevel2Parent(question.categoryId).then(function (testScoreObj) {
                    switch (testScoreObj.id) {

                        case TestScoreCategoryEnum.MATH.enum:
                            return templatesContants.MATH_QUESTION;

                        case TestScoreCategoryEnum.WRITING.enum:
                            if (question.paragraph !== null && question.paragraph.length > 0) {
                                return templatesContants.WRITING_SPECIFIC_PARAGRAPH;
                            }
                            return templatesContants.WRITING_FULL_PASSAGE;

                        case TestScoreCategoryEnum.READING.enum:
                            return templatesContants.READING_QUESTION;

                        case TestScoreCategoryEnum.ESSAY.enum:
                            return templatesContants.ESSAY_QUESTION;

                        default:
                            return templatesContants.SIMPLE_QUESTION;
                    }
                });
            }

            QuestionTypesSrvProvider.setQuestionTypeGetter(questionTypeGetter);

            var map = {
                0: '<simple-question></simple-question>',
                1: '<math-question></math-question>',
                2: '<writing-specific-paragraph></writing-specific-paragraph>',
                3: '<writing-full-passage></writing-full-passage>',
                4: '<reading-question></reading-question>',
                5: '<essay-question></essay-question>',
                6: '<lecture-question></lecture-question>'
            };
            QuestionTypesSrvProvider.setQuestionTypesHtmlTemplate(map);
        }])
        .config(["ZnkExerciseSrvProvider", "exerciseTypeConst", function (ZnkExerciseSrvProvider, exerciseTypeConst) {
            'ngInject';

            var allowedTimeForQuestionByExercise = {};
            allowedTimeForQuestionByExercise[exerciseTypeConst.TUTORIAL] = 1.5 * 60 * 1000;
            allowedTimeForQuestionByExercise[exerciseTypeConst.DRILL] = 40 * 1000;
            allowedTimeForQuestionByExercise[exerciseTypeConst.PRACTICE] = 40 * 1000;
            ZnkExerciseSrvProvider.setAllowedTimeForQuestionMap(allowedTimeForQuestionByExercise);
        }]);
})();


(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('article',function articleDirective() {
            'ngInject';

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/article.template.html',
                scope: {
                    contentGetter: '&content',
                    deleteUnderScores: '&'
                },
                link: function(scope, element, attrs) {
                    function stringEndsWith(str, searchString) {
                        return str.indexOf(searchString, str.length - searchString.length) !== -1;
                    }

                    function injectLineNumbersToHtml(htmlString) {
                        var start = false;
                        var htmlParagraphs = htmlString.split(/<\s*p\s*>|<\s*p\s*\/\s*>/gi);
                        var j, i, ln = 0;
                        var res = '';
                        for (j = 0; j < htmlParagraphs.length; ++j) {
                            if (htmlParagraphs[j] === '') {
                                continue;
                            }

                            var htmlLines = htmlParagraphs[j].split(/<\s*br\s*>|<\s*br\s*\/\s*>/gi);
                            for (i = 0; i < htmlLines.length; ++i) {
                                if (htmlLines[i].match('_')) {
                                    htmlLines[i] = '<br><span class=\"indented-line\">' + htmlLines[i].replace('_', '') + '</span>';
                                    start = true;
                                }
                                if (!start) {
                                    continue;
                                }
                                ln += 1;
                                if (ln === 1 || ln % 5 === 0) {
                                    if (stringEndsWith(htmlLines[i], '</p>')) {
                                        var lastTagIndex = htmlLines[i].lastIndexOf('<');
                                        var lastTag = htmlLines[i].substr(lastTagIndex);
                                        var markupStart = htmlLines[i].substr(0, lastTagIndex);
                                        htmlLines[i] = markupStart + '<span class=\"num-article\">' + String(ln) + '</span>' + lastTag;
                                    } else {
                                        htmlLines[i] = htmlLines[i] + '<span class=\"num-article\">' + String(ln) + '</span>';
                                    }
                                }
                                htmlLines[i] = htmlLines[i] + '<br>';
                            }
                            res = res + '<p>' + htmlLines.join('') + '</p>';
                        }
                        return '<div class=\"wrap-num-article\">' + res + '</div>';
                    }

                    function arrayMarkups(contentArr) {
                        var markup = '';

                        angular.forEach(contentArr, function (item) {
                            if (item[attrs.markupField]) {
                                markup += item[attrs.markupField];
                            }
                        });

                        return markup;
                    }

                    var content = scope.contentGetter();

                    if (angular.isArray(content)) {
                        content = arrayMarkups(content);
                    }

                    if (content) {
                        content = content.replace(/font\-family: \'Lato Regular\';/g, 'font-family: Lato;font-weight: 400;');
                        if (scope.deleteUnderScores()) {
                            angular.element(element[0].querySelector('.article-content')).html(content.replace(/_/g, ''));
                        } else {
                            angular.element(element[0].querySelector('.article-content')).html(injectLineNumbersToHtml(content));
                        }
                    }
                }
            };

            return directive;
        });
})(angular);

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
        controller: ["CompleteExerciseSrv", "SubjectEnum", "$q", "StatsSrv", "CategoryService", "TestScoreCategoryEnum", "$filter", "masteryLevel", "SubScoreSrv", "PerformanceData", function (CompleteExerciseSrv, SubjectEnum, $q, StatsSrv, CategoryService, TestScoreCategoryEnum, $filter, masteryLevel, SubScoreSrv, PerformanceData) {
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
        }]
    });
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('customAnswerBuilderAct', ["ZnkExerciseViewModeEnum", "AnswerTypeEnum", function (ZnkExerciseViewModeEnum, AnswerTypeEnum) {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, ctrls) {
                    var questionBuilderCtrl = ctrls[0];
                    var ngModelCtrl = ctrls[1];
                    var viewMode = questionBuilderCtrl.getViewMode();
                    var question = questionBuilderCtrl.question;

                    scope.d = {};
                    var isFreeTextAnswer = question.answerTypeId === AnswerTypeEnum.FREE_TEXT_ANSWER.enum;
                    var isAnswerWithResultMode = viewMode === ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum;
                    var isReviewMode = viewMode === ZnkExerciseViewModeEnum.REVIEW.enum;
                    var isUserNotAnswered = angular.isUndefined(ngModelCtrl.$viewValue);
                    if (isFreeTextAnswer && isUserNotAnswered && !isReviewMode) {
                        scope.d.showFreeTextInstructions = true;
                        if (isAnswerWithResultMode) {
                            ngModelCtrl.$viewChangeListeners.push(function () {
                                scope.d.showFreeTextInstructions = false;
                            });
                        }
                    }
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/customAnswerBuilderAct.template.html',
                restrict: 'E',
                require: ['^questionBuilder', '^ngModel'],
                scope: {},
                compile: compileFn
            };

            return directive;
        }]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('essayQuestion', function essayQuestionDirective() {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    scope.vm = {
                        question: questionBuilderCtrl.question
                    };

                    var questionContainerDomElement = angular.element(element[0].querySelector('.question-container'));
                    var paragraphArray = questionBuilderCtrl.question.groupData.paragraphs;

                    for (var i = 0; i < paragraphArray.length; i++) {
                        questionContainerDomElement.append(paragraphArray[i].body.replace(/_/g, ''));
                    }

                    angular.element(element[0].querySelector('.question-content')).append(questionBuilderCtrl.question.content);
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/essayQuestion.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);





(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('freeTextAnswer', ["ZnkExerciseViewModeEnum", "$timeout", function (ZnkExerciseViewModeEnum, $timeout) {
            'ngInject';

            return {
                templateUrl: 'components/completeExerciseAct/templates/freeTextAnswer.template.html',
                require: ['^ngModel', '^answerBuilder'],
                scope: {},
                link: function (scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0];
                    var answerBuilderCtrl = ctrls[1];
                    var userAnswerValidation = /^[0-9\/\.]{0,4}$/;

                    scope.d = {};

                    scope.d.userAnswer = '';  // stores the current userAnswer
                    scope.d.userAnswerGetterSetter = function (newUserAnswer) {
                        if (arguments.length && _isAnswerValid(newUserAnswer)) {
                            scope.d.userAnswer = newUserAnswer;
                            return scope.d.userAnswer;
                        }
                        return scope.d.userAnswer;
                    };

                    function _isAnswerValid(answerToCheck) {
                        return userAnswerValidation.test(answerToCheck);
                    }

                    var MODE_ANSWER_ONLY = ZnkExerciseViewModeEnum.ONLY_ANSWER.enum,
                        MODE_REVIEW = ZnkExerciseViewModeEnum.REVIEW.enum,
                        MODE_MUST_ANSWER = ZnkExerciseViewModeEnum.MUST_ANSWER.enum;

                    scope.clickHandler = function () {
                        ngModelCtrl.$setViewValue(scope.d.userAnswer);
                        updateViewByCorrectAnswers(scope.d.userAnswer);
                    };

                    function updateViewByCorrectAnswers(userAnswer) {
                        var correctAnswers = answerBuilderCtrl.question.correctAnswerText;
                        var viewMode = answerBuilderCtrl.getViewMode();
                        scope.correctAnswer = correctAnswers[0].content;

                        if (viewMode === MODE_ANSWER_ONLY || viewMode === MODE_MUST_ANSWER) {
                            scope.d.userAnswer = angular.isDefined(userAnswer) ? userAnswer : '';
                            scope.showCorrectAnswer = false;
                        } else {
                            if (angular.isUndefined(userAnswer)) {
                                // unanswered question
                                scope.userAnswerStatus = 'neutral';
                                scope.showCorrectAnswer = viewMode === MODE_REVIEW;
                            } else {
                                if (_isAnsweredCorrectly(userAnswer, correctAnswers)) {
                                    scope.userAnswerStatus = 'correct';
                                } else {
                                    scope.userAnswerStatus = 'wrong';
                                }
                                scope.showCorrectAnswer = true;
                                scope.d.userAnswer = userAnswer;
                            }
                        }
                    }

                    function _isAnsweredCorrectly(userAnswer, correctAnswers) {
                        for (var i = 0; i < correctAnswers.length; i++) {
                            if (userAnswer === correctAnswers[i].content) {
                                return true;
                            }
                        }
                        return false;
                    }

                    ngModelCtrl.$render = function () {
                        //  skip one digest cycle in order to let the answers time to be compiled
                        $timeout(function () {
                            updateViewByCorrectAnswers(ngModelCtrl.$viewValue);
                        });
                    };

                    ngModelCtrl.$render();
                }
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('imageZoomer', ["$timeout", "$mdDialog", "$document", "$compile", function ($timeout, $mdDialog, $document, $compile) {
            'ngInject';

            function compileFn() {
                function preFn(scope, element) {
                    var MAX_WIDTH = 400;
                    var MAX_HEIGHT = 500;
                    var MIN_SIZE_TO_ZOOM = 200;
                    var zoomableImgElemArr = [];

                    $timeout(function () {
                        var imageElements = element[0].querySelectorAll('img');

                        angular.forEach(imageElements, function (imgElement) {
                            var clickableIconElement = addIconToImage(imgElement);
                            var clickableImageElement = imgElement;
                            addImageHandler(clickableIconElement, imgElement);  // clickable icon
                            addImageHandler(clickableImageElement, imgElement); // clickable image
                        });
                    });


                    function addImageHandler(imgElement, image) {
                        if (_shouldImageBeZoomed(image)) {
                            return;
                        }
                        if (_getImageWidth(image) > 400) {
                            image.style.width = MAX_WIDTH + 'px';
                            image.style.height = 'auto';
                        }
                        image.className = 'img-to-zoom';
                        angular.element(imgElement).on('click', function () {
                            zoomImage(image);
                        });
                        zoomableImgElemArr.push(imgElement);
                    }

                    function zoomImage(image) {
                        DialogController.$inject = ["$scope"];
                        function DialogController($scope) {
                            $scope.closeDialog = function () {
                                $mdDialog.hide();
                            };
                        }

                        var parentEl = angular.element($document.body);
                        $mdDialog.show({
                            clickOutsideToClose: true,
                            parent: parentEl,
                            template: '<div class="zoom-image-modal">' +
                            '<svg-icon ng-click="closeDialog()" name="close-popup"></svg-icon>' +
                            '<md-dialog ng-click="closeDialog()">' +
                            '<md-dialog-content>' +
                            '<img src="' + image.src + '" style="width:' + image.width * 2 + 'px; ' + 'height:' + image.height * 2 + 'px">' +
                            '</md-dialog-content>' +
                            '</md-dialog>' +
                            '</div>',
                            controller: DialogController
                        });
                    }

                    function addIconToImage(image) {
                        if (_shouldImageBeZoomed(image)) {
                            return image;
                        }

                        if (_getImageWidth(image) > MAX_WIDTH) {
                            image.style.width = MAX_WIDTH + 'px';
                            image.style.height = 'auto';
                        }
                        var imageParent = angular.element(image.parentNode);
                        var imageNewParent = angular.element('<div class="zoomable-image-with-icon"></div>');   // wrap img and icon with one div element
                        imageNewParent.css('position', 'relative');
                        imageNewParent.css('margin', '0 auto');
                        imageNewParent.css('textAlign', 'center');
                        imageNewParent.css('width', image.style.width);
                        imageNewParent.css('height', image.style.height);
                        imageNewParent.append(image);
                        imageParent.append(imageNewParent);

                        var svgIconTemplate = '<div class="zoom-icon-wrapper">' +
                            '<svg-icon name="full-screen-icon"></svg-icon>' +
                            '</div>';

                        imageNewParent.append(svgIconTemplate);
                        var iconElement = imageNewParent[0].querySelector('.zoom-icon-wrapper');
                        $compile(iconElement)(scope);
                        return iconElement;
                    }

                    function _shouldImageBeZoomed(image) {
                        return image.style.width === null || _getImageWidth(image) < MIN_SIZE_TO_ZOOM || _getImageHeight(image) < MIN_SIZE_TO_ZOOM || _getImageHeight(image) > MAX_HEIGHT;
                    }

                    function _getImageWidth(image) {
                        return + image.style.width.replace('px', '');
                    }

                    function _getImageHeight(image) {
                        var width = _getImageWidth(image);
                        var height = +image.style.height.replace('px', '');
                        return width > MAX_WIDTH ? (height * MAX_WIDTH) / width : height;
                    }

                    scope.$on('$destroy', function () {
                        for (var i = 0; i < zoomableImgElemArr.length; i++) {
                            angular.element(zoomableImgElemArr[i]).off('click');
                        }
                        zoomableImgElemArr = [];
                    });
                }

                return {
                    post: preFn
                };
            }

            var directive = {
                priority: -1000,
                restrict: 'A',
                scope: {},
                compile: compileFn
            };

            return directive;
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('lectureQuestion', function () {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    scope.vm = {
                        question: questionBuilderCtrl.question
                    };
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/lectureQuestion.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('mathQuestion', function () {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    var content = questionBuilderCtrl.question.content;
                    var answerContentElement = angular.element(element[0].querySelector('.answer-content'));
                    answerContentElement.append(content);

                    var questionContainerElement = angular.element(element[0].querySelector('.question-container'));
                    var paragraphsArray = questionBuilderCtrl.question.groupData.paragraphs;
                    for (var i = 0; i < paragraphsArray.length; i++) {
                        questionContainerElement.append(paragraphsArray[i].body);
                    }
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/mathQuestion.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('rateAnswer', ["ZnkExerciseViewModeEnum", function (ZnkExerciseViewModeEnum) {
            'ngInject';

            return {
                templateUrl: 'components/completeExerciseAct/templates/rateAnswer.template.html',
                require: ['^answerBuilder', '^ngModel'],
                scope: {},
                link: function link(scope, element, attrs, ctrls) {
                    var domElement = element[0];

                    var answerBuilder = ctrls[0];
                    var ngModelCtrl = ctrls[1];

                    var viewMode = answerBuilder.getViewMode();
                    var ANSWER_WITH_RESULT_MODE = ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum,
                        REVIEW_MODE = ZnkExerciseViewModeEnum.REVIEW.enum;
                    var INDEX_OFFSET = 2;

                    scope.d = {};
                    scope.d.itemsArray = new Array(11);
                    var answers = answerBuilder.question.correctAnswerText;

                    var domItemsArray;

                    var destroyWatcher = scope.$watch(
                        function () {
                            return element[0].querySelectorAll('.item-repeater');
                        },
                        function (val) {
                            if (val) {
                                destroyWatcher();
                                domItemsArray = val;

                                if (viewMode === REVIEW_MODE) {
                                    scope.clickHandler = angular.noop;
                                    updateItemsByCorrectAnswers(scope.d.answers);
                                } else {
                                    scope.clickHandler = clickHandler;
                                }

                                ngModelCtrl.$render = function () {
                                    updateItemsByCorrectAnswers();
                                };
                                ngModelCtrl.$render();
                            }
                        }
                    );

                    function clickHandler(index) {
                        if (answerBuilder.canUserAnswerBeChanged()) {
                            return;
                        }

                        ngModelCtrl.$setViewValue(index);
                        updateItemsByCorrectAnswers();
                    }

                    function updateItemsByCorrectAnswers() {
                        var oldSelectedElement = angular.element(domElement.querySelector('.selected'));
                        oldSelectedElement.removeClass('selected');

                        var selectedAnswerId = ngModelCtrl.$viewValue;

                        var newSelectedElement = angular.element(domItemsArray[selectedAnswerId]);
                        newSelectedElement.addClass('selected');

                        var lastElemIndex = answers.length - 1;

                        if ((viewMode === ANSWER_WITH_RESULT_MODE && angular.isNumber(selectedAnswerId)) || viewMode === REVIEW_MODE) {
                            for (var i = 0; i < lastElemIndex; i++) {
                                angular.element(domItemsArray[answers[i].id - INDEX_OFFSET]).addClass('correct');
                            }
                            angular.element(domItemsArray[answers[lastElemIndex].id - INDEX_OFFSET]).addClass('correct-edge');
                        }

                        if (angular.isNumber(selectedAnswerId) && (viewMode === REVIEW_MODE || viewMode === ANSWER_WITH_RESULT_MODE)) {
                            if (selectedAnswerId >= answers[0].id - INDEX_OFFSET && selectedAnswerId <= answers[lastElemIndex].id - INDEX_OFFSET) {
                                angular.element(domItemsArray[selectedAnswerId]).addClass('selected-correct');
                            } else {
                                angular.element(domItemsArray[selectedAnswerId]).addClass('selected-wrong');
                            }
                        }
                    }
                }
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('readingQuestion', ["articleSrv", function (articleSrv) {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    scope.vm = {
                        question: questionBuilderCtrl.question
                    };

                    var content = articleSrv.numberLines(questionBuilderCtrl.question.groupData.paragraphs);
                    content = content.replace(/font-family:Lato Light;/g, 'font-family: Lato;font-weight: 300;');
                    var articleLinesElement = angular.element('<div class=\"wrap-num-article\"></div>');
                    var articleContentElement = angular.element(element[0].querySelector('.article-content'));
                    // content.replace(/font\-family:\'Lato Light\';/g, 'font-family: Lato;font-weight: 400;');

                    articleLinesElement.append(content);
                    articleContentElement.append(articleLinesElement);

                    angular.element(element[0].querySelector('.paragraph-title')).append(questionBuilderCtrl.question.paragraphTitle);
                    angular.element(element[0].querySelector('.question-content')).append(questionBuilderCtrl.question.content);
                    scope.vm.passageTitle = scope.vm.question.passageTitle;
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/readingQuestion.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('selectAnswer', ["$timeout", "ZnkExerciseViewModeEnum", "ZnkExerciseAnswersSrv", "ZnkExerciseEvents", "$document", function ($timeout, ZnkExerciseViewModeEnum, ZnkExerciseAnswersSrv, ZnkExerciseEvents, $document) {
            'ngInject';

            return {
                templateUrl: 'components/completeExerciseAct/templates/selectAnswer.template.html',
                require: ['^answerBuilder', '^ngModel'],
                restrict: 'E',
                scope: {},
                link: function (scope, element, attrs, ctrls) {
                    var answerBuilder = ctrls[0];
                    var ngModelCtrl = ctrls[1];
                    var questionIndex = answerBuilder.question.__questionStatus.index;
                    var currentSlide = answerBuilder.getCurrentIndex();    // current question/slide in the viewport
                    var body = $document[0].body;


                    var MODE_ANSWER_WITH_QUESTION = ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum,
                        MODE_ANSWER_ONLY = ZnkExerciseViewModeEnum.ONLY_ANSWER.enum,
                        MODE_REVIEW = ZnkExerciseViewModeEnum.REVIEW.enum,
                        MODE_MUST_ANSWER = ZnkExerciseViewModeEnum.MUST_ANSWER.enum;
                    var keyMap = {};

                    scope.d = {};

                    scope.d.answers = answerBuilder.question.answers;

                    scope.d.click = function (answer) {
                        var viewMode = answerBuilder.getViewMode();
                        if ((!isNaN(parseInt(ngModelCtrl.$viewValue, 10)) && viewMode === MODE_ANSWER_WITH_QUESTION) || viewMode === MODE_REVIEW) {
                            return;
                        }
                        ngModelCtrl.$setViewValue(answer.id);
                        updateAnswersFollowingSelection(viewMode);
                    };

                    function keyboardHandler(key) {
                        key = String.fromCharCode(key.keyCode).toUpperCase();
                        if (angular.isDefined(keyMap[key])) {
                            scope.d.click(scope.d.answers[keyMap[key]]);
                        }
                    }

                    if (questionIndex === currentSlide) {
                        body.addEventListener('keydown', keyboardHandler);
                    }

                    scope.$on(ZnkExerciseEvents.QUESTION_CHANGED, function (event, value, prevValue, currQuestion) {
                        var _currentSlide = currQuestion.__questionStatus.index;
                        if (questionIndex !== _currentSlide) {
                            body.removeEventListener('keydown', keyboardHandler);
                        } else {
                            body.addEventListener('keydown', keyboardHandler);
                        }
                    });


                    scope.d.getIndexChar = function (answerIndex) {
                        var key = ZnkExerciseAnswersSrv.selectAnswer.getAnswerIndex(answerIndex, answerBuilder.question);
                        keyMap[key] = answerIndex;
                        return key;
                    };

                    function updateAnswersFollowingSelection() {
                        var selectedAnswerId = ngModelCtrl.$viewValue;
                        var correctAnswerId = answerBuilder.question.correctAnswerId;
                        var $answers = angular.element(element[0].querySelectorAll('.answer'));
                        for (var i = 0; i < $answers.length; i++) {
                            var $answerElem = angular.element($answers[i]);
                            if (!$answerElem || !$answerElem.scope || !$answerElem.scope()) {
                                continue;
                            }

                            var answer = $answerElem.scope().answer;
                            var classToAdd,
                                classToRemove;

                            if (answerBuilder.getViewMode() === MODE_ANSWER_ONLY || answerBuilder.getViewMode() === MODE_MUST_ANSWER) {
                                // dont show correct / wrong indication
                                classToRemove = 'answered';
                                classToAdd = selectedAnswerId === answer.id ? 'answered' : 'neutral';
                            } else {
                                // the rest of the optional states involve correct / wrong indications
                                if (angular.isUndefined(selectedAnswerId)) {
                                    // unanswered question
                                    if (answerBuilder.getViewMode() === MODE_REVIEW) {
                                        classToAdd = correctAnswerId === answer.id ? 'answered-incorrect' : 'neutral';
                                    }
                                } else if (selectedAnswerId === answer.id) {
                                    // this is the selected answer
                                    classToAdd = correctAnswerId === answer.id ? 'correct' : 'wrong';
                                } else {
                                    // this is the correct answer but the user didn't select it
                                    classToAdd = answer.id === correctAnswerId ? 'answered-incorrect' : 'neutral';
                                }
                            }
                            $answerElem.removeClass(classToRemove);
                            $answerElem.addClass(classToAdd);
                        }
                    }

                    ngModelCtrl.$render = function () {
                        //  skip one digest cycle in order to let the answers time to be compiled
                        $timeout(function () {
                            updateAnswersFollowingSelection();
                        });
                    };
                    //  ng model controller render function not triggered in case render function was set
                    //  after the model value was changed
                    ngModelCtrl.$render();

                    scope.$on('exercise:viewModeChanged', function () {
                        ngModelCtrl.$render();
                    });

                    scope.$on('$destroy', function () {
                        body.removeEventListener('keydown', keyboardHandler);
                    });
                }
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('simpleQuestion', function simpleQuestionDirective() {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    var content = questionBuilderCtrl.question.content.replace(/_/g, '');
                    var questionContentElement = angular.element(element[0].querySelector('.question-content'));
                    questionContentElement.append(content);
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/simpleQuestion.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .controller('SocialSharingController',
            ["SocialSharingSrv", "$filter", "SubjectEnum", "ENV", "$window", function (SocialSharingSrv, $filter, SubjectEnum, ENV, $window) {
                'ngInject';

                var self = this;
                var translateFilter = $filter('translate');
                self.showSocialArea = false;

                var subjectMap = {};
                subjectMap[SubjectEnum.MATH.enum] = 'math';
                subjectMap[SubjectEnum.VERBAL.enum] = 'verbal';

                // return if subjectId is in excludeArr
                if (self.excludeArr && angular.isArray(self.excludeArr)) {
                    for (var i = 0, ii = self.excludeArr.length; i < ii; i++) {
                        if (self.subjectId === self.excludeArr[i]) {
                            return;
                        }
                    }
                }

                SocialSharingSrv.getSharingData(self.subjectId).then(function (sharingData) {
                    self.showSocialArea = sharingData;

                    if (sharingData) {
                        self.subjectName = subjectMap[self.subjectId];
                        var image = $window.location.protocol + ENV.zinkerzWebsiteBaseUrl + 'wp-content/themes/salient-child/images/share/' + sharingData.shareUrlMap[self.subjectName];
                        var descriptionTranslate = sharingData.isImproved ? 'IMPROVED_TEXT' : 'SHARE_DESCRIPTION';
                        var description = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.' + descriptionTranslate, {
                            pts: sharingData.points,
                            subjectName: self.subjectName
                        });
                        var title = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.SHARE_TITLE');
                        var caption = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.SHARE_CAPTION');
                        var url = ENV.zinkezWebsiteUrl;
                        var ogPrefix = 'og:';
                        var twitterPrefix = 'twitter:';


                        self.shareData = {
                            facebook: {
                                type: 'facebook',
                                facebookurl: url,
                                facebooktitle: title
                            }
                        };
                        self.shareData.facebook[ogPrefix + 'image'] = image;
                        self.shareData.facebook[ogPrefix + 'image:width'] = 484;
                        self.shareData.facebook[ogPrefix + 'image:height'] = 252;
                        self.shareData.facebook[ogPrefix + 'title'] = title;
                        self.shareData.facebook[ogPrefix + 'caption'] = caption;
                        self.shareData.facebook[ogPrefix + 'description'] = description;
                        self.shareData.facebook['fb:app_id'] = ENV.facebookAppId;

                        self.shareData.google = {
                            type: 'google',
                            url: url,
                            title: title,
                            description: description,
                            image: image
                        };


                        self.shareData.google [ogPrefix + 'image'] = image;
                        self.shareData.google [ogPrefix + 'image:width'] = 484;
                        self.shareData.google [ogPrefix + 'image:height'] = 252;
                        self.shareData.google [ogPrefix + 'title'] = title;
                        self.shareData.google [ogPrefix + 'description'] = description;
                        self.shareData.google [ogPrefix + 'url'] = url;

                        self.shareData.twitter = {
                            type: 'twitter',
                            description: description,
                            url: url,
                            title: title
                        };
                        self.shareData.twitter[twitterPrefix + 'card'] = 'summary_large_image';
                        self.shareData.twitter[twitterPrefix + 'description'] = description;
                        self.shareData.twitter[twitterPrefix + 'site'] = '@oded300';
                        self.shareData.twitter[twitterPrefix + 'title'] = title;
                        self.shareData.twitter[twitterPrefix + 'image'] = image;
                        self.shareData.twitter[twitterPrefix + 'url'] = url;
                    }
                });
            }]);
})(angular);

(function(angular){
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('socialSharing',function(){
            'ngInject';

            var directive = {
                scope: {
                    subjectId: '=',
                    excludeArr: '=?',
                    animate: '=?'
                },
                restrict: 'E',
                templateUrl: 'components/completeExerciseAct/directives/socialSharing/socialSharing.template.html',
                controller: 'SocialSharingController',
                bindToController: true,
                controllerAs: 'vm'
            };

            return directive;
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('writingFullPassage', function () {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    scope.vm = {
                        question: questionBuilderCtrl.question
                    };

                    var paragraphArray = questionBuilderCtrl.question.groupData.paragraphs;
                    var paragraphTitleDomElement = angular.element(element[0].querySelector('.paragraph-title'));
                    var questionContainerDomElement = angular.element(element[0].querySelector('.question-content'));
                    var paragraphsWrapperDomElement = angular.element(element[0].querySelector('.paragraphs-wrapper'));

                    paragraphTitleDomElement.append(questionBuilderCtrl.question.groupData.name);
                    questionContainerDomElement.append(questionBuilderCtrl.question.content);

                    for (var i = 0; i < paragraphArray.length; i++) {
                        var paragraphNumber = i + 1;
                        var paragrphTitleTempalte = '<div class="paragraph-number-title"> [ ' + paragraphNumber + ' ] </div>'; // paragraph title
                        paragraphsWrapperDomElement.append(paragrphTitleTempalte);

                        var paragraphElement = angular.element('<div class="paragraph"></div>');

                        paragraphElement.append(paragraphArray[i].body.replace(/_/g, ''));       // paragraph content
                        paragraphsWrapperDomElement.append(paragraphElement);
                    }
                }

                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/writingFullPassage.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('writingSpecificParagraph', function () {
            'ngInject';

            function compileFn() {
                function preFn(scope, element, attrs, questionBuilderCtrl) {
                    scope.vm = {
                        question: questionBuilderCtrl.question,
                        SPECIFIC_PARAGRAPH: 1,
                        FULL_PASSAGE: 2
                    };
                    scope.vm.view = scope.vm.SPECIFIC_PARAGRAPH;

                    var paragraph = questionBuilderCtrl.question.paragraph.replace(/_/g, '');
                    var paragraphDomElement = angular.element(element[0].querySelector('.paragraph'));
                    var paragraphTitleDomElement = angular.element(element[0].querySelector('.paragraph-title'));
                    var questionContentDomElement = angular.element(element[0].querySelector('.question-content'));

                    paragraphDomElement.append(paragraph);
                    paragraphTitleDomElement.append(questionBuilderCtrl.question.paragraphTitle);
                    questionContentDomElement.append(questionBuilderCtrl.question.content);
                    var paragraphsArray = scope.vm.question.groupData.paragraphs;
                    var fullPassageElement = angular.element(element[0].querySelector('.full-passage'));
                    for (var i = 0; i < paragraphsArray.length; i++) {
                        fullPassageElement.append('<div class="paragraph-number-title">[' + (i + 1) + ']</div>');
                        fullPassageElement.append(paragraphsArray[i].body);
                    }
                }
                return {
                    pre: preFn
                };
            }

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/writingSpecificParagraph.template.html',
                restrict: 'E',
                require: '^questionBuilder',
                scope: {},
                compile: compileFn
            };

            return directive;
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .run(["$timeout", "$translatePartialLoader", function($timeout, $translatePartialLoader){
            'ngInject';

            $timeout(function(){
                $translatePartialLoader.addPart('completeExerciseAct');
            });
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .service('articleSrv',function () {
            'ngInject';

            this.numberLines = function (content) {
                if (angular.isArray(content)) {
                    content = _arrayMarkups(content);
                }
                content = content.replace(/font\-family: \'Lato Regular\';/g, 'font-family: Lato;font-weight: 400;');

                var start = false;
                var htmlParagraphs = content.split(/<\s*p\s*>|<\s*p\s*\/\s*>/gi);
                var j, i, ln = 0;
                var res = '';
                for (j = 0; j < htmlParagraphs.length; ++j) {
                    if (htmlParagraphs[j] === '') {
                        continue;
                    }

                    var htmlLines = htmlParagraphs[j].split(/<\s*br\s*>|<\s*br\s*\/\s*>/gi);
                    for (i = 0; i < htmlLines.length; ++i) {
                        if (htmlLines[i].match('_')) {
                            htmlLines[i] = '<br><span class=\"indented-line\">' + htmlLines[i].replace('_', '') + '</span>';
                            start = true;
                        }
                        if (!start) {
                            continue;
                        }
                        if (htmlLines[i].match('#')) {
                            htmlLines[i] = htmlLines[i].replace('#', '');
                            continue;
                        }
                        ln += 1;
                        if (ln === 1 || ln % 5 === 0) {
                            if (_stringEndsWith(htmlLines[i], '</p>')) {
                                var lastTagIndex = htmlLines[i].lastIndexOf('<');
                                var lastTag = htmlLines[i].substr(lastTagIndex);
                                var markupStart = htmlLines[i].substr(0, lastTagIndex);
                                htmlLines[i] = markupStart + '<span class=\"num-article\">' + String(ln) + '</span>' + lastTag;
                            } else {
                                htmlLines[i] = htmlLines[i] + '<span class=\"num-article\">' + String(ln) + '</span>';
                            }
                        }
                        htmlLines[i] = htmlLines[i] + '<br>';
                    }
                    res = res + '<p>' + htmlLines.join('') + '</p>';
                }
                return res;
            };

            function _arrayMarkups(contentArr) {
                var markup = '';

                angular.forEach(contentArr, function (item) {
                    if (item.body) {
                        markup += item.body;
                    }
                });

                return markup;
            }

            function _stringEndsWith(str, searchString) {
                return str.indexOf(searchString, str.length - searchString.length) !== -1;
            }
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .service('completeExerciseActSrv', ["$q", "$log", "ExerciseTypeEnum", "ExerciseResultSrv", "ExamSrv", function ($q, $log, ExerciseTypeEnum, ExerciseResultSrv, ExamSrv) {
            'ngInject';

            this.mergedTestScoresIfCompleted = function (exam, examResult, questionsData, resultsData) {
                if (!exam || !questionsData || !resultsData || !examResult) {
                    var errMsg = 'completeExerciseActSrv combinedSections:' +
                        'one or more of the arguments is missing!';
                    $log.error(errMsg, 'arguments:', arguments);
                    return $q.reject(errMsg);
                }
                resultsData = angular.copy(resultsData);
                questionsData = angular.copy(questionsData);
                var examId = exam.id;
                var subjectId = questionsData.subjectId;
                var currentSectionId = questionsData.id;
                var sectionResults = examResult.sectionResults;
                var sectionProms = [];
                var getOtherSections = exam.sections.filter(function (section) {
                    return section.subjectId === subjectId && currentSectionId !== section.id;
                });
                angular.forEach(getOtherSections, function (sectionBySubject) {
                    var sectionKey = sectionResults[sectionBySubject.id];
                    if (sectionKey) {
                        var exerciseResultProm = ExerciseResultSrv.getExerciseResult(ExerciseTypeEnum.SECTION.enum, sectionBySubject.id, examId, null, true);
                        var examSectionProm = ExamSrv.getExamSection(sectionBySubject.id);
                        sectionProms.push(exerciseResultProm);
                        sectionProms.push(examSectionProm);
                    }
                });
                if (sectionProms.length === 0) {
                    return $q.when(false);
                }
                return $q.all(sectionProms).then(function (results) {
                    var lengthResults = 0;
                    angular.forEach(results, function (result, index) {
                        if (result.isComplete) {
                            questionsData.questions = questionsData.questions.concat(results[index + 1].questions);
                            resultsData.questionResults = resultsData.questionResults.concat(result.questionResults);
                            lengthResults += 2;
                        }
                    });
                    if (results.length !== lengthResults) {
                        return $q.when(false);
                    }
                    return {
                        questionsData: questionsData,
                        resultsData: resultsData
                    };
                });
            };
        }]);
})(angular);

angular.module('znk.infra-act.completeExerciseAct').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/completeExerciseAct/directives/completeExerciseSummary/completeExerciseSummaryDirective.template.html",
    "<div class=\"base-complete-exercise-container\"\n" +
    "     translate-namespace=\"COMPLETE_EXERCISE_ACT.COMPLETE_EXERCISE_SUMMARY\"\n" +
    "     subject-id-to-attr-drv=\"$ctrl.currentSubjectId\"\n" +
    "     ng-class=\"{\n" +
    "        'workout-summary-wrapper-essay': $ctrl.isEssaySubject\n" +
    "     }\">\n" +
    "    <complete-exercise-header></complete-exercise-header>\n" +
    "    <social-sharing\n" +
    "        subject-id=\"::$ctrl.exerciseContent.subjectId\"\n" +
    "        animate=\"true\">\n" +
    "    </social-sharing>\n" +
    "    <section>\n" +
    "        <div class=\"test-score-title\">{{::$ctrl.testScoreTitle}}</div>\n" +
    "        <div class=\"gauge-row-wrapper\">\n" +
    "            <div class=\"overflowWrap\">\n" +
    "                <div class=\"gauge-wrap\">\n" +
    "                    <div class=\"gauge-inner-text\">{{::$ctrl.performanceChart.successRate}}%\n" +
    "                        <div class=\"success-title\" translate=\".SUCCESS\"></div>\n" +
    "                    </div>\n" +
    "                    <canvas width=\"134\"\n" +
    "                            height=\"134\"\n" +
    "                            id=\"doughnut\"\n" +
    "                            class=\"chart chart-doughnut\"\n" +
    "                            chart-options=\"$ctrl.performanceChart.gaugeSettings.options\"\n" +
    "                            chart-colours=\"$ctrl.performanceChart.gaugeSettings.colours\"\n" +
    "                            chart-data=\"$ctrl.performanceChart.gaugeSettings.data\"\n" +
    "                            chart-labels=\"$ctrl.performanceChart.gaugeSettings.labels\"\n" +
    "                            chart-legend=\"false\">\n" +
    "                    </canvas>\n" +
    "                </div>\n" +
    "                <div class=\"statistics\">\n" +
    "                    <div class=\"stat-row\">\n" +
    "                        <div class=\"stat-val correct\">{{::$ctrl.exerciseResult.correctAnswersNum}}</div>\n" +
    "                        <div class=\"title\" translate=\".CORRECT\"></div>\n" +
    "                        <div class=\"avg-score\">\n" +
    "                            <span translate=\".AVG_TIME\"\n" +
    "                                  translate-values=\"{\n" +
    "                                    avgTime: $ctrl.statsTime.correctAvgTime\n" +
    "                                  }\">\n" +
    "                            </span>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <div class=\"stat-row\">\n" +
    "                        <div class=\"stat-val wrong\">{{::$ctrl.exerciseResult.wrongAnswersNum}}</div>\n" +
    "                        <div class=\"title\" translate=\".WRONG\"></div>\n" +
    "                        <div class=\"avg-score\">\n" +
    "                            <span translate=\".AVG_TIME\"\n" +
    "                                  translate-values=\"{\n" +
    "                                    avgTime: $ctrl.statsTime.wrongAvgTime\n" +
    "                                  }\">\n" +
    "                            </span>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <div class=\"stat-row\">\n" +
    "                        <div class=\"stat-val skipped\">{{::$ctrl.exerciseResult.skippedAnswersNum}}</div>\n" +
    "                        <div class=\"title\" translate=\".SKIPPED\"></div>\n" +
    "                        <div class=\"avg-score\">\n" +
    "                            <span translate=\".AVG_TIME\"\n" +
    "                                  translate-values=\"{\n" +
    "                                    avgTime: $ctrl.statsTime.skippedAvgTime\n" +
    "                                  }\">\n" +
    "                            </span>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"category-name\">{{$ctrl.categoryName | cutString: 42}}</div>\n" +
    "        </div>\n" +
    "        <div class=\"review-btn-wrapper\">\n" +
    "            <md-button class=\"md-primary znk\"\n" +
    "                       autofocus\n" +
    "                       tabindex=\"1\"\n" +
    "                       md-no-ink\n" +
    "                       ng-cloak\n" +
    "                       ng-click=\"$ctrl.goToSummary()\">\n" +
    "                <span translate=\".REVIEW\"></span>\n" +
    "            </md-button>\n" +
    "        </div>\n" +
    "    </section>\n" +
    "    <section class=\"time-line-wrapper2\"\n" +
    "             ng-class=\"{\n" +
    "                'seen-summary': $ctrl.seenSummary\n" +
    "             }\">\n" +
    "        <div class=\"estimated-score-title\">\n" +
    "            <span translate=\"SUBJECTS.{{$ctrl.exerciseContent.subjectId}}\"></span>\n" +
    "            <span translate=\".ESTIMATED_SCORE\"></span></div>\n" +
    "        <performance-timeline\n" +
    "            on-timeline-finish=\"$ctrl.onTimelineFinish(subjectDelta)\"\n" +
    "            subject-id=\"{{::$ctrl.exerciseContent.subjectId}}\"\n" +
    "            active-exercise-id=\"::$ctrl.exerciseContent.id\">\n" +
    "        </performance-timeline>\n" +
    "    </section>\n" +
    "\n" +
    "    <section class=\"proficiency-level-row animate-if\" ng-if=\"$ctrl.notSeenSummary\">\n" +
    "        <div class=\"proficiency-title-row\" translate=\".MASTERY_LEVEL\"></div>\n" +
    "        <div class=\"row data-row\">\n" +
    "            <div class=\"subject-level\">\n" +
    "                <div class=\"test-score-name\">{{::$ctrl.testScoreMastery.testScorename}}</div>\n" +
    "                <div class=\"subject-progress\">\n" +
    "                    <div class=\"progress\">\n" +
    "                        <div znk-progress-bar progress-width=\"{{::$ctrl.testScoreMastery.progress}}\"\n" +
    "                             show-progress-value=\"false\"></div>\n" +
    "                        <div class=\"title\" translate=\".MASTERY\"></div>\n" +
    "                    </div>\n" +
    "                    <div class=\"progress-val\">\n" +
    "                        {{::$ctrl.testScoreMastery.progress}}%\n" +
    "                        <div class=\"progress-perfect\"\n" +
    "                             ng-class=\"{\n" +
    "                                'bad-score': $ctrl.testScoreDelta<0\n" +
    "                             }\"\n" +
    "                             ng-if=\"$ctrl.testScoreDelta != 0\">\n" +
    "                            <span ng-if=\"$ctrl.testScoreDelta > 0\">+</span>\n" +
    "                            {{$ctrl.testScoreDelta | number : 0}}\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"category-level-wrap\">\n" +
    "                <div class=\"category-level\" ng-repeat=\"(key, category) in $ctrl.categoryMastery\">\n" +
    "                    <div class=\"category-data\">\n" +
    "                        <div class=\"category-level-name\">{{category.name}}</div>\n" +
    "                        <div znk-progress-bar progress-width=\"{{category.progress}}\"\n" +
    "                             progress-value=\"{{category.progress}}\" show-progress-value=\"false\"></div>\n" +
    "                        <div class=\"level\">{{category.mastery}}</div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </section>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/directives/socialSharing/socialSharing.template.html",
    "<div class=\"social-sharing-drv-container\"\n" +
    "     ng-class=\"[vm.showSocialArea.background, vm.animate ? 'social-sharing-drv-container-animate' : '']\"\n" +
    "     ng-if=\"vm.showSocialArea\"\n" +
    "     translate-namespace=\"SOCIAL_SHARING_CONTAINER_DRV\">\n" +
    "    <div class=\"decor\" ng-class=\"vm.showSocialArea.banner1\"></div>\n" +
    "    <div class=\"share-main-container\" ng-switch on=\"vm.showSocialArea.isImproved\">\n" +
    "        <div class=\"social-sharing-title\" translate=\".TITLE\"></div>\n" +
    "        <div class=\"social-text\"\n" +
    "             translate=\".POINTS_TEXT\"\n" +
    "             ng-switch-when=\"false\"\n" +
    "             translate-values=\"{ pts: {{vm.showSocialArea.points}}, subjectName: '{{vm.subjectName}}' }\">\n" +
    "        </div>\n" +
    "        <div class=\"social-text\"\n" +
    "             translate=\".IMPROVED_TEXT\"\n" +
    "             ng-switch-when=\"true\"\n" +
    "             translate-values=\"{ pts: {{vm.showSocialArea.points}}, subjectName: '{{vm.subjectName}}' }\">\n" +
    "        </div>\n" +
    "        <social-share-btn-drv share-data=\"vm.shareData\"></social-share-btn-drv>\n" +
    "    </div>\n" +
    "    <div class=\"decor\" ng-class=\"vm.showSocialArea.banner2\"></div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/svg/correct-icon.svg",
    "<svg version=\"1.1\"\n" +
    "     class=\"correct-icon-svg\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 188.5 129\">\n" +
    "<style type=\"text/css\">\n" +
    "	.correct-icon-svg .st0 {\n" +
    "        fill: none;\n" +
    "        stroke: #231F20;\n" +
    "        stroke-width: 15;\n" +
    "        stroke-linecap: round;\n" +
    "        stroke-linejoin: round;\n" +
    "        stroke-miterlimit: 10;\n" +
    "    }\n" +
    "    .correct-icon-svg {\n" +
    "        width: 100%;\n" +
    "        height: auto;\n" +
    "    }\n" +
    "</style>\n" +
    "<g>\n" +
    "	<line class=\"st0\" x1=\"7.5\" y1=\"62\" x2=\"67\" y2=\"121.5\"/>\n" +
    "	<line class=\"st0\" x1=\"67\" y1=\"121.5\" x2=\"181\" y2=\"7.5\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/svg/wrong-icon.svg",
    "<svg version=\"1.1\"\n" +
    "     class=\"wrong-icon-svg\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 126.5 126.5\"\n" +
    "     style=\"enable-background:new 0 0 126.5 126.5;\"\n" +
    "     xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	.wrong-icon-svg .st0 {\n" +
    "        fill: none;\n" +
    "        stroke: #231F20;\n" +
    "        stroke-width: 15;\n" +
    "        stroke-linecap: round;\n" +
    "        stroke-linejoin: round;\n" +
    "        stroke-miterlimit: 10;\n" +
    "    }\n" +
    "</style>\n" +
    "<g>\n" +
    "	<line class=\"st0\" x1=\"119\" y1=\"7.5\" x2=\"7.5\" y2=\"119\"/>\n" +
    "	<line class=\"st0\" x1=\"7.5\" y1=\"7.5\" x2=\"119\" y2=\"119\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/article.template.html",
    "<div class=\"article-line-numbers\"></div>\n" +
    "    <div class=\"article-content\"></div>\n" +
    "\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/customAnswerBuilderAct.template.html",
    "<div class=\"instructions-title-wrapper\" ng-if=\"d.showFreeTextInstructions\" translate-namespace=\"CUSTOM_ANSWER_BUILDER_ACT\">\n" +
    "    <div class=\"instructions-title\">\n" +
    "        <span translate=\".FREE_TEXT_INSTRUCTIONS\"></span>\n" +
    "        <div class=\"svg-wrapper\">\n" +
    "            <svg-icon name=\"info-icon\"></svg-icon>\n" +
    "            <md-tooltip md-direction=\"top\" class=\"free-text-instructions-tooltip\">\n" +
    "                <span translate=\".FREE_TEXT_INSTRUCTIONS_TOOLTIP\"></span>\n" +
    "                <div class=\"arrow-down\"></div>\n" +
    "            </md-tooltip>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"note-title\" translate=\".FREE_TEXT_NOTICE\"></div>\n" +
    "</div>\n" +
    "<answer-builder> </answer-builder>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/essayQuestion.template.html",
    "<answer-explanation></answer-explanation>\n" +
    "\n" +
    "<div class=\"question-wrapper writing-question-wrapper question-basic-style\">\n" +
    "\n" +
    "    <div class=\"question-container znk-scrollbar\"></div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\">\n" +
    "        <div class=\"question-content\"></div>\n" +
    "        <answer-builder></answer-builder>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/freeTextAnswer.template.html",
    "<div class=\"free-text-answer-wrapper\"\n" +
    "     ng-switch=\"showCorrectAnswer\"\n" +
    "     translate-namespace=\"FREE_TEXT_ANSWER\">\n" +
    "\n" +
    "    <div ng-switch-when=\"true\" class=\"answer-status-wrapper\" ng-class=\"userAnswerStatus\">\n" +
    "        <div class=\"answer-status\">\n" +
    "            <div class=\"user-answer\">{{d.userAnswer}}</div>\n" +
    "            <svg-icon class=\"correct-icon\" name=\"correct\"></svg-icon>\n" +
    "            <svg-icon class=\"wrong-icon\" name=\"wrong-icon\"></svg-icon>\n" +
    "        </div>\n" +
    "        <div class=\"correct-answer\">\n" +
    "            <span translate=\".CORRECT_ANSWER\"></span>\n" +
    "            <span>{{correctAnswer}}</span>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div  ng-switch-when=\"false\" class=\"input-wrapper\">\n" +
    "        <input ng-model-options=\"{ getterSetter: true }\" ng-model=\"d.userAnswerGetterSetter\">\n" +
    "        <div class=\"arrow-wrapper\" ng-click=\"clickHandler()\">\n" +
    "            <svg-icon name=\"arrow-icon\"></svg-icon>\n" +
    "            <div class=\"svg-back\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/lectureQuestion.template.html",
    "<div class=\"lecture-question-wrapper\" ng-switch=\"vm.question.typeId\">\n" +
    "    <div class=\"img-wrapper\" ng-switch-when=\"1\">\n" +
    "        <img  ng-src=\"{{vm.question.fileUrl}}\">\n" +
    "    </div>\n" +
    "    <!--<div ng-switch-when=\"1\"> wait for the second type</div> -->\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/mathQuestion.template.html",
    "<answer-explanation></answer-explanation>\n" +
    "\n" +
    "<div class=\"math-question-wrapper\" image-zoomer>\n" +
    "\n" +
    "    <div class=\"question-container\"></div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\">\n" +
    "        <div class=\"answer-content\"></div>\n" +
    "        <custom-answer-builder-act></custom-answer-builder-act>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/rateAnswer.template.html",
    "<div class=\"rate-answer-wrapper\">\n" +
    "    <div class=\"checkbox-items-wrapper\" >\n" +
    "        <div class=\"item-repeater\" ng-repeat=\"item in d.itemsArray track by $index\">\n" +
    "            <svg-icon class=\"correct-icon\" name=\"correct-icon\"></svg-icon>\n" +
    "            <svg-icon class=\"wrong-icon\" name=\"wrong-icon\"></svg-icon>\n" +
    "            <div class=\"checkbox-item\" ng-click=\"clickHandler($index)\">\n" +
    "                <div class=\"item-index\">{{$index +  2}}</div>\n" +
    "            </div>\n" +
    "            <div class=\"correct-answer-line\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/readingQuestion.template.html",
    "<answer-explanation></answer-explanation>\n" +
    "\n" +
    "<div class=\"question-wrapper reading-question-wrapper question-basic-style\" image-zoomer>\n" +
    "\n" +
    "    <div class=\"question-container znk-scrollbar\">\n" +
    "        <div class=\"passage-title\">{{::vm.passageTitle}}</div>\n" +
    "        <div class=\"article\">\n" +
    "            <div class=\"article-content\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\">\n" +
    "        <div class=\"question-content\"></div>\n" +
    "        <answer-builder></answer-builder>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/selectAnswer.template.html",
    "<div ng-repeat=\"answer in ::d.answers track by answer.id\"\n" +
    "     class=\"answer\"\n" +
    "     ng-click=\"d.click(answer)\"\n" +
    "     tabindex=\"-1\">\n" +
    "    <div class=\"content-wrapper\">\n" +
    "        <div class=\"answer-index-wrapper\">\n" +
    "            <span class=\"index-char\">{{::d.getIndexChar($index)}}</span>\n" +
    "        </div>\n" +
    "        <markup content=\"answer.content\" type=\"md\" class=\"content\"></markup>\n" +
    "        <svg-icon class=\"correct-icon-drv\" name=\"correct-icon\"></svg-icon>\n" +
    "        <svg-icon class=\"wrong-icon-drv\" name=\"wrong-icon\"></svg-icon>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/simpleQuestion.template.html",
    "<answer-explanation></answer-explanation>\n" +
    "\n" +
    "<div class=\"question-wrapper simple-question-wrapper question-basic-style\" image-zoomer>\n" +
    "\n" +
    "        <div class=\"answer-container znk-scrollbar\">\n" +
    "            <div class=\"question-content\"></div>\n" +
    "            <custom-answer-builder-act></custom-answer-builder-act>\n" +
    "        </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/writingFullPassage.template.html",
    "<answer-explanation></answer-explanation>\n" +
    "\n" +
    "<answer-explanation></answer-explanation>\n" +
    "\n" +
    "<div class=\"question-wrapper english-full-paragraphs-wrapper question-basic-style\" image-zoomer>\n" +
    "\n" +
    "    <div class=\"question-container znk-scrollbar\">\n" +
    "        <div class=\"paragraph-title\"></div>\n" +
    "\n" +
    "        <div class=\"paragraphs-wrapper\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"answer-container znk-scrollbar\">\n" +
    "        <div class=\"question-content\"></div>\n" +
    "        <answer-builder></answer-builder>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/completeExerciseAct/templates/writingSpecificParagraph.template.html",
    "<answer-explanation></answer-explanation>\n" +
    "\n" +
    "<div class=\"question-wrapper writing-specific-paragraph-wrapper question-basic-style\" translate-namespace=\"WRITING_SPECIFIC_PARAGRAPH\">\n" +
    "\n" +
    "    <div class=\"specific-paragraph-view-wrapper\" ng-show=\"vm.view === vm.SPECIFIC_PARAGRAPH\" image-zoomer>\n" +
    "        <div class=\"question-container znk-scrollbar\">\n" +
    "            <div class=\"full-passage-link\" ng-bind-html=\"vm.question.groupData.name\" ng-click=\"vm.view = vm.FULL_PASSAGE\"></div>\n" +
    "            <div class=\"paragraph-title\"></div>\n" +
    "            <div class=\"paragraph\"></div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"answer-container znk-scrollbar\">\n" +
    "            <div class=\"question-content\"></div>\n" +
    "            <answer-builder></answer-builder>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"full-passage-view-wrapper \" ng-show=\"vm.view === vm.FULL_PASSAGE\" image-zoomer>\n" +
    "\n" +
    "        <div class=\"passage-title\">\n" +
    "            <div ng-bind-html=\"vm.question.groupData.name\"></div>\n" +
    "            <div class=\"back-to-question-link\" ng-click=\"vm.view = vm.SPECIFIC_PARAGRAPH\">\n" +
    "                <i class=\"material-icons chevron-left\">chevron_left</i>\n" +
    "                <div class=\"back-to-question\" translate=\".BACK_TO_QUESTION\"></div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"full-passage-wrapper znk-scrollbar\">\n" +
    "            <div class=\"full-passage\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.configAct', []);
})(angular);

(function () {
    'use strict';

    angular.module('znk.infra-act.configAct')
        .decorator('EstimatedScoreSrv', ["$delegate", "ScoringService", function ($delegate, ScoringService) {
            'ngInject';

            var decoratedEstimatedScoreSrv = $delegate;

            var getEstimatedScoresFn = $delegate.getEstimatedScores;

            decoratedEstimatedScoreSrv.getEstimatedScores = function () {
                return $delegate.getLatestEstimatedScore().then(function (latestScores) {
                    var estimatedScores = {};
                    angular.forEach(latestScores, function (estimatedScore, subjectId) {
                        estimatedScores[subjectId] = Math.round(estimatedScore.score) || 0;
                    });
                    return estimatedScores;
                });
            };

            decoratedEstimatedScoreSrv.getEstimatedScoresData = function () {
                return getEstimatedScoresFn.apply($delegate).then(function (estimatedScoresData) {
                    var estimatedScores = {};
                    angular.forEach(estimatedScoresData, function (estimatedScore, subjectId) {
                        estimatedScores[subjectId] = [];
                        angular.forEach(estimatedScore, function (value) {
                            value.score = Math.round(value.score) || 0;
                            estimatedScores[subjectId].push(value);
                        });
                    });
                    return estimatedScores;
                });
            };

            decoratedEstimatedScoreSrv.getCompositeScore = function () {    // todo: delete this fn?
                return $delegate.getLatestEstimatedScore().then(function (estimatedScores) {
                    var scoresArr = [];
                    angular.forEach(estimatedScores, function (estimatesScoreForSubject) {
                        scoresArr.push(estimatesScoreForSubject.score || 0);
                    });
                    return ScoringService.getTotalScoreResult(scoresArr);
                });
            };

            return decoratedEstimatedScoreSrv;
        }]);
})();

angular.module('znk.infra-act.configSat').run(['$templateCache', function($templateCache) {

}]);

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

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.exerciseUtilityAct', []);
})(angular);

(function(angular){
    'use strict';

    angular.module('znk.infra-act.exerciseUtilityAct')
        .service('TestScoreCategoryEnum',["EnumSrv", function(EnumSrv) {
            'ngInject';

            var testScoreCategoryEnum = new EnumSrv.BaseEnum([
                ['MATH', 9, 'math'],
                ['READING', 10, 'reading'],
                ['WRITING', 11, 'writing'],
                ['ESSAY', 12, 'essay']
            ]);
            return testScoreCategoryEnum;
        }]);
})(angular);

(function(angular){
    'use strict';

    angular.module('znk.infra-act.exerciseUtilityAct')
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

angular.module('znk.infra-act.exerciseUtilityAct').run(['$templateCache', function($templateCache) {

}]);

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
        .config(["TimelineSrvProvider", function timelineConfig(TimelineSrvProvider) {
            'ngInject';

            TimelineSrvProvider.setColors({
                0: '#AF89D2', 7: '#F9D41B'
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

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.userGoals', [
        'znk.infra-act.auth'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra-act.userGoals')
        .service('UserGoalsService', ["StorageFirebaseAdapter", "StorageSrv", "ENV", "$q", "AuthService", function (StorageFirebaseAdapter, StorageSrv, ENV, $q, AuthService) {
            'ngInject';

            var fbAdapter = new StorageFirebaseAdapter(ENV.fbDataEndPoint);
            var config = {
                variables: {
                    uid: AuthService.getAuth().uid
                }
            };
            var storage = new StorageSrv(fbAdapter, config);
            var goalsPath = StorageSrv.variables.appUserSpacePath + '/goals';
            var defaultSubjectScore = 600;
            var self = this;

            this.getGoals = function () {
                return storage.get(goalsPath).then(function (userGoals) {
                    if (angular.equals(userGoals, {})) {
                        userGoals = _defaultUserGoals();
                    }
                    return userGoals;
                });
            };

            this.setGoals = function (newGoals) {
                if (arguments.length && angular.isDefined(newGoals)) {
                    return storage.set(goalsPath, newGoals);
                }
                return storage.get(goalsPath).then(function (userGoals) {
                    if (!userGoals.goals) {
                        userGoals.goals = {
                            isCompleted: false,
                            verbal: defaultSubjectScore,
                            math: defaultSubjectScore,
                            totalScore: defaultSubjectScore * 2
                        };
                    }
                    return userGoals;
                });
            };

            this.calcCompositeScore = function (userSchools, save) {
                // The calculation for composite score in ACT:
                // 1. For each school in US, we have min & max score
                // 2. Calc the average score for each school and set it for each subject goal

                return this.getGoals().then(function (userGoals) {
                    var minSchoolScore = 400,
                        maxSchoolScore = 1600,
                        avgScores = [];

                    angular.forEach(userSchools, function (school) {
                        var school25th = isNaN(school.total25th) ? minSchoolScore : school.total25th;
                        var school75th = isNaN(school.total75th) ? maxSchoolScore : school.total75th;
                        avgScores.push((school25th * 0.25) + (school75th * 0.75));
                    });

                    var avgSchoolsScore;
                    if (avgScores.length) {
                        avgSchoolsScore = avgScores.reduce(function (a, b) {
                            return a + b;
                        });
                        avgSchoolsScore = Math.round(avgSchoolsScore / avgScores.length);
                    } else {
                        avgSchoolsScore = defaultSubjectScore;
                    }

                    userGoals = {
                        isCompleted: false,
                        verbal: avgSchoolsScore || defaultSubjectScore,
                        math: avgSchoolsScore || defaultSubjectScore
                    };

                    userGoals.totalScore = averageSubjectsGoal(userGoals);
                    var prom = save ? self.setGoals(userGoals) : $q.when(userGoals);
                    return prom;
                });
            };

            function _defaultUserGoals() {
                return {
                    isCompleted: false,
                    verbal: defaultSubjectScore,
                    math: defaultSubjectScore,
                    totalScore: defaultSubjectScore * 2
                };
            }

            function averageSubjectsGoal(goals) {
                var math = goals.math || defaultSubjectScore;
                var verbal = goals.english || defaultSubjectScore;
                return Math.round((math + verbal) / 2);
            }
        }]);
})(angular);

angular.module('znk.infra-act.userGoals').run(['$templateCache', function($templateCache) {

}]);