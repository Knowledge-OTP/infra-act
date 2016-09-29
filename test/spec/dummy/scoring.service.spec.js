describe('testing scoring service:', function () {
    beforeEach(angular.mock.module('znk.infra-act.examUtility', 'znk.infra.exerciseUtility', 'pascalprecht.translate', 'testScoring.mock', 'auth.mock'));
    beforeEach(angular.mock.module('pascalprecht.translate', function ($translateProvider) {
        $translateProvider.translations('en', {});
    }));
    beforeEach(angular.mock.module(function ($provide) {
        $provide.service('StorageRevSrv', function ($q, TestScoring) {
            return {
                getContent: function (data) {
                    if (data.exerciseType === 'sub_score_map') {
                        return $q.when(TestScoring.sub_score_map);
                    }
                    return $q.when(TestScoring.scoreTable);
                }
            };
        });
    }));

    var $rootScope;
    var scoreObj, scoreProm;
    var results = {
        subjectId: 5,
        typeId: 1,
        questions: [
            {
                id: 12544,
                categoryId: 155
            },
            {
                id: 12544,
                categoryId: 155
            },
            {
                id: 12544,
                categoryId: 172
            },
            {
                id: 12544,
                categoryId: 172
            },
            {
                id: 12544,
                categoryId: 172
            },
            {
                id: 12544,
                categoryId: 172
            },
            {
                id: 12544,
                categoryId: 172
            },
            {
                id: 12544,
                categoryId: 172
            },
            {
                id: 12544,
                categoryId: 172
            },
            {
                id: 12544,
                categoryId: 172
            }

        ],
        answers: [
            {
                userAnswerId: 12544,
                isAnswerCorrectly: 0
            },
            {
                userAnswerId: 12544,
                isAnswerCorrectly: 0
            },
            {
                userAnswerId: 12544,
                isAnswerCorrectly: 0
            },
            {
                userAnswerId: 12544,
                isAnswerCorrectly: 0
            },
            {
                userAnswerId: 12544,
                isAnswerCorrectly: 0
            },
            {
                userAnswerId: 12544,
                isAnswerCorrectly: 0
            },
            {
                userAnswerId: 12544,
                isAnswerCorrectly: 0
            },
            {
                userAnswerId: 12544,
                isAnswerCorrectly: 1
            },
            {
                userAnswerId: 12544,
                isAnswerCorrectly: 1
            },
            {
                userAnswerId: 12544,
                isAnswerCorrectly: 1
            }
        ]
    };
    var ScoringService;

    var scoreResults = [36, 22, 16, 0];
    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            ScoringService = $injector.get('ScoringService');
        }
    ]));


    it('check whether the result for score section is correct ', function () {
        scoreProm = ScoringService.getScoreSectionResult(results);
        scoreProm.then(function (data) {
            scoreObj = data;
            //   console.log(data);
        });
        $rootScope.$digest();
        expect(scoreObj.scoreSection).toEqual(8);// when all answers are correct should be 23
                                                 // expect(10).toEqual(10)
    });
    it('check whether the result for score sub section are correct ', function () {
        scoreProm = ScoringService.getSubScoreResult(results);
        scoreProm.then(function (data) {
            scoreObj = data;            // console.log(scoreObj.subScoresArr);
        });
        $rootScope.$digest();
        expect(scoreObj.scoreSubTotal)
            .toEqual((results.subjectId !== 6 && results.subjectId !== 2) ? 3 : 0);
    });
    it('check whether the average for the score sections are correct ', function () {
        scoreProm = ScoringService.getScoreCompositeResult(scoreResults);
        scoreProm.then(function (data) {
            scoreObj = data;
        });
        $rootScope.$digest();
        expect(scoreObj.compositeScoreResults).toEqual(19);
    });
})
;
