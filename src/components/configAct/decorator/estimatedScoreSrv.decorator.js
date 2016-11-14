(function () {
    'use strict';

    angular.module('znk.infra-act.configAct')
        .decorator('EstimatedScoreSrv', function ($delegate, ScoringService, SubjectEnum) {
            'ngInject';

            var decoratedEstimatedScoreSrv = $delegate;

            decoratedEstimatedScoreSrv.getCompositeScore = function () {
                return $delegate.getLatestEstimatedScore().then(function (estimatedScores) {
                    var scoresArr = [];
                    angular.forEach(estimatedScores, function (estimatesScoreForSubject, subjectId) {
                        if (+subjectId !== SubjectEnum.WRITING.enum) {
                            scoresArr.push(estimatesScoreForSubject.score || 0);
                        }
                    });
                    return ScoringService.getScoreCompositeResult(scoresArr);
                });
            };

            return decoratedEstimatedScoreSrv;
        });
})();
